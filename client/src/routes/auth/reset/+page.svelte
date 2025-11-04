<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import { superForm } from 'sveltekit-superforms';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Password from '$lib/components/ui-extras/password';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import type { ZxcvbnResult } from '@zxcvbn-ts/core';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);

	let showConfirmPassword = $state(false);
	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);
	let passwordInput = $state<string | undefined>('');
	const SCORE_NAMING = ['Poor', 'Weak', 'Average', 'Strong', 'Secure'];
	let strength = $state<ZxcvbnResult>();

	const { form, enhance, errors, submitting } = superForm(data.form, {
		async onSubmit(input) {
			errorMessage = undefined;
			successMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.error.message;
				return;
			}
			successMessage = event.result.data.message;
			await invalidateAll();
			await goto('/auth/sign-in');
		}
	});

	$effect(() => {
		if (data.token.trim().length === 0) {
			errorMessage = 'Token is required';
			return;
		}
		$form.token = data.token;
	});
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<h2 class="text-2xl font-semibold">Reset Password on Social Forge</h2>
	{#if errorMessage}
		<Alert.Root variant="destructive">
			<Icon icon="mingcute:warning-line" class="size-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}
	<form method="POST" class="w-full" use:enhance>
		<Field.Group class="Root">
			<Field.Field>
				<Input
					bind:value={$form.token}
					name="token"
					type="hidden"
					aria-invalid={!!$errors.token}
					autocomplete="on"
				/>
			</Field.Field>
			<Field.Field>
				<Field.Label for="new_password">
					New Password <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<div class="relative">
					<Icon icon="material-symbols:key" class="top-4.5 absolute left-3 -translate-y-1/2" />
					<Password.Root minScore={2}>
						<Password.Input
							bind:value={passwordInput}
							name="new_password"
							class="pe-10 ps-10"
							disabled={$submitting}
							placeholder="Enter your password"
							autocomplete="new-password"
							oninput={(e) => {
								$form.new_password = (e.target as HTMLInputElement).value;
							}}
						>
							<Password.ToggleVisibility />
						</Password.Input>
						<div class="flex flex-col gap-1">
							<Password.Strength bind:strength />
							<span class="text-muted-foreground text-sm">
								{SCORE_NAMING[strength?.score ?? 0]}
							</span>
						</div>
					</Password.Root>
				</div>
				{#if $errors.new_password}
					<Field.Error>{$errors.new_password}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="confirm_password">
					Confirm Password <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<div class="relative">
					<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.confirm_password}
						name="confirm_password"
						type={showConfirmPassword ? 'text' : 'password'}
						class="pe-10 ps-10"
						placeholder="Enter your confirm password"
						aria-invalid={!!$errors.confirm_password}
						autocomplete="new-password"
					/>

					<Button
						variant="ghost"
						size="icon"
						class="absolute right-1 top-1/2 size-8 -translate-y-1/2 cursor-pointer"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
					>
						<Icon
							icon={showConfirmPassword ? 'mdi:eye' : 'mdi:eye-off'}
							class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
						/>
					</Button>
				</div>
				{#if $errors.confirm_password}
					<Field.Error>{$errors.confirm_password}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					{$submitting ? 'Please wait...' : 'Reset Password'}
				</Button>
			</Field.Field>
		</Field.Group>
	</form>
</div>
<div class="flex w-full flex-col items-start">
	<p class="text-muted-foreground text-sm">
		By resetting your password, you agree to our{' '}
		<a href="/terms" class="text-primary">
			Terms of Service{' '}
		</a>
		and{' '}
		<a href="/privacy" class="text-primary"> Privacy Policy </a>
	</p>
</div>
<div class="border-border/80 mt-auto flex w-full items-start border-t py-6">
	<p class="text-muted-foreground text-sm">
		Forget it, back to{' '}
		<a href="/auth/sign-in" class="text-primary"> Sign in </a>
	</p>
</div>
