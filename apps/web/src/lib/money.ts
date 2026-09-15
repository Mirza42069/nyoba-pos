export { formatRupiah, TAX_RATE } from "@my-better-t-app/backend/convex/shared";

export const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
	timeZone: "Asia/Jakarta",
});

export const dayFmt = new Intl.DateTimeFormat("id-ID", {
	weekday: "short",
	day: "numeric",
	month: "short",
	timeZone: "Asia/Jakarta",
});

export function formatDate(ms: number): string {
	return dateTimeFmt.format(new Date(ms));
}

export function errorText(err: unknown): string {
	const e = err as { data?: unknown; message?: string };
	return typeof e?.data === "string" ? e.data : (e?.message ?? "Terjadi kesalahan");
}
