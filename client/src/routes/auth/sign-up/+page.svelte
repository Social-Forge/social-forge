<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import { superForm } from 'sveltekit-superforms';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);

	let passwordType = $state('password');
	let confirmPasswordType = $state('password');
	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);

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
				<div class="relative">
					<Icon icon="mdi:phone" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.phone}
						name="phone"
						type="text"
						class="ps-10"
						placeholder="Enter your phone"
						aria-invalid={!!$errors.phone}
						autocomplete="tel"
						disabled={$submitting}
						oninput={formatPhoneInput}
					/>
				</div>
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
						<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
						<Input
							bind:value={$form.password}
							name="password"
							type={passwordType}
							class="pe-10 ps-10"
							placeholder="Enter your password"
							aria-invalid={!!$errors.password}
							autocomplete="new-password"
						/>

						<Button
							variant="ghost"
							size="icon"
							class="absolute right-1 top-1/2 size-8 -translate-y-1/2 cursor-pointer"
							onclick={() => (passwordType = passwordType === 'password' ? 'text' : 'password')}
						>
							<Icon
								icon={passwordType === 'password' ? 'mdi:eye' : 'mdi:eye-off'}
								class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
							/>
						</Button>
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
							type={confirmPasswordType}
							class="pe-10 ps-10"
							placeholder="Enter your confirm password"
							aria-invalid={!!$errors.confirm_password}
							autocomplete="new-password"
						/>

						<Button
							variant="ghost"
							size="icon"
							class="absolute right-1 top-1/2 size-8 -translate-y-1/2 cursor-pointer"
							onclick={() =>
								(confirmPasswordType = confirmPasswordType === 'password' ? 'text' : 'password')}
						>
							<Icon
								icon={confirmPasswordType === 'password' ? 'mdi:eye' : 'mdi:eye-off'}
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
