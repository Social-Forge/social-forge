<script lang="ts">
	import type { Snippet } from 'svelte';
	import { HomeMaxWidthWrapper } from '@/components/home';
	import { Separator } from '@/components/ui/separator';

	let { children }: { children?: Snippet } = $props();
</script>

<HomeMaxWidthWrapper>
	<main class="relative mx-auto w-full">
		<div
			class="mx-auto flex h-dvh w-full max-w-md flex-col items-start overflow-hidden overflow-y-auto pt-4 md:pt-20"
		>
			<div class=" flex w-full items-center justify-center md:justify-start">
				<a href="/#home" class="flex items-center gap-x-2">
					<img src="/images/logo-1.png" alt="Social Forge" class="h-16 w-auto" />
				</a>
			</div>
			<Separator class="my-2" />
			{@render children?.()}
		</div>
	</main>
</HomeMaxWidthWrapper>
