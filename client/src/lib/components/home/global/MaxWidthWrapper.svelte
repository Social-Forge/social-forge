<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '@/utils';

	let { class: className = 'max-w-full', children }: { class?: ClassValue; children?: Snippet } =
		$props();
</script>

<div class={cn('mx-auto h-full w-full px-4 md:max-w-7xl md:px-12 lg:px-20', className)}>
	{@render children?.()}
</div>
