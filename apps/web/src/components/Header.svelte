<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { cart } from '$lib/cart.svelte';

	const links = [
		{ href: '/', label: 'Kasir' },
		{ href: '/inventori', label: 'Inventori' },
		{ href: '/penjualan', label: 'Penjualan' },
		{ href: '/dasbor', label: 'Dasbor' }
	];
</script>

<header class="flex items-center justify-between px-4 py-2.5 md:px-6">
	<a href="/" class="flex items-center gap-2.5">
		<span class="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
			<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
				<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
			</svg>
		</span>
		<span class="font-serif text-lg font-semibold tracking-tight">Verdant <span class="text-primary">POS</span></span>
	</a>

	<nav class="flex items-center gap-1">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class={cn(
					'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
					page.url.pathname === link.href
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
			>
				{link.label}
			</a>
		{/each}
	</nav>

	<div class="flex items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
		{#if cart.count > 0}
			<span class="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
				{cart.count} item · {new Intl.NumberFormat('id-ID').format(cart.total)}
			</span>
		{/if}
	</div>
</header>
<div class="border-b border-border"></div>
