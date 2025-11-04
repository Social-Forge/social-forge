<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { AppSidebar } from '@/components/app';
	import Icon from '@iconify/svelte';
	import { createCountdownStore, DateUtils } from '@/stores';

	let {
		children,
		page,
		user
	}: {
		children?: Snippet;
		page?: string;
		user?: UserTenantWithDetails | null;
	} = $props();

	const countdown = $derived(createCountdownStore(user?.tenant?.trial_ends_at || ''));
	const status = $derived(
		DateUtils.getExpirationStatusThreeDayFromNow(user?.tenant?.trial_ends_at || '')
	);
</script>

<Sidebar.Provider style="--sidebar-width: 350px;" open={false}>
	<AppSidebar {user} />
	<Sidebar.Inset>
		{#if status.status === 'warning' || status.status === 'expired'}
			<div
				class="flex w-full flex-col items-center justify-center gap-2 rounded border border-yellow-500 bg-yellow-50 px-4 py-2 md:flex-row md:justify-between dark:border-yellow-400 dark:bg-yellow-500/15"
			>
				<div class="flex gap-2">
					<Icon icon="mingcute:warning-fill" class="size-5 text-yellow-500" />
					<div class="text-sm text-yellow-500">
						{status.status === 'warning'
							? 'Subscription period will end soon'
							: 'Subscription period has ended'}
					</div>
				</div>
				<div class="flex items-center gap-4 text-center text-lg">
					<div
						class="w-12 rounded-lg border border-yellow-500 bg-yellow-500/20 py-1 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-700/30"
					>
						<div class="font-mono text-sm leading-none">{$countdown.timeRemaining.days}</div>
						<div class="font-mono text-[10px] uppercase leading-none">Days</div>
					</div>
					<div
						class="w-12 rounded-lg border border-yellow-500 bg-yellow-500/20 py-1 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-700/30"
					>
						<div class="font-mono text-sm leading-none">{$countdown.timeRemaining.hours}</div>
						<div class="font-mono text-[10px] uppercase leading-none">Hours</div>
					</div>
					<div
						class="w-12 rounded-lg border border-yellow-500 bg-yellow-500/20 py-1 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-700/30"
					>
						<div class="font-mono text-sm leading-none">
							{$countdown.timeRemaining.minutes}
						</div>
						<div class="font-mono text-[10px] uppercase leading-none">Minutes</div>
					</div>
					<div
						class="w-12 rounded-lg border border-yellow-500 bg-yellow-500/20 py-1 text-yellow-500 dark:border-yellow-500 dark:bg-yellow-700/30"
					>
						<div class="font-mono text-sm leading-none">
							{$countdown.timeRemaining.seconds}
						</div>
						<div class="font-mono text-[10px] uppercase leading-none">Seconds</div>
					</div>
				</div>
				<div>
					<Button
						href="/app/billings?key=upgrade"
						target="_blank"
						variant="default"
						size="sm"
						class="text-xs">Upgrade Now</Button
					>
				</div>
			</div>
		{/if}
		<header
			class="sticky top-0 flex w-full shrink-0 items-center justify-between border-b bg-neutral-50 p-4 dark:bg-neutral-900"
		>
			<div class="flex items-center gap-2">
				<Sidebar.Trigger class="-ml-1 block md:hidden" />
				<Separator
					orientation="vertical"
					class="mr-2 block data-[orientation=vertical]:h-4 md:hidden"
				/>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="##">
								{#snippet children()}
									<div class="font-semibold text-neutral-900 dark:text-neutral-50">
										{page}
									</div>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			<div class="flex items-center gap-2 py-0">
				<Icon icon="material-symbols:notifications-sharp" class="text-primary-app size-5" />
			</div>
		</header>
		<div class="bg-background flex flex-1 flex-col gap-4 p-4">
			{@render children?.()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
