<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import { superForm } from 'sveltekit-superforms';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Password from '$lib/components/ui-extras/password';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import type { E164Number } from 'svelte-tel-input/types';
	import type { ZxcvbnResult } from '@zxcvbn-ts/core';
	import { PhoneInput } from '@/components/ui-extras/phone-input/index.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);

	let showConfirmPassword = $state(false);
	let phoneInput = $state<E164Number | undefined>('');
	let passwordInput = $state<string | undefined>('');
	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);
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
			await goto(`/auth/verify-email?email=${$form.email}`);
			await invalidateAll();
		}
	});
	const formatPhoneInput = (event: Event) => {
		let value = (event.target as HTMLInputElement).value;
		value = value.replace(/[^\d+]/g, '');

		if (value.startsWith('+')) {
			value = '+' + value.slice(1).replace(/\+/g, '');
		} else {
			value = value.replace(/\+/g, '');
		}

		(event.target as HTMLInputElement).value = value;
		$form.phone = value;
	};
	$effect(() => {
		if (data.form.data.phone && !phoneInput) {
			phoneInput = data.form.data.phone as E164Number;
		}
		if (phoneInput && typeof phoneInput === 'string' && phoneInput.trim() !== '') {
			const cleanNumber = phoneInput.replace(/[\s-]/g, '');
			$form.phone = cleanNumber;
		} else {
			$form.phone = '';
		}

		// if (data.form.data.password && !passwordInput) {
		// 	passwordInput = data.form.data.password as string;
		// 	$form.password = passwordInput;
		// }
	});
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<h2 class="text-2xl font-semibold">Sign Up on Social Forge</h2>
	{#if errorMessage}
		<Alert.Root variant="destructive">
			<Icon icon="mingcute:warning-line" class="size-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}
	<form method="POST" class="w-full" use:enhance>
		<Field.Group class="Root">
			<div class="grid grid-cols-2 gap-4">
				<Field.Field>
					<Field.Label for="first_name">
						First Name <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
						<Input
							bind:value={$form.first_name}
							name="first_name"
							type="text"
							class="ps-10"
							placeholder="Enter your first name"
							aria-invalid={!!$errors.first_name}
							autocomplete="given-name"
						/>
					</div>
					{#if $errors.first_name}
						<Field.Error>{$errors.first_name}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="last_name">
						Last Name <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
						<Input
							bind:value={$form.last_name}
							name="last_name"
							type="text"
							class="ps-10"
							placeholder="Enter your last name"
							aria-invalid={!!$errors.last_name}
							autocomplete="family-name"
						/>
					</div>
					{#if $errors.last_name}
						<Field.Error>{$errors.last_name}</Field.Error>
					{/if}
				</Field.Field>
			</div>
			<Field.Field>
				<Field.Label for="username">
					Username <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<div class="relative">
					<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.username}
						name="username"
						type="text"
						class="ps-10"
						placeholder="Enter your username"
						aria-invalid={!!$errors.username}
						autocomplete="username"
					/>
				</div>
				{#if $errors.username}
					<Field.Error>{$errors.username}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="email">
					Email <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<div class="relative">
					<Icon icon="mdi:email" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.email}
						name="email"
						type="email"
						class="ps-10"
						placeholder="Enter your email"
						aria-invalid={!!$errors.email}
						autocomplete="email"
					/>
				</div>
				{#if $errors.email}
					<Field.Error>{$errors.email}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Field.Label for="phone">
					Phone <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<PhoneInput
					bind:value={phoneInput}
					name="phone"
					country="US"
					placeholder="Enter your phone"
					disabled={$submitting}
				/>
				{#if $errors.phone}
					<Field.Error>{$errors.phone}</Field.Error>
				{/if}
			</Field.Field>
			<div class="grid grid-cols-2 gap-4">
				<Field.Field>
					<Field.Label for="password">
						Password <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="material-symbols:key" class="top-4.5 absolute left-3 -translate-y-1/2" />
						<Password.Root minScore={2}>
							<Password.Input
								bind:value={passwordInput}
								name="password"
								class="pe-10 ps-10"
								disabled={$submitting}
								placeholder="Enter your password"
								autocomplete="new-password"
								oninput={(e) => {
									$form.password = (e.target as HTMLInputElement).value;
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

					{#if $errors.password}
						<Field.Error>{$errors.password}</Field.Error>
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
			</div>
			<Field.Field>
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					{$submitting ? 'Please wait...' : 'Create Account'}
				</Button>
			</Field.Field>
			<Field.Separator>OR</Field.Separator>
			<Field.Field class="grid gap-4 sm:grid-cols-2">
				<Button type="button" variant="outline">
					<Icon icon="devicon:google" class="text-xl" />
					Sign up with Google
				</Button>
				<Button type="button" variant="outline">
					<Icon icon="devicon:facebook" class="text-xl" />
					Sign up with facebook
				</Button>
			</Field.Field>
		</Field.Group>
	</form>
</div>
<div class="flex w-full flex-col items-start">
	<p class="text-muted-foreground text-sm">
		By creating an account, you agree to our{' '}
		<a href="/terms" class="text-primary">
			Terms of Service{' '}
		</a>
		and{' '}
		<a href="/privacy" class="text-primary"> Privacy Policy </a>
	</p>
</div>
<div class="border-border/80 mt-auto flex w-full items-start border-t py-6">
	<p class="text-muted-foreground text-sm">
		Already have an account?{' '}
		<a href="/auth/sign-in" class="text-primary"> Sign in </a>
	</p>
</div>
