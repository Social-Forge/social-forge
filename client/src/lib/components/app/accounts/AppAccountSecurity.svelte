<script lang="ts">
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { UpdatePasswordSchema, ActivatedTwoFactorSchema } from '@/utils';
	import * as Card from '@/components/ui/card';
	import { Separator } from '@/components/ui/separator';
	import { Button } from '@/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { cn } from '@/utils';
	import Icon from '@iconify/svelte';
	import { AppAccountPasswordForm, AppAccountTwoFactor } from '@/components/app';

	let {
		user: profile,
		passwordForm,
		activatedTwoFactorForm
	}: {
		user?: UserTenantWithDetails | null;
		passwordForm: SuperValidated<UpdatePasswordSchema>;
		activatedTwoFactorForm: SuperValidated<ActivatedTwoFactorSchema>;
	} = $props();

	let user = $derived(profile?.user);

	let activeTab = $state('password');

	const tabs = [
		{
			key: 'password',
			label: 'Password'
		},
		{
			key: 'two-factor',
			label: 'Two-Factor Authentication'
		}
	];
</script>

<div class="w-full space-y-6">
	<Card.Root>
		<Card.Content>
			<div
				class="flex flex-col items-start gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-6 dark:border-yellow-600 dark:bg-yellow-600/10"
			>
				<div class="flex items-center gap-2">
					<Icon icon="si:warning-fill" class="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
					<span class="text-sm font-semibold text-yellow-500 dark:text-yellow-400">Warning</span>
				</div>
				<p class="text-sm text-neutral-500 dark:text-neutral-400">
					We recommend using a unique password and enable two-factor authentication for each of your
					accounts.
				</p>
			</div>
		</Card.Content>
	</Card.Root>
	<Tabs.Root value={activeTab} class="space-y-6" onValueChange={(value) => (activeTab = value)}>
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
		<Tabs.Content value="password" class="w-full">
			<AppAccountPasswordForm form={passwordForm} />
		</Tabs.Content>
		<Tabs.Content value="two-factor" class="w-full">
			<AppAccountTwoFactor form={activatedTwoFactorForm} {user} />
		</Tabs.Content>
	</Tabs.Root>
</div>
