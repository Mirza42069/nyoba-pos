<script lang="ts">
	import { useQuery, useMutation } from 'convex-svelte';
	import { api } from '@my-better-t-app/backend/convex/_generated/api';
	import { toast } from 'svelte-sonner';

	import { cart } from '$lib/cart.svelte';
	import { formatRupiah, errorText } from '$lib/money';
	import { cn } from '$lib/utils';
	import Receipt from '$lib/components/Receipt.svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Skeleton } from '$lib/components/ui/skeleton';

	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Search01Icon,
		Add01Icon,
		MinusSignIcon,
		Delete02Icon,
		ShoppingBasket01Icon,
		PrinterIcon,
		ArrowReloadHorizontalIcon,
		BanknoteIcon,
		CreditCardIcon,
		Loading03Icon,
		SproutIcon
	} from '@hugeicons/core-free-icons';

	import type { ReceiptOrder } from '$lib/components/Receipt.svelte';

	const products = useQuery(api.products.list, {});
	const seedData = useMutation(api.seed.seed);
	const createOrder = useMutation(api.orders.create);

	let search = $state('');
	let activeCategory = $state<string | null>(null);
	let searchInput = $state<HTMLInputElement | null>(null);
	let gridEl = $state<HTMLElement | null>(null);

	const categories = $derived([...new Set((products.data ?? []).map((p) => p.category))]);
	const filtered = $derived(
		(products.data ?? []).filter((p) => {
			const q = search.trim().toLowerCase();
			if (activeCategory && p.category !== activeCategory) return false;
			if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
			return true;
		})
	);

	// ---- checkout state ----
	let checkoutOpen = $state(false);
	let paymentMethod = $state<'cash' | 'card'>('cash');
	let cashInput = $state('');
	let submitting = $state(false);

	let receipt = $state<ReceiptOrder | null>(null);

	const cashReceived = $derived(
		cashInput.trim() === '' ? undefined : Number(cashInput.replace(/\D/g, ''))
	);
	const change = $derived(
		cashReceived !== undefined && cashReceived >= cart.total ? cashReceived - cart.total : undefined
	);
	const canPay = $derived(
		cart.lines.length > 0 &&
			!submitting &&
			(paymentMethod === 'card' || (cashReceived !== undefined && cashReceived >= cart.total))
	);
	const quickAmounts = $derived(
		[cart.total, 20000, 50000, 100000, 150000, 200000, 300000, 500000]
			.filter((amount, i) => i === 0 || amount > cart.total)
			.slice(0, 5)
	);

	function pickCategory(cat: string | null) {
		activeCategory = cat;
		gridEl?.scrollTo({ top: 0 });
	}

	function addToCart(p: (typeof filtered)[number]) {
		if (!cart.add(p)) toast.warning(`Stok ${p.name} tidak mencukupi`);
	}

	function openCheckout() {
		paymentMethod = 'cash';
		cashInput = '';
		checkoutOpen = true;
	}

	async function checkout() {
		if (!canPay) return;
		submitting = true;
		try {
			const result = await createOrder({
				items: cart.lines.map((l) => ({ productId: l.productId as Parameters<typeof createOrder>[0]['items'][number]['productId'], qty: l.qty })),
				discount: cart.discount,
				paymentMethod,
				cashReceived: paymentMethod === 'cash' ? cashReceived : undefined
			});
			receipt = {
				number: result.number,
				createdAt: Date.now(),
				items: cart.lines.map((l) => ({ name: l.name, price: l.price, qty: l.qty })),
				subtotal: result.subtotal,
				discount: result.discount,
				tax: result.tax,
				total: result.total,
				paymentMethod,
				cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
				change: result.change,
				status: 'completed'
			};
			cart.clear();
			checkoutOpen = false;
			toast.success(`Transaksi #${String(result.number).padStart(5, '0')} berhasil`);
		} catch (err) {
			toast.error(errorText(err));
		} finally {
			submitting = false;
		}
	}

	function newTransaction() {
		receipt = null;
	}

	async function loadDemo() {
		try {
			const result = await seedData({});
			toast[result.seeded ? 'success' : 'info'](result.seeded ? 'Data demo dimuat' : 'Data sudah ada');
		} catch (err) {
			toast.error(errorText(err));
		}
	}

	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (e.key === '/' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
			e.preventDefault();
			searchInput?.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="grid h-full grid-rows-[auto_1fr] lg:grid-cols-[1fr_400px] lg:grid-rows-1">
	<!-- Katalog -->
	<section class="flex min-h-0 flex-col gap-3 p-4 md:p-6">
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<HugeiconsIcon icon={Search01Icon} size={16} class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					bind:ref={searchInput}
					bind:value={search}
					placeholder="Cari produk atau SKU…"
					class="h-11 rounded-2xl pl-9 text-base"
				/>
				<kbd class="bg-muted text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md border px-1.5 py-0.5 font-mono text-[11px]">/</kbd>
			</div>
		</div>

		<div class="flex flex-wrap gap-1.5">
			<button
				class={cn(
					'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
					activeCategory === null
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
				onclick={() => pickCategory(null)}
			>
				Semua
			</button>
			{#each categories as cat (cat)}
				<button
					class={cn(
						'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
						activeCategory === cat
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
					)}
					onclick={() => pickCategory(activeCategory === cat ? null : cat)}
				>
					{cat}
				</button>
			{/each}
		</div>

		<div bind:this={gridEl} class="min-h-0 flex-1 overflow-y-auto pb-4">
			{#if products.isLoading}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
					{#each Array(10) as _, i (i)}
						<Skeleton class="h-32 rounded-3xl" />
					{/each}
				</div>
			{:else if products.data && products.data.length === 0}
				<div class="grid h-full min-h-64 place-items-center">
					<div class="flex max-w-sm flex-col items-center gap-4 text-center">
						<HugeiconsIcon icon={SproutIcon} size={40} class="text-primary size-10" />
						<div>
							<h3 class="font-serif text-xl font-semibold">Katalog masih kosong</h3>
							<p class="text-muted-foreground mt-1 text-sm">
								Muat data demo berisi produk warung Indonesia untuk mulai berjualan.
							</p>
						</div>
						<Button onclick={loadDemo} size="lg" class="rounded-2xl">
							<HugeiconsIcon icon={SproutIcon} size={16} /> Muat Data Demo
						</Button>
					</div>
				</div>
			{:else if filtered.length === 0}
				<div class="grid h-full min-h-64 place-items-center text-center">
					<div>
						<p class="text-muted-foreground font-serif text-lg">Tidak ada produk yang cocok</p>
						<p class="text-muted-foreground mt-1 text-sm">Coba kata kunci atau kategori lain.</p>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
					{#each filtered as p (p._id)}
						{@const inCart = cart.lines.find((l) => l.productId === p._id)?.qty ?? 0}
						{@const soldOut = p.stock < 1 || inCart >= p.stock}
						<button
							class={cn(
								'group flex flex-col items-start gap-1 rounded-3xl border border-border bg-card p-4 text-left shadow-xs transition-all',
								soldOut
									? 'opacity-50'
									: 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:translate-y-0'
							)}
							disabled={soldOut}
							onclick={() => addToCart(p)}
						>
							<div class="flex w-full items-start justify-between gap-2">
								<span class="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">{p.sku}</span>
								<Badge variant={p.stock <= p.lowStockThreshold ? 'destructive' : 'secondary'} class="rounded-full">
									{p.stock <= 0 ? 'Habis' : `${p.stock}`}
								</Badge>
							</div>
							<span class="line-clamp-2 min-h-10 text-sm leading-5 font-semibold">{p.name}</span>
							<span class="text-muted-foreground text-xs">{p.category}</span>
							<span class="mt-auto font-mono text-base font-bold tabular-nums">{formatRupiah(p.price)}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Struk / Keranjang -->
	<aside class="receipt-paper flex min-h-0 flex-col border-t border-border bg-card lg:border-t-0 lg:border-l">
		{#if receipt}
			<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
				<Receipt order={receipt} />
				<div class="grid gap-2">
					<Button variant="outline" class="rounded-2xl" onclick={() => window.print()}>
						<HugeiconsIcon icon={PrinterIcon} size={16} /> Cetak Struk
					</Button>
					<Button size="lg" class="rounded-2xl" onclick={newTransaction}>
						<HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={16} /> Transaksi Baru
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-between px-5 pt-5">
				<h2 class="font-serif text-xl font-semibold">Struk</h2>
				{#if cart.count > 0}
					<Button variant="ghost" size="sm" class="text-muted-foreground" onclick={() => cart.clear()}>
						<HugeiconsIcon icon={Delete02Icon} size={16} /> Kosongkan
					</Button>
				{/if}
			</div>
			<Separator class="mt-3" />

			<ScrollArea class="min-h-0 flex-1">
				<div class="space-y-1 px-5 py-3">
					{#if cart.lines.length === 0}
						<div class="text-muted-foreground grid place-items-center gap-2 py-16 text-center text-sm">
							<HugeiconsIcon icon={ShoppingBasket01Icon} size={32} class="size-8 opacity-40" />
							Keranjang kosong.<br />Pilih produk untuk memulai.
						</div>
					{/if}
					{#each cart.lines as line (line.productId)}
						<div class="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/60">
							<div class="min-w-0 flex-1">
								<div class="truncate text-sm font-semibold">{line.name}</div>
								<div class="text-muted-foreground font-mono text-xs tabular-nums">@{formatRupiah(line.price)}</div>
							</div>
							<div class="flex items-center gap-1">
								<Button
									variant="outline"
									size="icon-xs"
									aria-label="Kurangi"
									onclick={() => cart.setQty(line.productId, line.qty - 1)}
								>
									<HugeiconsIcon icon={MinusSignIcon} size={16} />
								</Button>
								<span class="w-8 text-center font-mono text-sm font-bold tabular-nums">{line.qty}</span>
								<Button
									variant="outline"
									size="icon-xs"
									aria-label="Tambah"
									disabled={line.qty >= line.stock}
									onclick={() => cart.setQty(line.productId, line.qty + 1)}
								>
									<HugeiconsIcon icon={Add01Icon} size={16} />
								</Button>
							</div>
							<span class="w-24 text-right font-mono text-sm font-bold tabular-nums">
								{formatRupiah(line.price * line.qty)}
							</span>
							<Button
								variant="ghost"
								size="icon-xs"
								class="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
								aria-label="Hapus"
								onclick={() => cart.remove(line.productId)}
							>
								<HugeiconsIcon icon={Delete02Icon} size={16} />
							</Button>
						</div>
					{/each}
				</div>
			</ScrollArea>

			<Separator />
			<div class="space-y-3 p-5 pt-4">
				<div class="flex items-center justify-between gap-3 text-sm">
					<label for="diskon" class="text-muted-foreground">Diskon (Rp)</label>
					<Input
						id="diskon"
						type="number"
						min="0"
						max={cart.subtotal}
						bind:value={cart.discount}
						class="h-9 w-32 rounded-xl text-right font-mono tabular-nums"
					/>
				</div>
				<div class="space-y-1 font-mono text-sm tabular-nums">
					<div class="text-muted-foreground flex justify-between">
						<span>Subtotal</span><span>{formatRupiah(cart.subtotal)}</span>
					</div>
					<div class="text-muted-foreground flex justify-between">
						<span>PPN 11%</span><span>{formatRupiah(cart.tax)}</span>
					</div>
					<div class="flex justify-between pt-1 text-lg font-bold">
						<span>TOTAL</span><span>{formatRupiah(cart.total)}</span>
					</div>
				</div>
				<Button size="lg" class="h-12 w-full rounded-2xl text-base" disabled={cart.lines.length === 0} onclick={openCheckout}>
					<HugeiconsIcon icon={ShoppingBasket01Icon} size={16} /> Bayar · {formatRupiah(cart.total)}
				</Button>
			</div>
		{/if}
	</aside>
</div>

<!-- Dialog Pembayaran -->
<Dialog.Root bind:open={checkoutOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="font-serif text-2xl">Pembayaran</Dialog.Title>
			<Dialog.Description>Konfirmasi transaksi sebelum pembayaran.</Dialog.Description>
		</Dialog.Header>

		<div class="rounded-3xl border border-border bg-muted/40 p-4 text-center">
			<div class="text-muted-foreground text-sm">Total Tagihan</div>
			<div class="font-mono text-4xl font-bold tabular-nums">{formatRupiah(cart.total)}</div>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<Button
				variant={paymentMethod === 'cash' ? 'default' : 'outline'}
				class="h-11 rounded-2xl"
				onclick={() => (paymentMethod = 'cash')}
			>
				<HugeiconsIcon icon={BanknoteIcon} size={16} /> Tunai
			</Button>
			<Button
				variant={paymentMethod === 'card' ? 'default' : 'outline'}
				class="h-11 rounded-2xl"
				onclick={() => (paymentMethod = 'card')}
			>
				<HugeiconsIcon icon={CreditCardIcon} size={16} /> Kartu
			</Button>
		</div>

		{#if paymentMethod === 'cash'}
			<div class="space-y-2">
				<label for="cash" class="text-muted-foreground text-sm">Uang diterima</label>
				<Input
					id="cash"
					inputmode="numeric"
					placeholder="0"
					bind:value={cashInput}
					class="h-12 rounded-2xl text-right font-mono text-xl font-bold tabular-nums"
				/>
				<div class="flex flex-wrap gap-1.5">
					{#each quickAmounts as amount (amount)}
						<Button
							variant="secondary"
							size="sm"
							class="rounded-full font-mono tabular-nums"
							onclick={() => (cashInput = String(amount))}
						>
							{amount === cart.total ? 'Uang pas' : new Intl.NumberFormat('id-ID').format(amount)}
						</Button>
					{/each}
				</div>
				{#if cashReceived !== undefined}
					<div class={cn('flex justify-between rounded-2xl border p-3 font-mono tabular-nums', change !== undefined ? 'border-primary/40 bg-primary/10' : 'border-destructive/40 bg-destructive/10')}>
						<span class="text-sm">Kembalian</span>
						<span class={cn('font-bold', change === undefined && 'text-destructive')}>
							{change !== undefined ? formatRupiah(change) : 'Uang kurang'}
						</span>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-muted-foreground text-sm">Gesek / tap kartu pada mesin EDC, lalu konfirmasi di bawah.</p>
		{/if}

		<Dialog.Footer>
			<Button variant="outline" class="rounded-2xl" onclick={() => (checkoutOpen = false)}>Batal</Button>
			<Button size="lg" class="rounded-2xl" disabled={!canPay} onclick={checkout}>
				{#if submitting}
					<HugeiconsIcon icon={Loading03Icon} size={16} class="animate-spin" /> Memproses…
				{:else}
					Selesaikan Transaksi
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
