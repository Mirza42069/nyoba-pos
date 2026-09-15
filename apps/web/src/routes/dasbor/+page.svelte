<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@my-better-t-app/backend/convex/_generated/api';

	import { formatRupiah, dayFmt } from '$lib/money';
	import { cn } from '$lib/utils';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		BanknoteIcon,
		ReceiptIcon,
		TrendingUpIcon,
		Alert02Icon,
		PackageOpenIcon,
		SproutIcon
	} from '@hugeicons/core-free-icons';

	const stats = useQuery(api.stats.dashboard, { now: Date.now() });
	const maxRevenue = $derived(Math.max(...(stats.data?.series.map((s) => s.revenue) ?? [0]), 1));
	const maxTop = $derived(stats.data?.topProducts[0]?.revenue ?? 1);
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
		<div>
			<h1 class="font-serif text-2xl font-bold">Dasbor</h1>
			<p class="text-muted-foreground text-sm">Ringkasan performa toko Anda.</p>
		</div>

		{#if stats.isLoading}
			<div class="grid gap-3 sm:grid-cols-3">
				{#each Array(3) as _, i (i)}
					<Skeleton class="h-28 rounded-3xl" />
				{/each}
			</div>
		{:else if stats.data}
			<!-- Stat Cards -->
			<div class="grid gap-3 sm:grid-cols-3">
				<div class="rounded-3xl border border-border bg-card p-5 shadow-xs">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary"><HugeiconsIcon icon={BanknoteIcon} size={16} /></span>
						Pendapatan Hari Ini
					</div>
					<div class="mt-3 font-mono text-3xl font-bold tabular-nums">{formatRupiah(stats.data.todayRevenue)}</div>
				</div>
				<div class="rounded-3xl border border-border bg-card p-5 shadow-xs">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary"><HugeiconsIcon icon={ReceiptIcon} size={16} /></span>
						Transaksi Hari Ini
					</div>
					<div class="mt-3 font-mono text-3xl font-bold tabular-nums">{stats.data.todayCount}</div>
				</div>
				<div class="rounded-3xl border border-border bg-card p-5 shadow-xs">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary"><HugeiconsIcon icon={TrendingUpIcon} size={16} /></span>
						Rata-rata per Struk
					</div>
					<div class="mt-3 font-mono text-3xl font-bold tabular-nums">{formatRupiah(stats.data.avgTicket)}</div>
				</div>
			</div>

			<div class="grid gap-3 lg:grid-cols-5">
				<!-- Chart 7 hari -->
				<div class="rounded-3xl border border-border bg-card p-5 shadow-xs lg:col-span-3">
					<h2 class="font-serif text-lg font-semibold">Penjualan 7 Hari Terakhir</h2>
					<div class="mt-6 flex h-56 items-end gap-2 sm:gap-3">
						{#each stats.data.series as day, i (day.dayStart)}
							{@const pct = Math.max(2, Math.round((day.revenue / maxRevenue) * 100))}
							<div class="flex h-full flex-1 flex-col items-center justify-end gap-2">
								<span class="text-muted-foreground hidden font-mono text-[10px] tabular-nums sm:block">
									{day.revenue > 0 ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(day.revenue) : ''}
								</span>
								<div
									class="w-full rounded-t-xl bg-primary/80 transition-all duration-500 ease-out hover:bg-primary"
									style="height: {pct}%"
									title="{formatRupiah(day.revenue)} · {day.count} transaksi"
								></div>
								<span class={cn('text-muted-foreground text-[11px]', i === 6 && 'font-bold text-foreground')}>
									{dayFmt.format(new Date(day.dayStart))}
								</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Top produk + stok menipis -->
				<div class="flex flex-col gap-3 lg:col-span-2">
					<div class="rounded-3xl border border-border bg-card p-5 shadow-xs">
						<h2 class="font-serif text-lg font-semibold">Produk Terlaris</h2>
						{#if stats.data.topProducts.length === 0}
							<p class="text-muted-foreground mt-4 text-sm">Belum ada penjualan minggu ini.</p>
						{:else}
							<ul class="mt-4 space-y-3">
								{#each stats.data.topProducts as product, i (product.productId)}
									<li>
										<div class="flex items-baseline justify-between gap-2 text-sm">
											<span class="truncate font-semibold">{i + 1}. {product.name}</span>
											<span class="shrink-0 font-mono tabular-nums">{formatRupiah(product.revenue)}</span>
										</div>
										<div class="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
											<div class="h-full rounded-full bg-primary/70 transition-all duration-500" style="width: {Math.max(4, Math.round((product.revenue / maxTop) * 100))}%"></div>
										</div>
										<div class="text-muted-foreground mt-0.5 text-xs">{product.qty} terjual</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<div class="rounded-3xl border border-border bg-card p-5 shadow-xs">
						<h2 class="flex items-center gap-2 font-serif text-lg font-semibold">
							<HugeiconsIcon icon={Alert02Icon} size={16} class="text-destructive" /> Stok Menipis
						</h2>
						{#if stats.data.lowStock.length === 0}
							<p class="text-muted-foreground mt-4 text-sm">Semua stok aman.</p>
						{:else}
							<ul class="mt-4 space-y-2">
								{#each stats.data.lowStock as product (product._id)}
									<li class="flex items-center justify-between gap-2 text-sm">
										<span class="truncate">{product.name}</span>
										<Badge variant={product.stock === 0 ? 'destructive' : 'secondary'} class="shrink-0 rounded-full font-mono tabular-nums">
											{product.stock === 0 ? 'Habis' : `${product.stock} sisa`}
										</Badge>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="text-muted-foreground grid place-items-center gap-3 rounded-3xl border border-dashed py-20 text-center">
				<HugeiconsIcon icon={PackageOpenIcon} size={32} class="size-8 opacity-40" />
				<div class="text-sm">Belum ada data. Muat data demo atau mulai berjualan di Kasir.</div>
				<Button variant="outline" class="rounded-2xl" onclick={() => location.assign('/')}>
					<HugeiconsIcon icon={SproutIcon} size={16} /> Buka Kasir
				</Button>
			</div>
		{/if}
	</div>
</div>
