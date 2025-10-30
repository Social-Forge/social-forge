import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { loginSchema } from '@/utils/form-schema.js';
import { fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async ({ url, locals }) => {
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: 'Sign In',
		is_homepage: false
	});

	const form = await superValidate(zod4(loginSchema));
	return {
		pageMetaTags,
		form
	};
};
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(loginSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Invalid input',
					fields: form.errors
				}
			});
		}
		try {
			const response = await locals.authServer.login(form.data);

			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response.message || 'Invalid input',
						fields: response.error?.details || form.errors
					}
				});
			}
			if (response.data?.two_fa_token && response.status === 202) {
				return fail(202, {
					form,
					success: false,
					error: {
						message: response.message || 'Two factor authentication required',
						two_fa_token: response.data?.two_fa_token || ''
					}
				});
			}
			locals.sessionHelper.setAuthCookies(
				{
					accessToken: response.data?.access_token || '',
					refreshToken: response.data?.refresh_token || ''
				},
				response.data?.expires_in || 60 * 60 * 24,
				response.data?.expires_refresh_in || 60 * 60 * 24 * 7
			);
			return {
				form,
				success: true,
				message: response.message || 'Login successful',
				data: response.data
			};
		} catch (error) {
			return fail(500, {
				form,
				success: false,
				error: {
					message: error instanceof Error ? error.message : 'Internal server error'
				}
			});
		}
	}
};
