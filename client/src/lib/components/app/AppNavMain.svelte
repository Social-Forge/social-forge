<script lang="ts" module>
	interface NavItem {
		label: string;
		icon: string;
		href: string;
	}
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import Icon from '@iconify/svelte';
	import { cn } from '@/utils';

	let { items = [], user }: { items: NavItem[]; user?: UserTenantWithDetails | null } = $props();

	const sidebar = useSidebar();
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="px-1.5 md:px-0">
		<Sidebar.Menu>
			{#each items as item}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContentProps={{
							hidden: false
						}}
						class={cn(
							'cursor-pointer px-2.5 md:px-2',
							page.url.pathname === item.href ? 'bg-primary-app text-white' : ''
						)}
					>
						{#snippet tooltipContent()}
							{item.label}
						{/snippet}
						{#snippet children()}
							<a href={item.href} class="flex items-center gap-2">
								<Icon icon={item.icon} class="size-4" />
								{#if sidebar.isMobile}
									<span>{item.label}</span>
								{/if}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
			<Sidebar.Separator />
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
