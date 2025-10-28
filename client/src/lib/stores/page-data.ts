import { writable, derived } from 'svelte/store';

export const userTenantStore = writable<UserTenantWithDetails | null>(null);

export const user = derived(userTenantStore, ($userTenant) => $userTenant?.user || null);
export const tenant = derived(userTenantStore, ($userTenant) => $userTenant?.tenant || null);
export const userTenant = derived(userTenantStore, ($userTenant) => $userTenant || null);
export const role = derived(userTenantStore, ($userTenant) => $userTenant?.role || null);
export const rolePermission = derived(
	userTenantStore,
	($userTenant) => $userTenant?.role_permissions || null
);
export const userMetadata = derived(
	userTenantStore,
	($userTenant) => $userTenant?.metadata || null
);
