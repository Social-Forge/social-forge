<script lang="ts">
	import { invalidateAll } from '$app/navigation';
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
		}
	});
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<h2 class="text-2xl font-semibold">Forgot Password</h2>
	{#if errorMessage}
		<Alert.Root variant="destructive">
			<Icon icon="mingcute:warning-line" class="size-4" />
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{errorMessage}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if successMessage}
		<Alert.Root variant="default">
			<Icon icon="mingcute:check-line" class="size-4" />
			<Alert.Title>Success</Alert.Title>
			<Alert.Description>{successMessage}</Alert.Description>
		</Alert.Root>
	{:else}
		<form method="POST" class="w-full" use:enhance>
			<Field.Group class="Root">
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
					<Button type="submit" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
						{/if}
						{$submitting ? 'Please wait...' : 'Reset Password'}
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	{/if}
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
		Remember password?{' '}
		<a href="/auth/sign-in" class="text-primary"> Sign in </a>
	</p>
</div>
