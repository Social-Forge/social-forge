<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { ActivatedTwoFactorSchema } from '@/utils';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Password from '$lib/components/ui-extras/password';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Switch } from '@/components/ui/switch';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '@/components/ui/separator';
	import { handleSubmitLoading } from '@/stores';
	import { AppAlertDialog } from '@/components';
	import Icon from '@iconify/svelte';
	import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui';
	import { toast } from '@/stores';

	let {
		form: activatedTwoFactorForm,
		user
	}: { form: SuperValidated<ActivatedTwoFactorSchema>; user?: User | null } = $props();

	let enableTwoFactor = $derived(user?.two_fa_secret !== undefined);
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let qrCode = $state<string | null>(null);
	let secret = $state<string | null>(null);

	const { form, errors, submitting, enhance } = superForm(activatedTwoFactorForm, {
		resetForm: true,
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				handleSubmitLoading(false);
				errorMessage = event.result.data.error.message;
				return;
			}
			handleSubmitLoading(false);
			resetTwoFactor();
			successMessage =
				event.result.data.message || 'Two factor authentication activated successfully';
			await invalidateAll();
		},
		onError(event) {
			handleSubmitLoading(false);
			errorMessage = event.result.error.message || 'An error occurred';
		}
	});

	const handleEnableTwoFactor = async () => {
		try {
			isSubmitting = true;
			handleSubmitLoading(true);

			const response = await fetch('/api/user/two-factor', {
				method: 'POST',
				body: JSON.stringify({ status: enableTwoFactor })
			});
			const data = await response.json();

			if (!response.ok) {
				handleSubmitLoading(false);
				toast.error(data.message || 'Internal server error');
				return;
			}
			if (!data.data?.qr_code && !data.data?.secret) {
				handleSubmitLoading(false);
				toast.error(data.message || 'Internal server error');
				return;
			}
			qrCode = data.data?.qr_code || null;
			secret = data.data?.secret || null;
			handleSubmitLoading(false);
			toast.success(data.message || 'Two factor authentication activated successfully');
		} catch (error) {
			handleSubmitLoading(false);
			toast.error(error instanceof Error ? error.message : 'Internal server error');
		}
	};
	function resetTwoFactor() {
		qrCode = null;
		secret = null;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
				<Icon icon="material-symbols:shield-locked-outline" class="h-5 w-5" />
				Enable 2-Step Verification
			</h2>
		</Card.Title>
		<Card.Description>
			Enable two-step verification to add an extra layer of security to your account.
		</Card.Description>
	</Card.Header>
	<Separator />
	<Card.Content>
		<Field.Group>
			<Field.Set>
				<Field.Field orientation="horizontal">
					<Field.Content>
						<Field.Label for="enable_two_factor">
							{enableTwoFactor ? 'Enabled' : 'Disabled'}
						</Field.Label>
						<Field.Description>
							{enableTwoFactor
								? 'Two-step verification is enabled.'
								: 'Two-step verification is disabled.'}
						</Field.Description>
					</Field.Content>
					<input type="hidden" name="enable_two_factor" value={enableTwoFactor} />
					<Switch
						id="enable_two_factor"
						bind:checked={enableTwoFactor}
						name="enable_two_factor"
						class="cursor-pointer"
						disabled={isSubmitting}
						onCheckedChange={handleEnableTwoFactor}
					/>
				</Field.Field>
			</Field.Set>
		</Field.Group>

		{#if qrCode && secret}
			<form
				method="POST"
				action="?/activate-two-factor"
				class="mt-5 flex w-full items-center justify-center px-2 py-5 md:px-4 md:py-6"
				use:enhance
			>
				<Field.Group class="flex max-w-md flex-col items-center justify-center gap-5 rounded">
					<Field.Field
						class="flex max-w-full flex-col items-center justify-center gap-5 rounded text-center"
					>
						<Field.Description>Scan this QR code with your authenticator app.</Field.Description>
						<div class="flex max-w-52 bg-white p-2">
							<img src={qrCode} alt="QR Code" class="h-48 max-w-48 object-fill" />
						</div>
					</Field.Field>
					<Field.Separator>OR</Field.Separator>
					<Field.Field>
						<Field.Label>Copy the secret code</Field.Label>
						<Field.Field orientation="horizontal">
							<Password.Root class="w-full">
								<Password.Input value={secret}>
									<Password.ToggleVisibility />
									<Password.Copy />
								</Password.Input>
							</Password.Root>
						</Field.Field>
					</Field.Field>
					<Field.Field>
						<Field.Label for="code">
							One-Time Code <span class="text-red-500 dark:text-red-400">*</span>
						</Field.Label>
						<InputOTP.Root
							maxlength={6}
							pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
							bind:value={$form.code}
							name="code"
							onValueChange={(value) => ($form.code = value)}
						>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells as cell (cell)}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
						{#if $errors.code}
							<Field.Error>{$errors.code}</Field.Error>
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
		{/if}
	</Card.Content>
</Card.Root>
{#if errorMessage}
	<AppAlertDialog
		open={true}
		type="error"
		title="Error"
		message={errorMessage || 'An error occurred'}
		onclose={() => {
			errorMessage = null;
		}}
	/>
{/if}

{#if successMessage}
	<AppAlertDialog
		open={true}
		type="success"
		title="Success"
		message={successMessage || 'Profile updated successfully'}
		onclose={() => {
			successMessage = null;
		}}
	/>
{/if}
