<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { UpdatePasswordSchema } from '@/utils';
	import type { ZxcvbnResult } from '@zxcvbn-ts/core';
	import * as Password from '$lib/components/ui-extras/password';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '@/components/ui/separator';
	import { handleSubmitLoading } from '@/stores';
	import { AppAlertDialog } from '@/components';
	import Icon from '@iconify/svelte';

	let { form: passwordForm }: { form: SuperValidated<UpdatePasswordSchema> } = $props();

	let passwordInput = $state<string | undefined>('');
	const SCORE_NAMING = ['Poor', 'Weak', 'Average', 'Strong', 'Secure'];
	let strength = $state<ZxcvbnResult>();
	let newPasswordInput = $state<string | undefined>('');
	let confirmPasswordType = $state('password');
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const { form, errors, submitting, enhance } = superForm(passwordForm, {
		resetForm: true,
		onUpdate(event) {
			if (event.result.type === 'failure') {
				handleSubmitLoading(false);
				errorMessage = event.result.data.error.message;
				return;
			}
			handleSubmitLoading(false);
			successMessage = event.result.data.message || 'Password updated successfully';
		},
		onError(event) {
			handleSubmitLoading(false);
			errorMessage = event.result.error.message || 'An error occurred';
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
				<Icon icon="material-symbols:password" class="h-5 w-5" />
				Change Password
			</h2>
		</Card.Title>
		<Card.Description>
			Please enter your current password and new password to update your password.
		</Card.Description>
	</Card.Header>
	<Separator />
	<Card.Content>
		<form
			method="POST"
			action="?/update-password"
			class="space-y-6 px-2 py-5 md:px-4 md:py-6"
			use:enhance
		>
			<Field.Group>
				<Field.Field>
					<Field.Label for="current_password">
						Current Password <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
						<Password.Root minScore={2}>
							<Password.Input
								bind:value={passwordInput}
								name="current_password"
								class="pe-10 ps-10"
								disabled={$submitting}
								placeholder="Enter your current password"
								autocomplete="current-password"
								oninput={(e) => {
									$form.current_password = (e.target as HTMLInputElement).value;
								}}
							>
								<Password.ToggleVisibility />
							</Password.Input>
						</Password.Root>
					</div>
					{#if $errors.current_password}
						<Field.Error>{$errors.current_password}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="new_password">
						New Password <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="material-symbols:key" class="top-4.5 absolute left-3 -translate-y-1/2" />
						<Password.Root minScore={2}>
							<Password.Input
								bind:value={newPasswordInput}
								name="new_password"
								class="pe-10 ps-10"
								disabled={$submitting}
								placeholder="Enter your new password"
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
						Confirm New Password <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<div class="relative">
						<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
						<Input
							bind:value={$form.confirm_password}
							name="confirm_password"
							type={confirmPasswordType}
							class="pe-10 ps-10"
							placeholder="Confirm your new password"
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
				<Field.Field orientation="horizontal" class="mt-6 justify-end pb-4">
					<Button type="submit" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
						{/if}
						{$submitting ? 'Please wait...' : 'Update Password'}
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
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
