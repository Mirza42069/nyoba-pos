<script lang="ts">
	import { useQuery, useMutation } from 'convex-svelte';
	import { api } from '@my-better-t-app/backend/convex/_generated/api';
	import type { Id } from '@my-better-t-app/backend/convex/_generated/dataModel';
	import { toast } from 'svelte-sonner';

	import { formatRupiah, errorText } from '$lib/money';
	import { cn } from '$lib/utils';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Search01Icon,
		Add01Icon,
		MinusSignIcon,
		PencilEdit01Icon,
		ArchiveIcon,
		PackageOpenIcon,
		Delete02Icon,
		Loading03Icon,
		SproutIcon
	} from '@hugeicons/core-free-icons';

	const products = useQuery(api.products.listAll, {});
	const categories = useQuery(api.products.categories, {});
	const seedData = useMutation(api.seed.seed);

	const saveProduct = useMutation(api.products.create);
	const updateProduct = useMutation(api.products.update);
	const adjustStock = useMutation(api.products.adjustStock);
	const setActive = useMutation(api.products.setActive);
	const removeProduct = useMutation(api.products.remove);

	type ProductId = Id<'products'>;

	let search = $state('');
	let dialogOpen = $state(false);
	let saving = $state(false);

	let form = $state({ id: '' as '' | ProductId, name: '', sku: '', category: '', price: 0, stock: 0, lowStockThreshold: 5 });

	const filtered = $derived(
		(products.data ?? []).filter((p) => {
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
		})
	);

	function openCreate() {
		form = { id: '', name: '', sku: '', category: categories.data?.[0] ?? '', price: 0, stock: 0, lowStockThreshold: 5 };
		dialogOpen = true;
	}

	function openEdit(id: ProductId) {
		const p = products.data?.find((x) => x._id === id);
		if (!p) return;
		form = { id: p._id, name: p.name, sku: p.sku, category: p.category, price: p.price, stock: p.stock, lowStockThreshold: p.lowStockThreshold };
		dialogOpen = true;
	}

	async function save() {
		if (!form.name.trim() || !form.sku.trim() || form.price < 0 || form.stock < 0) {
			toast.warning('Lengkapi data produk dengan benar');
			return;
		}
		saving = true;
		try {
			const payload = {
				name: form.name.trim(),
				sku: form.sku.trim(),
				category: form.category.trim() || 'Lainnya',
				price: Math.round(form.price),
				stock: Math.round(form.stock),
				lowStockThreshold: Math.max(0, Math.round(form.lowStockThreshold))
			};
			if (form.id) {
				await updateProduct({ id: form.id, ...payload, active: products.data?.find((x) => x._id === form.id)?.active ?? true });
				toast.success('Produk diperbarui');
			} else {
				await saveProduct(payload);
				toast.success('Produk ditambahkan');
			}
			dialogOpen = false;
		} catch (err) {
			toast.error(errorText(err));
		} finally {
			saving = false;
		}
	}

	async function adjust(id: ProductId, delta: number) {
		try {
			await adjustStock({ id, delta });
		} catch (err) {
			toast.error(errorText(err));
		}
	}

	async function toggleActive(id: ProductId, active: boolean) {
		try {
			await setActive({ id, active });
			toast.success(active ? 'Produk diaktifkan' : 'Produk diarsipkan');
		} catch (err) {
			toast.error(errorText(err));
		}
	}

	async function remove(id: ProductId) {
		try {
			await removeProduct({ id });
			toast.success('Produk dihapus');
		} catch (err) {
			toast.error(errorText(err));
		}
	}

	async function loadDemo() {
		try {
			const result = await seedData({});
			toast[result.seeded ? 'success' : 'info'](result.seeded ? 'Data demo dimuat' : 'Data sudah ada');
		} catch (err) {
			toast.error(errorText(err));
		}
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="font-serif text-2xl font-bold">Inventori</h1>
				<p class="text-muted-foreground text-sm">Kelola produk, harga, dan stok.</p>
			</div>
			<div class="flex items-center gap-2">
				{#if products.data && products.data.length === 0}
					<Button variant="outline" class="rounded-2xl" onclick={loadDemo}><HugeiconsIcon icon={SproutIcon} size={16} /> Data Demo</Button>
				{/if}
				<Button size="lg" class="rounded-2xl" onclick={openCreate}><HugeiconsIcon icon={Add01Icon} size={16} /> Tambah Produk</Button>
			</div>
		</div>

		<div class="relative max-w-sm">
			<HugeiconsIcon icon={Search01Icon} size={16} class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input bind:value={search} placeholder="Cari nama, SKU, kategori…" class="rounded-2xl pl-9" />
		</div>

		{#if products.isLoading}
			<div class="space-y-2">
				{#each Array(6) as _, i (i)}
					<Skeleton class="h-12 rounded-2xl" />
				{/each}
			</div>
		{:else if filtered.length === 0}
			<div class="text-muted-foreground grid place-items-center gap-2 rounded-3xl border border-dashed py-16 text-center text-sm">
				<HugeiconsIcon icon={PackageOpenIcon} size={32} class="size-8 opacity-40" />
				Tidak ada produk ditemukan.
			</div>
		{:else}
			<div class="rounded-3xl border border-border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Produk</TableHead>
							<TableHead>Kategori</TableHead>
							<TableHead class="text-right">Harga</TableHead>
							<TableHead class="text-center">Stok</TableHead>
							<TableHead class="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each filtered as p (p._id)}
							{@const low = p.stock <= p.lowStockThreshold}
							<TableRow class={cn(!p.active && 'opacity-50')}>
								<TableCell>
									<div class="font-semibold">{p.name}</div>
									<div class="text-muted-foreground font-mono text-xs">{p.sku}</div>
								</TableCell>
								<TableCell><Badge variant="secondary" class="rounded-full">{p.category}</Badge></TableCell>
								<TableCell class="text-right font-mono tabular-nums">{formatRupiah(p.price)}</TableCell>
								<TableCell>
									<div class="flex items-center justify-center gap-1">
										<Button variant="outline" size="icon-xs" 									 aria-label="Kurangi stok" onclick={() => adjust(p._id, -1)}>
											<HugeiconsIcon icon={MinusSignIcon} size={16} />
										</Button>
										<span class={cn('w-12 text-center font-mono font-bold tabular-nums', low && 'text-destructive')}>{p.stock}</span>
										<Button variant="outline" size="icon-xs" 									 aria-label="Tambah stok" onclick={() => adjust(p._id, 1)}>
											<HugeiconsIcon icon={Add01Icon} size={16} />
										</Button>
									</div>
									{#if low}
										<div class="text-destructive mt-1 text-center text-[11px]">Menipis</div>
									{/if}
								</TableCell>
								<TableCell>
									<div class="flex items-center justify-end gap-1">
										<Button variant="ghost" size="icon-sm" aria-label="Ubah" onclick={() => openEdit(p._id)}>
											<HugeiconsIcon icon={PencilEdit01Icon} size={16} />
										</Button>
										<Button variant="ghost" size="icon-sm" aria-label={p.active ? 'Arsipkan' : 'Aktifkan'} onclick={() => toggleActive(p._id, !p.active)}>
											<HugeiconsIcon icon={ArchiveIcon} size={16} />
										</Button>
										<AlertDialog.Root>
											<AlertDialog.Trigger
												class="hover:bg-muted inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md),12px)] text-destructive"
												aria-label="Hapus"
											>
												<HugeiconsIcon icon={Delete02Icon} size={16} />
											</AlertDialog.Trigger>
											<AlertDialog.Content>
												<AlertDialog.Header>
													<AlertDialog.Title>Hapus produk?</AlertDialog.Title>
													<AlertDialog.Description>
														{p.name} akan dihapus permanen dari katalog.
													</AlertDialog.Description>
												</AlertDialog.Header>
												<AlertDialog.Footer>
													<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
													<AlertDialog.Action class="bg-destructive text-white" onclick={() => remove(p._id)}>Hapus</AlertDialog.Action>
												</AlertDialog.Footer>
											</AlertDialog.Content>
										</AlertDialog.Root>
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="font-serif text-2xl">{form.id ? 'Ubah Produk' : 'Tambah Produk'}</Dialog.Title>
			<Dialog.Description>
				{form.id ? 'Perbarui informasi produk.' : 'Masukkan detail produk baru.'}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label for="f-name">Nama produk</Label>
				<Input id="f-name" bind:value={form.name} placeholder="Kopi Susu Gula Aren" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="f-sku">SKU</Label>
					<Input id="f-sku" bind:value={form.sku} placeholder="MNM-002" class="font-mono" />
				</div>
				<div class="grid gap-2">
					<Label for="f-cat">Kategori</Label>
					<Input id="f-cat" bind:value={form.category} list="kategori-list" placeholder="Minuman" />
					<datalist id="kategori-list">
						{#each categories.data ?? [] as cat (cat)}
							<option value={cat}></option>
						{/each}
					</datalist>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-4">
				<div class="grid gap-2">
					<Label for="f-price">Harga (Rp)</Label>
					<Input id="f-price" type="number" min="0" bind:value={form.price} class="text-right font-mono tabular-nums" />
				</div>
				<div class="grid gap-2">
					<Label for="f-stock">Stok</Label>
					<Input id="f-stock" type="number" min="0" bind:value={form.stock} class="text-right font-mono tabular-nums" />
				</div>
				<div class="grid gap-2">
					<Label for="f-threshold">Batas menipis</Label>
					<Input id="f-threshold" type="number" min="0" bind:value={form.lowStockThreshold} class="text-right font-mono tabular-nums" />
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" class="rounded-2xl" onclick={() => (dialogOpen = false)}>Batal</Button>
			<Button class="rounded-2xl" disabled={saving} onclick={save}>
				{#if saving}
					<HugeiconsIcon icon={Loading03Icon} size={16} class="animate-spin" /> Menyimpan…
				{:else}
					Simpan
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
