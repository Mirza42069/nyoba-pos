<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';

	const { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);
</script>

<div class="grid h-svh grid-rows-[auto_1fr]">
	<Header />
	<main class="min-h-0 overflow-hidden">
		{@render children()}
	</main>
</div>

<Toaster position="top-center" richColors closeButton />
