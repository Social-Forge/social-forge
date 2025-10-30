<script lang="ts" module>
	interface NavItem {
		label: string;
		icon: string;
		href: string;
	}
	const mainNav = [
		{
			label: 'Chats',
			icon: 'material-symbols:chat',
			href: '/app/chats'
		},
		{
			label: 'Analytics',
			icon: 'streamline-ultimate:google-analytics-logo-bold',
			href: '/app/analytics'
		},
		{
			label: 'Contacts',
			icon: 'ri:contacts-book-3-fill',
			href: '/app/contacts'
		}
	];
	const settingNav = [
		{
			label: 'Integrations',
			icon: 'majesticons:applications-add',
			href: '/app/integrations'
		},
		{
			label: 'Page Builder',
			icon: 'streamline-ultimate:coding-apps-website-apps-browser-bold',
			href: '/app/page-builders'
		},
		{
			label: 'Settings',
			icon: 'material-symbols:settings',
			href: '/app/settings'
		}
	];
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import { AppNavUser, AppNavMain, AppNavSetting } from '@/components/app';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mode } from 'mode-watcher';
	import { ToggleTheme } from '@/components';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		user,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & { user?: UserTenantWithDetails | null } = $props();

	let tenant = $derived(user?.tenant);
	let isDark = $derived(mode.current === 'dark');
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
							<a href="##" {...props} class="flex items-center gap-2 py-0.5">
								<div
									class="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<img src="/icons/logo.svg" alt="logo" class="size-6" />
								</div>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="block truncate font-medium md:hidden">Social Forge</span>
									<span class="block truncate text-xs capitalize md:hidden">{tenant?.name}</span>
								</div>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>
		<Separator />
		<Sidebar.Content class="py-2.5">
			<AppNavMain items={mainNav} {user} />
			<AppNavSetting items={settingNav} {user} />
		</Sidebar.Content>
		<Separator />
		<Sidebar.Footer class="py-2.5">
			<Sidebar.Menu class="py-2.5">
				<Sidebar.MenuItem>
					{#snippet children()}
						<div class="ml-3 flex items-center justify-between md:ml-0">
							<span class="flex md:hidden">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
							<ToggleTheme />
						</div>
					{/snippet}
				</Sidebar.MenuItem>
			</Sidebar.Menu>
			<Separator />
			<AppNavUser {user} />
		</Sidebar.Footer>
	</Sidebar.Root>
</Sidebar.Root>
