import { redirect } from '@sveltejs/kit';
export const load = async (event) => {
	const { userTenant } = event.locals;

	if (!userTenant || !userTenant.user || !userTenant.tenant) {
		throw redirect(302, '/auth/sign-in');
	}
	return {
		userTenant
	};
};
