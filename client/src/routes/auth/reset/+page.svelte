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
					<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.new_password}
						name="new_password"
						type={passwordType}
						class="pe-10 ps-10"
						placeholder="Enter your password"
						aria-invalid={!!$errors.new_password}
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
