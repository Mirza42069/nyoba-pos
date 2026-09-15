import { Effect, Data } from "effect";
import { v, ConvexError } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { TAX_RATE } from "./shared";

// ---------------------------------------------------------------------------
// Domain errors (Effect typed)
// ---------------------------------------------------------------------------

class ProductNotFound extends Data.TaggedError("ProductNotFound")<{
	productId: string;
}> {}

class InsufficientStock extends Data.TaggedError("InsufficientStock")<{
	name: string;
	available: number;
	requested: number;
}> {}

class CheckoutError extends Data.TaggedError("CheckoutError")<{
	message: string;
}> {}

// ---------------------------------------------------------------------------
// Effect pipeline
// ---------------------------------------------------------------------------

interface Line {
	product: Doc<"products">;
	qty: number;
	lineTotal: number;
}

interface Totals {
	subtotal: number;
	discount: number;
	tax: number;
	total: number;
}

const loadProduct = (ctx: MutationCtx, productId: Id<"products">, qty: number) =>
	Effect.tryPromise({
		try: () => ctx.db.get(productId),
		catch: () => new ProductNotFound({ productId }),
	}).pipe(
		Effect.filterOrFail(
			(product) => product !== null,
			() => new ProductNotFound({ productId }),
		),
		Effect.map((product) => product as Doc<"products">),
		Effect.filterOrFail(
			(product) => product.stock >= qty,
			(product) => new InsufficientStock({ name: product.name, available: product.stock, requested: qty }),
		),
	);

const computeTotals = (lines: Line[], discount: number): Totals => {
	const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
	const taxable = Math.max(0, subtotal - discount);
	const tax = Math.round(taxable * TAX_RATE);
	return { subtotal, discount: subtotal - taxable, tax, total: taxable + tax };
};

const validateCash = (cashReceived: number | undefined, total: number) =>
	cashReceived === undefined
		? Effect.fail(new CheckoutError({ message: "Uang tunai wajib diisi" }))
		: cashReceived < total
			? Effect.fail(
					new CheckoutError({ message: "Uang tunai kurang dari total tagihan" }),
				)
			: Effect.succeed(cashReceived - total);

const checkout = (
	ctx: MutationCtx,
	args: {
		items: { productId: Id<"products">; qty: number }[];
		discount: number;
		paymentMethod: "cash" | "card";
		cashReceived?: number;
	},
) =>
	Effect.gen(function* () {
		if (args.items.length === 0) {
			return yield* Effect.fail(new CheckoutError({ message: "Keranjang kosong" }));
		}
		if (args.items.some((i) => !Number.isInteger(i.qty) || i.qty < 1)) {
			return yield* Effect.fail(new CheckoutError({ message: "Jumlah item tidak valid" }));
		}

		const lines: Line[] = [];
		for (const item of args.items) {
			const product = yield* loadProduct(ctx, item.productId, item.qty);
			lines.push({ product, qty: item.qty, lineTotal: product.price * item.qty });
		}

		const totals = computeTotals(lines, args.discount);
		const change =
			args.paymentMethod === "cash"
				? yield* validateCash(args.cashReceived, totals.total)
				: undefined;

		const latest = yield* Effect.tryPromise({
			try: () =>
				ctx.db.query("orders").withIndex("by_createdAt").order("desc").first(),
			catch: () => new CheckoutError({ message: "Gagal membaca data pesanan" }),
		});
		const number = (latest?.number ?? 0) + 1;
		const now = Date.now();

		const orderId = yield* Effect.tryPromise({
			try: () =>
				ctx.db.insert("orders", {
					number,
					items: lines.map((l) => ({
						productId: l.product._id,
						name: l.product.name,
						price: l.product.price,
						qty: l.qty,
					})),
					...totals,
					paymentMethod: args.paymentMethod,
					cashReceived: args.paymentMethod === "cash" ? args.cashReceived : undefined,
					change,
					status: "completed" as const,
					createdAt: now,
				}),
			catch: () => new CheckoutError({ message: "Gagal menyimpan pesanan" }),
		});

		yield* Effect.forEach(
			lines,
			(line) =>
				Effect.tryPromise({
					try: () =>
						ctx.db.patch(line.product._id, {
							stock: line.product.stock - line.qty,
							updatedAt: now,
						}),
					catch: () => new CheckoutError({ message: "Gagal memperbarui stok" }),
				}),
			{ discard: true },
		);

		return { orderId, number, ...totals, change };
	});

const toConvexError = (error: unknown): never => {
	if (error instanceof ProductNotFound) {
		throw new ConvexError("Produk tidak ditemukan di katalog");
	}
	if (error instanceof InsufficientStock) {
		throw new ConvexError(
			`Stok ${error.name} tersisa ${error.available}, diminta ${error.requested}`,
		);
	}
	if (error instanceof CheckoutError) {
		throw new ConvexError(error.message);
	}
	throw error;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const create = mutation({
	args: {
		items: v.array(v.object({ productId: v.id("products"), qty: v.number() })),
		discount: v.number(),
		paymentMethod: v.union(v.literal("cash"), v.literal("card")),
		cashReceived: v.optional(v.number()),
	},
	returns: v.object({
		orderId: v.id("orders"),
		number: v.number(),
		subtotal: v.number(),
		discount: v.number(),
		tax: v.number(),
		total: v.number(),
		change: v.optional(v.number()),
	}),
	handler: (ctx, args) =>
		Effect.runPromise(
			checkout(ctx, args).pipe(
				Effect.mapError((error) => toConvexError(error)),
			),
		),
});

export const refund = mutation({
	args: { id: v.id("orders") },
	handler: async (ctx, { id }) => {
		const order = await ctx.db.get(id);
		if (!order || order.status === "refunded") return;
		const now = Date.now();
		for (const item of order.items) {
			const product = await ctx.db.get(item.productId);
			if (product) {
				await ctx.db.patch(product._id, {
					stock: product.stock + item.qty,
					updatedAt: now,
				});
			}
		}
		await ctx.db.patch(id, { status: "refunded" });
	},
});

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("orders")
			.withIndex("by_createdAt")
			.order("desc")
			.take(200);
	},
});

export const get = query({
	args: { id: v.id("orders") },
	handler: async (ctx, { id }) => {
		return await ctx.db.get(id);
	},
});
