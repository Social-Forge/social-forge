<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { cn, type UpdateTenantSchema } from '@/utils';
	import { AppAlertDialog } from '@/components';
	import { Textarea } from '@/components/ui/textarea';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Icon from '@iconify/svelte';
	import { Spinner } from '@/components/ui/spinner';
	import { Button } from '@/components/ui/button';
	import { handleSubmitLoading } from '@/stores';

	let {
		openform = $bindable(),
		form: updateForm,
		tenant: tenant
	}: {
		openform: boolean;
		tenant?: Tenant | null;
		form: SuperValidated<UpdateTenantSchema>;
	} = $props();

	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const { form, errors, submitting, enhance } = superForm(updateForm, {
		resetForm: false,
		onUpdate(event) {
			if (event.result.type === 'failure') {
				handleSubmitLoading(false);
				errorMessage = event.result.data.error.message;
				return;
			}
			handleSubmitLoading(false);
			successMessage = event.result.data.message || 'Profile updated successfully';
			openform = false;
		},
		onError(event) {
			handleSubmitLoading(false);
			errorMessage = event.result.error.message || 'An error occurred';
		}
	});

	const generateSlug = () => {
		$form.slug = $form.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	};
	const validateSlug = () => {
		if (!$form.slug && !/^[a-z0-9-]+$/.test($form.slug)) {
			errors.set({
				slug: ['Slug must contain only lowercase letters, numbers, and hyphens.']
			});
			return false;
		}
		return true;
	};
</script>

<form method="POST" action="?/tenant-info" class="space-y-6 px-2 py-5 md:px-4 md:py-6" use:enhance>
	<input type="hidden" name="id" bind:value={$form.id} />
	<Field.Group
		class="rounded-lg border-t border-neutral-200 bg-neutral-50 px-2 py-5 shadow-xl md:px-4 md:py-6 dark:border-neutral-700 dark:bg-neutral-900"
	>
		<Field.Field>
			<Field.Label for="full_name">
				Name <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="mdi:account" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.name}
					name="name"
					type="text"
					class="ps-10"
					placeholder="Enter your tenant name"
					aria-invalid={!!$errors.name}
					autocomplete="name"
					disabled={$submitting}
					oninput={generateSlug}
				/>
			</div>
			{#if $errors.name}
				<Field.Error>{$errors.name}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="slug">
				Slug <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="line-md:link" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.slug}
					name="slug"
					type="text"
					class="ps-10"
					placeholder="Enter your tenant slug"
					aria-invalid={!!$errors.slug}
					autocomplete="on"
					disabled={$submitting}
					oninput={validateSlug}
				/>
				{#if !$form.slug || $errors.slug}
					<Button
						type="button"
						size="sm"
						class="absolute right-0 top-1/2 -translate-y-1/2"
						onclick={generateSlug}
					>
						Generate Slug
					</Button>
				{/if}
			</div>
			{#if $errors.slug}
				<Field.Error>{$errors.slug}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="subdomain">
				Subdomain <span class="text-red-500 dark:text-red-400">*</span>
			</Field.Label>
			<div class="relative">
				<Icon icon="gridicons:domains" class="absolute left-3 top-1/2 -translate-y-1/2" />
				<Input
					bind:value={$form.subdomain}
					name="subdomain"
					type="text"
					class="ps-10"
					placeholder="Enter your tenant subdomain"
					aria-invalid={!!$errors.subdomain}
					autocomplete="on"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.subdomain}
				<Field.Error>{$errors.subdomain}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Field.Label for="description">Description</Field.Label>
			<Textarea
				bind:value={$form.description}
				name="description"
				placeholder="Enter your tenant description"
				aria-invalid={!!$errors.description}
				autocomplete="on"
				disabled={$submitting}
			/>
			{#if $errors.description}
				<Field.Error>{$errors.description}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field orientation="horizontal" class="mt-6 justify-end pb-4">
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Please wait...' : 'Update Tenant'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>

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
