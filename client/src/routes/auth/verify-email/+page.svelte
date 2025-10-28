<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);
</script>

<MetaTags {...metaTags} />
<div class="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title>Verify Email</Card.Title>
			<Card.Description>
				We sent a verification email to <span class="text-foreground">{data.email}</span>. Please
				check your inbox and click the link to verify your email address.
			</Card.Description>
		</Card.Header>
		<Card.CardFooter>
			<Button type="button" variant="default" href="/auth/sign-in">Go back to sign in</Button>
		</Card.CardFooter>
	</Card.Root>
</div>
