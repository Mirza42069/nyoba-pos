import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	products: defineTable({
		name: v.string(),
		sku: v.string(),
		category: v.string(),
		price: v.number(), // rupiah utuh
		stock: v.number(),
		lowStockThreshold: v.number(),
		active: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_active", ["active"])
		.index("by_category", ["category"])
		.index("by_sku", ["sku"]),

	orders: defineTable({
		number: v.number(),
		items: v.array(
			v.object({
				productId: v.id("products"),
				name: v.string(),
				price: v.number(),
				qty: v.number(),
			}),
		),
		subtotal: v.number(),
		discount: v.number(),
		tax: v.number(),
		total: v.number(),
		paymentMethod: v.union(v.literal("cash"), v.literal("card")),
		cashReceived: v.optional(v.number()),
		change: v.optional(v.number()),
		status: v.union(v.literal("completed"), v.literal("refunded")),
		createdAt: v.number(),
	}).index("by_createdAt", ["createdAt"]),
});
