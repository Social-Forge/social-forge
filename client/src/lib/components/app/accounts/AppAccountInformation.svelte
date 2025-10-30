<script lang="ts">
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { UpdateProfileSchema } from '@/utils';
	import * as Card from '@/components/ui/card';
	import * as Avatar from '@/components/ui/avatar';
	import { Separator } from '@/components/ui/separator';
	import { Button } from '@/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { AppAccountUploadAvatar, AppAccountEditForm } from '@/components/app';
	import {
		User,
		Mail,
		Phone,
		Calendar,
		Clock,
		CheckCircle,
		Building2,
		Shield,
		Hash,
		Camera,
		Info
	} from '@lucide/svelte';
	import { cn } from '@/utils';
	import Icon from '@iconify/svelte';

	let {
		user: profile,
		form
	}: { user?: UserTenantWithDetails | null; form: SuperValidated<UpdateProfileSchema> } = $props();

	let user = $derived(profile?.user);
	let tenant = $derived(profile?.tenant);
	let role = $derived(profile?.role);
	let metadata = $derived(profile?.metadata);
	let activeTab = $state('personal');
	let openFormEditProfile = $state(false);

	function formatDate(dateString?: string): string {
		if (!dateString || dateString === '0001-01-01T00:00:00Z') {
			return 'N/A';
		}
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(isActive: boolean): string {
		return isActive
			? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
			: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
	}

	function getPlanColor(plan: string): string {
		const colors: Record<string, string> = {
			free: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
			basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
		};
		return colors[plan] || colors.free;
	}

	const tabs = [
		{
			key: 'personal',
			label: 'Personal Information'
		},
		{
			key: 'organization',
			label: 'Organization Information'
		},
		{
			key: 'role-permission',
			label: 'Role & Permissions'
		},
		{
			key: 'additional-information',
			label: 'Additional Information'
		}
	];
	const limitCards = [
		{
			label: 'Divisions',
			value: () => tenant?.max_divisions || 0
		},
		{
			label: 'Agents',
			value: () => tenant?.max_agents || 0
		},
		{
			label: 'Quick Replies',
			value: () => tenant?.max_quick_replies || 0
		},
		{
			label: 'Pages',
			value: () => tenant?.max_pages || 0
		},
		{
			label: 'WhatsApp',
			value: () => tenant?.max_whatsapp || 0
		},
		{
			label: 'Meta WhatsApp',
			value: () => tenant?.max_meta_whatsapp || 0
		},
		{
			label: 'Messanger',
			value: () => tenant?.max_meta_messenger || 0
		},
		{
			label: 'Instagram',
			value: () => tenant?.max_instagram || 0
		},
		{
			label: 'Telegram',
			value: () => tenant?.max_telegram || 0
		},
		{
			label: 'Webchat',
			value: () => tenant?.max_webchat || 0
		},
		{
			label: 'Linkchat',
			value: () => tenant?.max_linkchat || 0
		}
	];
</script>

<div class="w-full space-y-6">
	<Card.Root>
		<Card.Content>
			<div class="flex flex-col items-start gap-6 md:flex-row md:items-center">
				<div class="relative">
					<Avatar.Root class="h-24 w-24">
						<Avatar.Image src={user?.avatar_url || ''} alt={user?.full_name || 'User Avatar'} />
						<Avatar.Fallback>{user?.full_name?.slice(0, 2).toUpperCase() || 'User'}</Avatar.Fallback
						>
					</Avatar.Root>
					<AppAccountUploadAvatar {user} />
				</div>
				<div class="flex-1 space-y-2">
					<div class="flex flex-col gap-2 md:flex-row md:items-center">
						<h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
							{user?.full_name || 'N/A'}
						</h1>
						<span
							class={cn(
								'inline-block max-w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase',
								getPlanColor(tenant?.subscription_plan || 'free')
							)}
						>
							{tenant?.subscription_plan || 'Free'}
						</span>
					</div>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-muted-foreground text-base font-semibold capitalize">
							{role?.name?.replace(/_/g, ' ') || 'N/A'}
						</span>
						<span class="text-xs text-neutral-500 dark:text-neutral-400">
							(Level {role?.level})
						</span>
					</div>
					<div class="text-muted-foreground flex flex-wrap gap-4 text-sm">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger
									class="text-muted-foreground flex cursor-pointer items-center gap-1 text-sm font-semibold capitalize"
								>
									<Mail class="size-4" />
									{user?.email || 'N/A'}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Email address</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger
									class="text-muted-foreground flex cursor-pointer items-center gap-1 text-sm font-semibold capitalize"
								>
									<Calendar class="size-4" />
									{tenant?.created_at ? formatDate(tenant?.created_at) : 'N/A'}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Member since {tenant?.created_at ? formatDate(tenant?.created_at) : 'N/A'}</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger
									class="text-muted-foreground flex cursor-pointer items-center gap-1 text-sm font-semibold capitalize"
								>
									<Clock class="size-4" />
									{user?.last_login_at ? formatDate(user?.last_login_at) : 'N/A'}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>
										Last login on {user?.last_login_at ? formatDate(user?.last_login_at) : 'N/A'}
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
	<Tabs.Root value={activeTab} class="space-y-6 " onValueChange={(value) => (activeTab = value)}>
		<Tabs.List class="flex w-full items-center gap-4 overflow-hidden overflow-x-auto">
			{#each tabs as tab}
				<Tabs.Trigger
					value={tab.key}
					class={cn(
						'line-clamp-1  min-w-max cursor-pointer text-center',
						activeTab === tab.key ? 'text-primary-app' : 'text-muted-foreground'
					)}
				>
					{tab.label}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<Tabs.Content value="personal" class="w-full">
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center justify-between">
						<h2
							class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
						>
							<User class="h-5 w-5" />
							Personal Information
						</h2>
						{#if openFormEditProfile}
							<Button
								variant="destructive"
								class="text-sm font-medium text-white"
								onclick={() => (openFormEditProfile = false)}
							>
								<Icon icon="ic:outline-close" class="size-4" />
								Cansel
							</Button>
						{:else}
							<Button
								variant="default"
								class="text-sm font-medium"
								onclick={() => (openFormEditProfile = true)}
							>
								<Icon icon="material-symbols:edit-square-outline" class="size-4" />
								Edit
							</Button>
						{/if}
					</Card.Title>
				</Card.Header>
				<Separator />
				<Card.Content>
					{#if openFormEditProfile}
						<AppAccountEditForm {user} {form} />
					{:else}
						<div class="space-y-4 px-6 py-4">
							<!-- Full Name -->
							<div class="flex items-start gap-3">
								<User class="mt-0.5 h-5 w-5 text-neutral-400" />
								<div class="flex-1">
									<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
										Full Name
									</p>
									<p class="mt-1 text-base text-neutral-900 dark:text-white">
										{user?.full_name || 'N/A'}
									</p>
								</div>
							</div>

							<!-- Username -->
							<div class="flex items-start gap-3">
								<Hash class="mt-0.5 h-5 w-5 text-neutral-400" />
								<div class="flex-1">
									<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Username</p>
									<p class="mt-1 text-base text-neutral-900 dark:text-white">
										@{user?.username || 'N/A'}
									</p>
								</div>
							</div>

							<!-- Email -->
							<div class="flex items-start gap-3">
								<Mail class="mt-0.5 h-5 w-5 text-neutral-400" />
								<div class="flex-1">
									<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
										Email Address
									</p>
									<p class="mt-1 text-base text-neutral-900 dark:text-white">
										{user?.email || 'N/A'}
									</p>
									{#if user?.is_verified}
										<span
											class="mt-1 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
										>
											<CheckCircle class="h-3 w-3" />
											Verified on {formatDate(user?.email_verified_at)}
										</span>
									{/if}
								</div>
							</div>

							<!-- Phone -->
							<div class="flex items-start gap-3">
								<Phone class="mt-0.5 h-5 w-5 text-neutral-400" />
								<div class="flex-1">
									<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
										Phone Number
									</p>
									<p class="mt-1 text-base text-neutral-900 dark:text-white">
										{user?.phone || 'N/A'}
									</p>
								</div>
							</div>

							<!-- Account Status -->
							<div class="flex items-start gap-3">
								<CheckCircle class="mt-0.5 h-5 w-5 text-neutral-400" />
								<div class="flex-1">
									<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
										Account Status
									</p>
									<div class="mt-1 flex flex-wrap gap-2">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
												user?.is_active || false
											)}"
										>
											{user?.is_active ? 'Active' : 'Inactive'}
										</span>
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
												user?.is_verified || false
											)}"
										>
											{user?.is_verified ? 'Verified' : 'Unverified'}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="organization" class="w-full">
			<Card.Root>
				<Card.Header>
					<Card.Title>
						<h2
							class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
						>
							<Building2 class="h-5 w-5" />
							Organization Information
						</h2>
					</Card.Title>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div class="space-y-4 px-6 py-4">
						<!-- Organization Name -->
						<div class="flex items-start gap-3">
							<Building2 class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Organization Name
								</p>
								<p class="mt-1 text-base text-neutral-900 dark:text-white">
									{tenant?.name || 'N/A'}
								</p>
							</div>
						</div>

						<!-- Slug -->
						<div class="flex items-start gap-3">
							<Hash class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Organization Slug
								</p>
								<p class="mt-1 font-mono text-base text-neutral-900 dark:text-white">
									{tenant?.slug || 'N/A'}
								</p>
							</div>
						</div>

						<!-- Subscription Plan -->
						<div class="flex items-start gap-3">
							<Shield class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Subscription Plan
								</p>
								<div class="mt-1 flex flex-wrap items-center gap-2">
									<span
										class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize {getPlanColor(
											tenant?.subscription_plan || 'free'
										)}"
									>
										{tenant?.subscription_plan || 'N/A'}
									</span>
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
											tenant?.subscription_status === 'active' || false
										)}"
									>
										{tenant?.subscription_status === 'active' ? 'Active' : 'Inactive'}
									</span>
								</div>
							</div>
						</div>

						<!-- Limits -->
						<div class="border-t border-neutral-300 pt-4 dark:border-neutral-700">
							<p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
								Plan Limits
							</p>
							<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
								{#each limitCards as card}
									<div class="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-700/50">
										<p class="text-xs text-neutral-500 dark:text-neutral-400">{card.label}</p>
										<p class="text-lg font-semibold text-neutral-900 dark:text-white">
											{card.value()}
										</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="role-permission" class="w-full">
			<Card.Root>
				<Card.Header>
					<Card.Title>
						<h2
							class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
						>
							<Shield class="h-5 w-5" />
							Role & Permissions
						</h2>
					</Card.Title>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div class="space-y-4 px-6 py-4">
						<!-- Role Info -->
						<div class="flex items-start gap-3">
							<Shield class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Current Role
								</p>
								<div class="mt-1 flex items-center gap-2">
									<span class="text-base font-semibold capitalize text-neutral-900 dark:text-white">
										{role?.name?.replace(/_/g, ' ') || 'N/A'}
									</span>
									<span class="text-xs text-neutral-500 dark:text-neutral-400">
										(Level {role?.level})
									</span>
								</div>
								{#if role?.description}
									<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
										{role.description}
									</p>
								{/if}
							</div>
						</div>

						<!-- Permission Count -->
						{#if metadata?.permission_count}
							<div
								class="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20"
							>
								<div>
									<p class="text-sm font-medium text-blue-900 dark:text-blue-300">
										Total Permissions
									</p>
									<p class="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
										Granted to your role
									</p>
								</div>
								<div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
									{metadata.permission_count}
								</div>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="additional-information" class="w-full">
			<Card.Root>
				<Card.Header>
					<Card.Title>
						<h2
							class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
						>
							<Info class="h-5 w-5" />
							Additional Information
						</h2>
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4 px-6 py-4">
						<div class="flex items-start gap-3">
							<CheckCircle class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									User Status
								</p>
								<p class="mt-1 text-base capitalize text-neutral-900 dark:text-white">
									{metadata?.user_status?.replace(/_/g, ' ') || 'N/A'}
								</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Clock class="mt-0.5 h-5 w-5 text-neutral-400" />
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
									Last Updated
								</p>
								<p class="mt-1 text-base text-neutral-900 dark:text-white">
									{formatDate(metadata?.last_updated)}
								</p>
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
