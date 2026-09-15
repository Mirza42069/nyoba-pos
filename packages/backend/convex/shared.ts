// Konstanta bisnis — PPN Indonesia
export const TAX_RATE = 0.11;

// WIB = UTC+7
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function startOfWibDay(now: number): number {
	return Math.floor((now + WIB_OFFSET_MS) / 86_400_000) * 86_400_000 - WIB_OFFSET_MS;
}

export const DAY_MS = 86_400_000;

export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}
