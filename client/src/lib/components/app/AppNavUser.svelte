<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		ChevronsUpDownIcon,
		BadgeCheckIcon,
		CreditCardIcon,
		LogOutIcon,
		SparklesIcon,
		LockKeyholeIcon
	} from '@lucide/svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	let { user }: { user?: UserTenantWithDetails | null } = $props();
	const sidebar = useSidebar();
	let profile = $derived(user?.user || null);
	let avatarUrl = $derived(profile?.avatar_url || '/icons/logo.png');

	const gotoPage = async (href: string) => {
		await goto(href);
	};

	const handleLogout = async () => {
		try {
			const response = await fetch('/api/user/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (!response.ok) {
				const errorData = await response.json();
				console.error('❌ Logout failed:', errorData.message || 'Logout failed');
				return;
			}
			await invalidateAll();
			await goto('/auth/sign-in');
		} catch (error: any) {
			console.error('❌ API Request failed:', error.message || 'API request failed');
		}
	};
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer active:scale-95 md:h-8 md:p-0"
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={avatarUrl} alt={profile?.full_name || 'User'} />
							<Avatar.Fallback class="rounded-lg">{profile?.full_name?.[0] || 'CN'}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{profile?.full_name || 'User'}</span>
							<span class="truncate text-xs">{profile?.email || 'user@example.com'}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={avatarUrl} alt={profile?.full_name || 'User'} />
							<Avatar.Fallback class="rounded-lg">{profile?.full_name?.[0] || 'CN'}</Avatar.Fallback
							>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{profile?.full_name || 'User'}</span>
							<span class="truncate text-xs">{profile?.email || 'user@example.com'}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onSelect={() => gotoPage('/app/billings?key=upgrade')}>
						<SparklesIcon />
						Upgrade to Pro
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onSelect={() => gotoPage('/app/accounts?key=profile')}>
						<BadgeCheckIcon />
						Account
					</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => gotoPage('/app/billings?key=information')}>
						<CreditCardIcon />
						Billing
					</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => gotoPage('/app/accounts?key=security')}>
						<LockKeyholeIcon />
						Security
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item variant="destructive" onSelect={handleLogout}>
					<LogOutIcon />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
