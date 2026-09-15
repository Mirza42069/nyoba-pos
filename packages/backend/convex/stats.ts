import { v } from "convex/values";
import { query } from "./_generated/server";
import { DAY_MS, startOfWibDay } from "./shared";

export const dashboard = query({
	args: { now: v.number() },
	handler: async (ctx, { now }) => {
		const weekAgo = startOfWibDay(now) - 6 * DAY_MS;
		const orders = await ctx.db
			.query("orders")
			.withIndex("by_createdAt", (q) => q.gte("createdAt", weekAgo))
			.collect();
		const paid = orders.filter((o) => o.status === "completed");

		const todayStart = startOfWibDay(now);
		const todayOrders = paid.filter((o) => o.createdAt >= todayStart);
		const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

		const series = Array.from({ length: 7 }, (_, i) => {
			const dayStart = weekAgo + i * DAY_MS;
			const dayOrders = paid.filter(
				(o) => o.createdAt >= dayStart && o.createdAt < dayStart + DAY_MS,
			);
			return {
				dayStart,
				revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
				count: dayOrders.length,
			};
		});

		const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
		for (const order of paid) {
			for (const item of order.items) {
				const entry = productMap.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
				entry.qty += item.qty;
				entry.revenue += item.price * item.qty;
				productMap.set(item.productId, entry);
			}
		}
		const topProducts = [...productMap.entries()]
			.map(([productId, entry]) => ({ productId, ...entry }))
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 5);

		const products = await ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).collect();
		const lowStock = products
			.filter((p) => p.stock <= p.lowStockThreshold)
			.sort((a, b) => a.stock - b.stock);

		return {
			todayRevenue,
			todayCount: todayOrders.length,
			avgTicket: todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0,
			series,
			topProducts,
			lowStock,
		};
	},
});
