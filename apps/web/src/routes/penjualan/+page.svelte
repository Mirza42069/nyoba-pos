<script lang="ts">
	import { useQuery, useMutation } from 'convex-svelte';
	import { api } from '@my-better-t-app/backend/convex/_generated/api';
	import type { FunctionReturnType } from 'convex/server';
	import { toast } from 'svelte-sonner';

	import { formatRupiah, formatDate, errorText } from '$lib/money';
	import Receipt from '$lib/components/Receipt.svelte';
	import { cn } from '$lib/utils';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
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
	import { ReceiptIcon, UndoIcon } from '@hugeicons/core-free-icons';

	type Order = FunctionReturnType<typeof api.orders.list>[number];

	const orders = useQuery(api.orders.list, {});
	const refundOrder = useMutation(api.orders.refund);

	let selected = $state<Order | null>(null);

	async function refund(order: Order) {
		try {
			await refundOrder({ id: order._id });
			toast.success(`Transaksi #${String(order.number).padStart(5, '0')} diretur, stok dikembalikan`);
			selected = null;
		} catch (err) {
			toast.error(errorText(err));
		}
	}

	function itemsSummary(order: Order): string {
		const first = order.items[0];
		const extra = order.items.length - 1;
		return extra > 0 ? `${first.name} +${extra} lainnya` : first.name;
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
		<div>
			<h1 class="font-serif text-2xl font-bold">Penjualan</h1>
			<p class="text-muted-foreground text-sm">Riwayat transaksi dan retur.</p>
		</div>

		{#if orders.isLoading}
			<div class="space-y-2">
				{#each Array(6) as _, i (i)}
					<Skeleton class="h-12 rounded-2xl" />
				{/each}
			</div>
		{:else if (orders.data?.length ?? 0) === 0}
			<div class="text-muted-foreground grid place-items-center gap-2 rounded-3xl border border-dashed py-16 text-center text-sm">
				<HugeiconsIcon icon={ReceiptIcon} size={32} class="size-8 opacity-40" />
				Belum ada transaksi.
			</div>
		{:else}
			<div class="rounded-3xl border border-border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>No.</TableHead>
							<TableHead>Waktu</TableHead>
							<TableHead>Item</TableHead>
							<TableHead class="text-right">Total</TableHead>
							<TableHead>Metode</TableHead>
							<TableHead class="text-right">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each orders.data ?? [] as order (order._id)}
							<TableRow
								class="cursor-pointer"
								onclick={() => (selected = order)}
							>
								<TableCell class="font-mono font-semibold tabular-nums">{String(order.number).padStart(5, '0')}</TableCell>
								<TableCell class="text-muted-foreground tabular-nums">{formatDate(order.createdAt)}</TableCell>
								<TableCell>{itemsSummary(order)}</TableCell>
								<TableCell class="text-right font-mono font-bold tabular-nums">{formatRupiah(order.total)}</TableCell>
								<TableCell>
									<Badge variant="secondary" class="rounded-full">
										{order.paymentMethod === 'cash' ? 'Tunai' : 'Kartu'}
									</Badge>
								</TableCell>
								<TableCell class="text-right">
									<Badge variant={order.status === 'refunded' ? 'destructive' : 'default'} class="rounded-full">
										{order.status === 'refunded' ? 'Diretur' : 'Selesai'}
									</Badge>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</div>
</div>

<Dialog.Root open={selected !== null} onOpenChange={(open) => (selected = open ? selected : null)}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header class="sr-only">
			<Dialog.Title>Detail Transaksi</Dialog.Title>
			<Dialog.Description>Struk transaksi.</Dialog.Description>
		</Dialog.Header>
		{#if selected}
			<div class="max-h-[70vh] overflow-y-auto">
				<Receipt order={selected} />
			</div>
			{#if selected.status === 'completed'}
				<AlertDialog.Root>
					<AlertDialog.Trigger
						class={cn(
							'mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-2xl border border-destructive/40 bg-destructive/10 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20'
						)}
					>
						<HugeiconsIcon icon={UndoIcon} size={16} class="size-4" /> Retur Transaksi
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Retur transaksi ini?</AlertDialog.Title>
							<AlertDialog.Description>
								Stok produk akan dikembalikan dan transaksi ditandai sebagai retur.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Batal</AlertDialog.Cancel>
							<AlertDialog.Action class="bg-destructive text-white" onclick={() => refund(selected!)}>Ya, retur</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>
