<script lang="ts" module>
	interface NavigationMenuItem {
		label: string;
		name: string;
		description?: string;
		icon: string;
		to: string;
		exact?: boolean;
		target?: string;
	}
</script>

<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import { cn } from '@/utils';
	import Icon from '@iconify/svelte';

	let { children }: { children?: Snippet } = $props();

	const links: NavigationMenuItem[] = [
		{
			label: 'Profile',
			name: 'profile',
			description: 'Make changes to your account here. Click save when you&apos;re done.',
			icon: 'mdi:account',
			to: '/app/accounts?key=profile',
			exact: true
		},
		{
			label: 'Security',
			name: 'security',
			description: 'Change your password or enable two-factor authentication.',
			icon: 'mdi:lock',
			to: '/app/accounts?key=security',
			exact: true
		}
	];
</script>

<div class="flex h-screen w-full flex-col">
	<div class="mx-auto flex h-full w-full flex-1 flex-col">
		<div
			class="scrollbar-thin scrollbar-thumb-sky-500 scrollbar-track-sky-100 dark:scrollbar-thumb-sky-600 dark:scrollbar-track-sky-900 flex w-full items-center gap-2 overflow-hidden overflow-x-auto px-0 py-3 md:px-2"
		>
			{#each links as item}
				<a
					href={item.to}
					class={cn(
						'hover:bg-primary-app dark:hover:bg-primary-app flex min-w-max items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:text-white active:scale-95 dark:border-neutral-700 dark:text-neutral-50 dark:hover:text-white',
						page.url.searchParams.get('key') === item.name
							? 'bg-primary-app dark:bg-primary-app text-white dark:text-white'
							: ''
					)}
				>
					<Icon icon={item.icon} class="size-4" />
					<span class="line-clamp-1 text-sm font-medium">{item.label}</span>
				</a>
			{/each}
		</div>
		<div class="min-h-0 flex-1 overflow-hidden">
			<div class="h-full overflow-y-auto px-0 md:px-2">
				<div class="mx-auto py-4 sm:py-6 lg:py-8">
					{@render children?.()}
				</div>
			</div>
		</div>
	</div>
</div>
