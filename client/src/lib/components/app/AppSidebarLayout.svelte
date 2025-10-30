<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { AppSidebar } from '@/components/app';
	import Icon from '@iconify/svelte';

	let {
		children,
		page,
		user
	}: {
		children?: Snippet;
		page?: string;
		user?: UserTenantWithDetails | null;
	} = $props();
	const sidebar = useSidebar();
</script>

<Sidebar.Provider style="--sidebar-width: 350px;" open={false}>
	<AppSidebar {user} />
	<Sidebar.Inset>
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
