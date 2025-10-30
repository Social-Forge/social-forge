<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import { superForm } from 'sveltekit-superforms';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui';

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
			await goto('/app/chats');
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
	<h2 class="text-2xl font-semibold">Verify Two Factor Authentication</h2>
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
					class="ps-10"
					placeholder="Enter your token"
					aria-invalid={!!$errors.token}
					autocomplete="on"
				/>
			</Field.Field>
			<Field.Field>
				<Field.Label for="otp">
					One-Time Password <span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<InputOTP.Root maxlength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} bind:value={$form.otp}>
					{#snippet children({ cells })}
						<InputOTP.Group>
							{#each cells as cell (cell)}
								<InputOTP.Slot {cell} />
							{/each}
						</InputOTP.Group>
					{/snippet}
				</InputOTP.Root>
				{#if $errors.otp}
					<Field.Error>{$errors.otp}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					{$submitting ? 'Please wait...' : 'Verify'}
				</Button>
			</Field.Field>
		</Field.Group>
	</form>
</div>
<div class="flex w-full flex-col items-start">
	<p class="text-muted-foreground text-sm">
		By verifying two factor authentication, you agree to our{' '}
		<a href="/terms" class="text-primary">
			Terms of Service{' '}
		</a>
		and{' '}
		<a href="/privacy" class="text-primary"> Privacy Policy </a>
	</p>
</div>
