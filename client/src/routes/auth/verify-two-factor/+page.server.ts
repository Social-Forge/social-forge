import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { verifyTwoFactorSchema } from '@/utils/form-schema.js';
import { fail, redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async ({ url, locals }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		throw redirect(302, '/auth/sign-in');
	}
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: 'Verify Two Factor Authentication',
		is_homepage: false
	});

	const form = await superValidate(zod4(verifyTwoFactorSchema));
	return {
		pageMetaTags,
		form,
		token
	};
};
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(verifyTwoFactorSchema));
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

		const response = await locals.authServer.verifyTwoFactor(form.data);
		if (!response.success) {
			return fail(response.status, {
				form,
				success: false,
				error: {
					message: response.message,
					fields: form.errors
				}
			});
		}
		if (!response.data?.access_token || !response.data?.refresh_token) {
			return fail(500, {
				form,
				success: false,
				error: {
					message: 'Invalid response',
					fields: form.errors
				}
			});
		}
		locals.sessionHelper.setAuthCookies(
			{
				accessToken: response.data.access_token,
				refreshToken: response.data.refresh_token
			},
			response.data?.expires_in || 60 * 60 * 24,
			response.data?.expires_refresh_in || 60 * 60 * 24 * 7
		);

		throw redirect(302, '/app/chats');
	}
};
