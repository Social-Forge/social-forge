<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { AvatarGroupEtcProps } from './types';

	let { ref = $bindable(null), plus, class: className, ...rest }: AvatarGroupEtcProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn(
		'relative flex size-8 items-center justify-center rounded-full bg-accent text-xs ring-2 ring-background',
		className
	)}
>
	<span>+{plus}</span>
</div>
