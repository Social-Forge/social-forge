<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} - {page.error?.message}</title>
	<meta name="description" content="Error {page.status}: {page.error?.message}" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href="/favicon.ico" type="image/x-icon" />
</svelte:head>
<main class="relative flex flex-col items-center justify-center px-4">
	<div class="mx-auto flex h-screen flex-col items-center justify-center">
		<div class="flex h-full flex-col items-center justify-center">
			<span
				class="not-found bg-linear-to-br rounded-md from-violet-400 to-purple-600 px-3.5 py-1 text-sm font-medium text-neutral-50"
			>
				{page.status}
			</span>
			<h1 class="mt-5 text-3xl font-bold text-neutral-50 md:text-5xl">
				{page.status === 404 ? 'Not Found' : page.status === 403 ? 'Forbidden' : 'Error'}
			</h1>
			<p class="mx-auto mt-5 max-w-xl text-center text-base font-medium text-neutral-400">
				{page.error?.message ||
					"The page you are looking for does not exist. <br /> But don&apos;t worry, we&apos;ve got you covered. You can{' '}"}
				<a href="/help" class="text-foreground">contact us</a>
				.
			</p>
			<a href="/" class="mt-8">
				<button
					class="bg-linear-to-br cursor-pointer rounded-md from-violet-400 to-purple-600 px-4 py-2 text-sm font-medium text-neutral-50 active:scale-95"
				>
					Back to homepage
				</button>
			</a>
		</div>
	</div>
</main>
