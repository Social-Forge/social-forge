<script lang="ts">
	import { loadProgress, hasActiveLoading } from '$lib/stores';
	import { fade } from 'svelte/transition';

	let {
		height = 'h-1',
		colors = 'from-blue-500 via-purple-500 to-pink-500',
		position = 'fixed',
		zIndex = 'z-50'
	}: {
		height?: string;
		colors?: string;
		position?: string;
		zIndex?: string;
	} = $props();

	let showProgress = $state(false);
	let currentProgress = $state(0);
	let isVisible = $state(false);

	// Reactive statements untuk update progress
	$effect(() => {
		const unsubscribe = loadProgress.subscribe((progress) => {
			currentProgress = progress;
		});
		return unsubscribe;
	});

	$effect(() => {
		const unsubscribe = hasActiveLoading.subscribe((hasActive) => {
			if (hasActive && currentProgress > 0) {
				isVisible = true;
				showProgress = true;
			} else if (!hasActive && currentProgress >= 100) {
				// Delay hide untuk smooth completion
				setTimeout(() => {
					showProgress = false;
					isVisible = false;
				}, 300);
			} else if (currentProgress === 0) {
				showProgress = false;
				isVisible = false;
			}
		});
		return unsubscribe;
	});

	let progressStyle = $derived(`
		width: ${Math.min(Math.max(currentProgress, 0), 100)}%;
		transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		transform: translateZ(0);
	`);

	// Debug logging (remove in production)
	$effect(() => {
		if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
			// if (DEBUG) {
			// 	console.log('Progress:', currentProgress, 'Visible:', isVisible, 'Show:', showProgress);
			// }
		}
	});
</script>

{#if showProgress && isVisible}
	<div
		class="{position} left-0 right-0 top-0 {zIndex} {height} overflow-hidden bg-neutral-200/10 backdrop-blur-sm dark:bg-neutral-800/10"
		transition:fade={{ duration: 150 }}
	>
		<div
			class="bg-linear-to-r h-full {colors} relative will-change-transform"
			style={progressStyle}
		>
			<!-- Shimmer effect -->
			<div
				class="animate-shimmer bg-linear-to-r absolute inset-0 from-transparent via-white/30 to-transparent"
			></div>

			<!-- Subtle glow effect -->
			<div class="bg-linear-to-r absolute inset-0 {colors} opacity-40 blur-[1px]"></div>
		</div>
	</div>
{/if}

<style>
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateX(200%);
			opacity: 0;
		}
	}

	.animate-shimmer {
		animation: shimmer 1.5s infinite ease-in-out;
	}

	/* Performance optimizations */
	.will-change-transform {
		will-change: transform, width;
		backface-visibility: hidden;
		perspective: 1000px;
	}

	/* Ensure smooth rendering */
	div[style*='width'] {
		contain: layout style paint;
	}
</style>
