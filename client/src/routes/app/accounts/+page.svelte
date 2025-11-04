<script lang="ts">
	import { page } from '$app/state';
	import { MetaTags } from 'svelte-meta-tags';
	import {
		AppSidebarLayout,
		AppAccountLayout,
		AppAccountInformation,
		AppAccountSecurity
	} from '@/components/app';

	let { data } = $props();
	let metaTags = $derived(data.pageMetaTags);
</script>

<MetaTags {...metaTags} />
<AppSidebarLayout page="Accounts" user={data.userTenant}>
	<AppAccountLayout>
		{#if page.url.searchParams.get('key') === 'profile'}
			<AppAccountInformation
				user={data.userTenant}
				form={data.form}
				tenantForm={data.formTenantInfo}
			/>
		{/if}
		{#if page.url.searchParams.get('key') === 'security'}
			<AppAccountSecurity
				user={data.userTenant}
				passwordForm={data.formUpdatePassword}
				activatedTwoFactorForm={data.formActivatedTwoFactor}
			/>
		{/if}
	</AppAccountLayout>
</AppSidebarLayout>
