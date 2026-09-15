import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { TAX_RATE, DAY_MS } from "./shared";

const CATALOG: Array<{
	name: string;
	sku: string;
	category: string;
	price: number;
	stock: number;
	lowStockThreshold: number;
}> = [
	{ name: "Nasi Goreng Spesial", sku: "MKN-001", category: "Makanan", price: 18000, stock: 40, lowStockThreshold: 10 },
	{ name: "Mie Goreng", sku: "MKN-002", category: "Makanan", price: 15000, stock: 35, lowStockThreshold: 10 },
	{ name: "Ayam Geprek", sku: "MKN-003", category: "Makanan", price: 22000, stock: 25, lowStockThreshold: 8 },
	{ name: "Bakso Kuah", sku: "MKN-004", category: "Makanan", price: 18000, stock: 30, lowStockThreshold: 8 },
	{ name: "Roti Bakar Cokelat", sku: "MKN-005", category: "Makanan", price: 12000, stock: 20, lowStockThreshold: 6 },
	{ name: "Pisang Goreng (3)", sku: "MKN-006", category: "Makanan", price: 10000, stock: 8, lowStockThreshold: 10 },

	{ name: "Es Teh Manis", sku: "MNM-001", category: "Minuman", price: 5000, stock: 120, lowStockThreshold: 24 },
	{ name: "Kopi Susu Gula Aren", sku: "MNM-002", category: "Minuman", price: 18000, stock: 60, lowStockThreshold: 12 },
	{ name: "Es Jeruk", sku: "MNM-003", category: "Minuman", price: 8000, stock: 80, lowStockThreshold: 16 },
	{ name: "Air Mineral 600ml", sku: "MNM-004", category: "Minuman", price: 4000, stock: 150, lowStockThreshold: 30 },
	{ name: "Teh Botol Sosro", sku: "MNM-005", category: "Minuman", price: 6000, stock: 90, lowStockThreshold: 18 },
	{ name: "Es Kopi Susu", sku: "MNM-006", category: "Minuman", price: 20000, stock: 9, lowStockThreshold: 12 },

	{ name: "Indomie Goreng", sku: "SNK-001", category: "Snack", price: 3500, stock: 200, lowStockThreshold: 40 },
	{ name: "Chitato Sapi Panggang", sku: "SNK-002", category: "Snack", price: 12000, stock: 45, lowStockThreshold: 10 },
	{ name: "Oreo Original", sku: "SNK-003", category: "Snack", price: 9000, stock: 50, lowStockThreshold: 12 },
	{ name: "SilverQueen Chunky Bar", sku: "SNK-004", category: "Snack", price: 18000, stock: 28, lowStockThreshold: 8 },
	{ name: "Beng-Beng", sku: "SNK-005", category: "Snack", price: 2500, stock: 100, lowStockThreshold: 20 },
	{ name: "Taro Net Seaweed", sku: "SNK-006", category: "Snack", price: 8000, stock: 5, lowStockThreshold: 10 },

	{ name: "Beras Premium 5kg", sku: "SMB-001", category: "Sembako", price: 72000, stock: 30, lowStockThreshold: 6 },
	{ name: "Gula Pasir 1kg", sku: "SMB-002", category: "Sembako", price: 18000, stock: 40, lowStockThreshold: 8 },
	{ name: "Minyak Goreng 1L", sku: "SMB-003", category: "Sembako", price: 19000, stock: 45, lowStockThreshold: 10 },
	{ name: "Telur Ayam 1kg", sku: "SMB-004", category: "Sembako", price: 29000, stock: 35, lowStockThreshold: 8 },
	{ name: "Tepung Terigu 1kg", sku: "SMB-005", category: "Sembako", price: 13000, stock: 25, lowStockThreshold: 6 },

	{ name: "Sabun Mandi Lifebuoy", sku: "KBR-001", category: "Kebersihan", price: 5500, stock: 60, lowStockThreshold: 12 },
	{ name: "Pasta Gigi Pepsodent", sku: "KBR-002", category: "Kebersihan", price: 18000, stock: 40, lowStockThreshold: 8 },
	{ name: "Deterjen Rinso 800g", sku: "KBR-003", category: "Kebersihan", price: 25000, stock: 22, lowStockThreshold: 6 },
	{ name: "Tisu Paseo 250 sheet", sku: "KBR-004", category: "Kebersihan", price: 15000, stock: 4, lowStockThreshold: 8 },
];

// LCG — supaya data demo deterministik
function makeRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
}

export const seed = mutation({
	args: {},
	returns: v.object({ seeded: v.boolean() }),
	handler: async (ctx) => {
		const existing = await ctx.db.query("products").first();
		if (existing) return { seeded: false };

		const now = Date.now();
		const inserted: Array<Id<"products">> = [];
		for (const item of CATALOG) {
			const id = await ctx.db.insert("products", {
				...item,
				active: true,
				createdAt: now,
				updatedAt: now,
			});
			inserted.push(id);
		}

		// ~60 pesanan demo selama 7 hari terakhir
		const rand = makeRandom(42);
		const catalog = CATALOG.map((item, i) => ({ ...item, id: inserted[i] }));
		let number = 0;
		for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
			const ordersToday = 6 + Math.floor(rand() * 6);
			for (let n = 0; n < ordersToday; n++) {
				const itemCount = 1 + Math.floor(rand() * 4);
				const items = [];
				for (let i = 0; i < itemCount; i++) {
					const product = catalog[Math.floor(rand() * catalog.length)];
					items.push({
						productId: product.id,
						name: product.name,
						price: product.price,
						qty: 1 + Math.floor(rand() * 3),
					});
				}
				const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
				const discount = rand() < 0.15 ? Math.round(subtotal * 0.1) : 0;
				const taxable = subtotal - discount;
				const tax = Math.round(taxable * TAX_RATE);
				const total = taxable + tax;
				const paymentMethod = rand() < 0.6 ? "cash" : "card";
				const cashReceived =
					paymentMethod === "cash"
						? Math.ceil(total / 5000) * 5000
						: undefined;
				number++;
				await ctx.db.insert("orders", {
					number,
					items,
					subtotal,
					discount,
					tax,
					total,
					paymentMethod,
					cashReceived,
					change: cashReceived !== undefined ? cashReceived - total : undefined,
					status: "completed",
					createdAt:
						now - dayOffset * DAY_MS - Math.floor(rand() * 12 * 60 * 60 * 1000),
				});
			}
		}

		return { seeded: true };
	},
});
