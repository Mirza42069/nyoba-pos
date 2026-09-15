<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Loading03Icon,
		CircleCheckIcon,
		OctagonXIcon,
		InfoIcon,
		TriangleAlertIcon
	} from '@hugeicons/core-free-icons';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme="light"
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	toastOptions={{
		classes: {
			toast: "cn-toast",
		},
	}}
	{...restProps}
>
	{#snippet loadingIcon()}
		<HugeiconsIcon icon={Loading03Icon} size={16} class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<HugeiconsIcon icon={CircleCheckIcon} size={16} class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<HugeiconsIcon icon={OctagonXIcon} size={16} class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<HugeiconsIcon icon={InfoIcon} size={16} class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<HugeiconsIcon icon={TriangleAlertIcon} size={16} class="size-4" />
	{/snippet}
</Sonner>
