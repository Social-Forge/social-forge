<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { AppSidebarLayout } from '@/components/app';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);
</script>

<MetaTags {...metaTags} />
<AppSidebarLayout page="Chatbot AI" user={data.user}>
	<!-- Your HTML content here -->
</AppSidebarLayout>
f

<style scoped>
	/* Your styles here */
</style>
