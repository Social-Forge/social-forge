<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import Icon from '@iconify/svelte';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);

	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);
	let progressValue = $state<number>(0);
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title>
				{data.type == 'email' ? 'Validate Email' : 'Validate Reset Password'}
			</Card.Title>
			<Card.Description>Please wait while we verify your account.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if errorMessage}
				<Alert.Root variant="destructive">
					<Icon icon="mingcute:warning-line" class="size-4" />
					<Alert.Title>Error</Alert.Title>
					<Alert.Description>{errorMessage}</Alert.Description>
				</Alert.Root>
			{:else if successMessage}
				<Alert.Root variant="default">
					<Icon icon="mingcute:check-line" class="size-4" />
					<Alert.Title>Success</Alert.Title>
					<Alert.Description>{successMessage}</Alert.Description>
				</Alert.Root>
				<Button type="button" variant="default" href="/auth/sign-in">Go back to sign in</Button>
			{:else}
				<Progress value={progressValue} class="w-full" />
				<div class="flex items-center justify-center gap-2">
					<Spinner class="size-4" />
					<p class="text-sm opacity-70">Verifying account...</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
