<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';
	import { superForm } from 'sveltekit-superforms';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '@/components/ui/checkbox';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);

	let passwordType = $state('password');
	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);

	const { form, enhance, errors, submitting } = superForm(data.form, {
		async onSubmit(input) {
			errorMessage = undefined;
			successMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				if (event.result.status === 202 && event.result.data.error.two_fa_token) {
					await goto(`/auth/verify-two-factor?token=${event.result.data.error.two_fa_token}`);
					return;
				} else {
					errorMessage = event.result.data.error.message;
					return;
				}
			}
			successMessage = event.result.data.message;
			await invalidateAll();
			await goto('/app/chats');
		}
	});

	let isEmailFormat = $derived(
		$form.identifier.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($form.identifier)
	);
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<h2 class="text-2xl font-semibold">Sign in to Social Forge</h2>
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
				<Field.Label for="identifier">
					{isEmailFormat ? 'Email' : 'Username'}
					<span class="text-red-500 dark:text-red-400">*</span>
				</Field.Label>
				<div class="relative">
					<Icon
						icon={isEmailFormat ? 'mdi:email' : 'mdi:account'}
						class="absolute left-3 top-1/2 -translate-y-1/2"
					/>
					<Input
						bind:value={$form.identifier}
						name="identifier"
						type="text"
						class="ps-10"
						placeholder="Enter your email or username"
						aria-invalid={!!$errors.identifier}
						autocomplete={isEmailFormat ? 'email' : 'username'}
					/>
				</div>
				{#if $errors.identifier}
					<Field.Error>{$errors.identifier}</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field>
				<div class="flex items-center">
					<Field.Label for="password">
						Password <span class="text-red-500 dark:text-red-400">*</span>
					</Field.Label>
					<a href="/auth/forgot" class="ml-auto text-xs underline-offset-4 hover:underline">
						Forgot your password?
					</a>
				</div>
				<div class="relative">
					<Icon icon="material-symbols:key" class="absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						bind:value={$form.password}
						name="password"
						type={passwordType}
						class="ps-10"
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
			<Field.Field orientation="horizontal">
				<Checkbox id="remember_me" name="remember_me" bind:checked={$form.remember_me} />
				<Field.Label for="remember_me" class="font-normal">Remember me</Field.Label>
			</Field.Field>
			<Field.Field>
				<Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					{$submitting ? 'Please wait...' : 'Sign In'}
				</Button>
			</Field.Field>
			<Field.Separator>OR</Field.Separator>
			<Field.Field class="grid gap-4 sm:grid-cols-2">
				<Button type="button" variant="outline">
					<Icon icon="devicon:google" class="text-xl" />
					Sign in with Google
				</Button>
				<Button type="button" variant="outline">
					<Icon icon="devicon:facebook" class="text-xl" />
					Sign in with facebook
				</Button>
			</Field.Field>
		</Field.Group>
	</form>
</div>

<div class="flex w-full flex-col items-start">
	<p class="text-muted-foreground text-sm">
		By signing in, you agree to our{' '}
		<a href="/terms" class="text-primary">
			Terms of Service{' '}
		</a>
		and{' '}
		<a href="/privacy" class="text-primary"> Privacy Policy </a>
	</p>
</div>
<div class="border-border/80 mt-auto flex w-full items-start border-t py-6">
	<p class="text-muted-foreground text-sm">
		Don&apos;t have an account?{' '}
		<a href="/auth/sign-up" class="text-primary"> Sign up </a>
	</p>
</div>
