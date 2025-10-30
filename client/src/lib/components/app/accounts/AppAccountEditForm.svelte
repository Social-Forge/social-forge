<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { UpdateProfileSchema } from '@/utils';
	import { AppAlertDialog } from '@/components';

	let {
		form: updateForm,
		user
	}: { user?: User | null; form: SuperValidated<UpdateProfileSchema> } = $props();

	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const { form, errors, submitting, enhance } = superForm(updateForm, {
		resetForm: false,
		onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.error.message;
				return;
			}
			successMessage = event.result.data.message || 'Profile updated successfully';
		},
		onError(event) {
			errorMessage = event.result.error.message || 'An error occurred';
		}
	});
</script>

<form method="POST" class="space-y" use:enhance></form>

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
