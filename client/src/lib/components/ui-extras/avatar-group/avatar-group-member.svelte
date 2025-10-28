<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import AvatarRoot from '$lib/components/ui-extras/avatar/avatar.svelte';
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps = $props();
</script>

<AvatarRoot bind:ref class={cn('bg-accent ring-2 ring-background', className)} {...restProps} />
