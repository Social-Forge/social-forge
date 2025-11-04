<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import { AppSidebarLayout } from '@/components/app';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);
</script>

<MetaTags {...metaTags} />
<AppSidebarLayout page="Analytics" user={data.user}>
	<!-- Your HTML content here -->
</AppSidebarLayout>

<style scoped>
	/* Your styles here */
</style>
