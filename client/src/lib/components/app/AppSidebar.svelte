<script lang="ts" module>
	const sidebarItems = [
		{
			label: 'Home',
			icon: 'material-symbols:home',
			href: '/app/home'
		},
		{
			label: 'Chats',
			icon: 'material-symbols:chat',
			href: '/app/chats'
		},
		{
			label: 'Integrations',
			icon: 'majesticons:applications-add',
			href: '/app/integration'
		},
		{
			label: 'Settings',
			icon: 'material-symbols:settings',
			href: '/app/settings'
		}
	];
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import CommandIcon from '@lucide/svelte/icons/command';
	import { AppNavUser } from '@/components/app';
	import type { ComponentProps } from 'svelte';
	import Icon from '@iconify/svelte';
	import { cn } from '@/utils';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = useSidebar();
</script>

<Sidebar.Root
	bind:ref
	collapsible="icon"
	class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
	{...restProps}
>
	<Sidebar.Root collapsible="none" class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg" class="md:h-8 md:p-0">
						{#snippet child({ props })}
							<a href="##" {...props}>
								<div
									class="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<img src="/icons/logo.svg" alt="logo" class="size-6" />
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">Social Forge</span>
									<span class="truncate text-xs">Tenant Name</span>
								</div>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent class="px-1.5 md:px-0">
					<Sidebar.Menu>
						{#each sidebarItems as item}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									tooltipContentProps={{
										hidden: false
									}}
									class={cn(
										'cursor-pointer px-2.5 md:px-2',
										page.url.pathname === item.href ? 'bg-cyan-500 text-white dark:bg-cyan-600' : ''
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
		</Sidebar.Content>
		<Sidebar.Footer>
			<AppNavUser />
		</Sidebar.Footer>
	</Sidebar.Root>
</Sidebar.Root>
