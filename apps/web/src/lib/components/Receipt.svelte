<script lang="ts" module>
	export interface ReceiptOrder {
		number: number;
		createdAt: number;
		items: { name: string; price: number; qty: number }[];
		subtotal: number;
		discount: number;
		tax: number;
		total: number;
		paymentMethod: 'cash' | 'card';
		cashReceived?: number;
		change?: number;
		status: 'completed' | 'refunded';
	}
</script>

<script lang="ts">
	import { formatRupiah, formatDate } from '$lib/money';

	let { order }: { order: ReceiptOrder } = $props();
</script>

<div class="print-area mx-auto w-full max-w-xs font-mono text-[13px] leading-relaxed">
	<div class="text-center">
		<div class="text-lg font-bold tracking-widest">VERDANT MARKET</div>
		<div class="text-muted-foreground text-xs">Jl. Melati Raya 12, Jakarta Selatan</div>
		<div class="text-muted-foreground text-xs">+62 21 555 0123</div>
	</div>

	<div class="my-3 border-t border-dashed border-foreground/40"></div>

	<div class="flex justify-between text-xs">
		<span>No. {String(order.number).padStart(5, "0")}</span>
		<span>{formatDate(order.createdAt)}</span>
	</div>

	<div class="my-3 border-t border-dashed border-foreground/40"></div>

	<ul class="space-y-1.5">
		{#each order.items as item (item.name)}
			<li>
				<div class="flex justify-between gap-2">
					<span class="truncate">
						<span class="font-semibold">{item.qty}</span> × {item.name}</span
					>
					<span class="tabular-nums">{formatRupiah(item.price * item.qty)}</span>
				</div>
				<div class="text-muted-foreground text-[11px]">@ {formatRupiah(item.price)}</div>
			</li>
		{/each}
	</ul>

	<div class="my-3 border-t border-dashed border-foreground/40"></div>

	<div class="space-y-0.5">
		<div class="flex justify-between"><span>Subtotal</span><span class="tabular-nums">{formatRupiah(order.subtotal)}</span></div>
		{#if order.discount > 0}
			<div class="flex justify-between"><span>Diskon</span><span class="tabular-nums">−{formatRupiah(order.discount)}</span></div>
		{/if}
		<div class="flex justify-between"><span>PPN 11%</span><span class="tabular-nums">{formatRupiah(order.tax)}</span></div>
		<div class="mt-1 flex justify-between border-t border-foreground/40 pt-1.5 text-base font-bold">
			<span>TOTAL</span><span class="tabular-nums">{formatRupiah(order.total)}</span>
		</div>
	</div>

	<div class="my-3 border-t border-dashed border-foreground/40"></div>

	<div class="space-y-0.5">
		<div class="flex justify-between">
			<span>{order.paymentMethod === "cash" ? "Tunai" : "Kartu"}</span>
			<span class="tabular-nums">{formatRupiah(order.paymentMethod === "cash" ? (order.cashReceived ?? 0) : order.total)}</span>
		</div>
		{#if order.paymentMethod === "cash"}
			<div class="flex justify-between"><span>Kembalian</span><span class="tabular-nums">{formatRupiah(order.change ?? 0)}</span></div>
		{/if}
	</div>

	{#if order.status === "refunded"}
		<div class="my-3 -rotate-3 border-2 border-destructive py-1 text-center text-sm font-bold tracking-[0.3em] text-destructive">
			DIRETUR
		</div>
	{/if}

	<div class="mt-4 text-center text-xs">
		<div class="text-muted-foreground">Barang yang sudah dibeli tidak dapat ditukar</div>
		<div class="mt-1 font-semibold tracking-widest">TERIMA KASIH</div>
	</div>
</div>
