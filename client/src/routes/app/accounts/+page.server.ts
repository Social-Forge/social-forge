import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	updateProfileSchema,
	updateTenantSchema,
	updatePasswordSchema,
	activatedTwoFactorSchema,
	type UpdateProfileSchema,
	type UpdateTenantSchema
} from '@/utils/form-schema.js';
import { fail } from 'sveltekit-superforms';

export const load = async ({ url, locals }) => {
	const userTenant = locals.userTenant;

	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: `Accounts`,
		robots: 'noindex, follow',
		is_homepage: false
	});

	const user = userTenant?.user;
	const tenant = userTenant?.tenant;

	const initialValue: UpdateProfileSchema = {
		full_name: user?.full_name || '',
		email: user?.email || '',
		username: user?.username || '',
		phone: user?.phone || ''
	};
	const initialTenantValue: UpdateTenantSchema = {
		id: tenant?.id || '',
		name: tenant?.name || '',
		slug: tenant?.slug || '',
		subdomain: tenant?.subdomain || '',
		description: tenant?.description || ''
	};

	const form = await superValidate(initialValue, zod4(updateProfileSchema));
	const formTenantInfo = await superValidate(initialTenantValue, zod4(updateTenantSchema));
	const formUpdatePassword = await superValidate(zod4(updatePasswordSchema));
	const formActivatedTwoFactor = await superValidate(zod4(activatedTwoFactorSchema));

	return {
		pageMetaTags,
		userTenant,
		form,
		formTenantInfo,
		formUpdatePassword,
		formActivatedTwoFactor
	};
};
export const actions = {
	profile: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(updateProfileSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Invalid form input'
				}
			});
		}

		try {
			const response = await locals.userServer?.updateProfile(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response?.message || 'Failed to update profile'
					}
				});
			}
			return {
				form,
				success: true,
				message: response?.message || 'Profile updated successfully',
				data: response.data
			};
		} catch (error) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'Failed to update profile'
				}
			});
		}
	},
	'tenant-info': async ({ request, locals, url }) => {
		const form = await superValidate(request, zod4(updateTenantSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Invalid form input'
				}
			});
		}
		console.log(form.data);

		try {
			const response = await locals.tenantServer?.updateInfo(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response?.message || 'Failed to update tenant info'
					}
				});
			}
			return {
				form,
				success: true,
				message: response?.message || 'Tenant info updated successfully',
				data: response.data
			};
		} catch (error) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'Failed to update tenant info'
				}
			});
		}
	},
	'update-password': async ({ request, locals }) => {
		const form = await superValidate(request, zod4(updatePasswordSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Invalid form input'
				}
			});
		}

		try {
			const response = await locals.userServer?.changePassword(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response?.message || 'Failed to change password'
					}
				});
			}
			return {
				form,
				success: true,
				message: response?.message || 'Password changed successfully',
				data: response.data
			};
		} catch (error) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'Failed to change password'
				}
			});
		}
	},
	'activate-two-factor': async ({ request, locals }) => {
		const form = await superValidate(request, zod4(activatedTwoFactorSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Invalid form input'
				}
			});
		}

		try {
			const response = await locals.userServer.verifyTwoFactor(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response?.message || 'Failed to activate two-factor authentication'
					}
				});
			}
			return {
				form,
				success: true,
				message: response?.message || 'Two-factor authentication activated successfully',
				data: response.data
			};
		} catch (error) {
			return fail(400, {
				form,
				success: false,
				error: {
					message:
						error instanceof Error ? error.message : 'Failed to activate two-factor authentication'
				}
			});
		}
	}
};
