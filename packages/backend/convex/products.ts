import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const productFields = {
	name: v.string(),
	sku: v.string(),
	category: v.string(),
	price: v.number(),
	stock: v.number(),
	lowStockThreshold: v.number(),
};

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).collect();
	},
});

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("products").collect();
	},
});

export const categories = query({
	args: {},
	handler: async (ctx) => {
		const products = await ctx.db.query("products").collect();
		return [...new Set(products.map((p) => p.category))].sort();
	},
});

export const create = mutation({
	args: productFields,
	handler: async (ctx, args) => {
		const now = Date.now();
		return await ctx.db.insert("products", {
			...args,
			active: true,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: { id: v.id("products"), ...productFields, active: v.boolean() },
	handler: async (ctx, { id, ...patch }) => {
		await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
	},
});

export const adjustStock = mutation({
	args: { id: v.id("products"), delta: v.number() },
	handler: async (ctx, { id, delta }) => {
		const product = await ctx.db.get(id);
		if (!product) throw new Error("Produk tidak ditemukan");
		const stock = Math.max(0, product.stock + delta);
		await ctx.db.patch(id, { stock, updatedAt: Date.now() });
	},
});

export const setActive = mutation({
	args: { id: v.id("products"), active: v.boolean() },
	handler: async (ctx, { id, active }) => {
		await ctx.db.patch(id, { active, updatedAt: Date.now() });
	},
});

export const remove = mutation({
	args: { id: v.id("products") },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id);
	},
});
