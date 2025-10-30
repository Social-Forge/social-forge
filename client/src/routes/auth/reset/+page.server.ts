import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { resetPasswordSchema, type ResetPasswordSchema } from '@/utils/form-schema.js';
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
		title: 'Reset Password',
		is_homepage: false
	});

	const form = await superValidate(zod4(resetPasswordSchema));

	return {
		pageMetaTags,
		form,
		token
	};
};
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				succcess: false,
				error: {
					message: 'Invalid token'
				}
			});
		}

		try {
			const response = await locals.authServer.resetPassword(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					succcess: false,
					error: {
						message: response.message
					}
				});
			}

			return {
				form,
				succcess: true,
				message: response.message || 'Password reset successfully',
				data: response.data
			};
		} catch (error) {
			return fail(500, {
				form,
				succcess: false,
				error: {
					message: error instanceof Error ? error.message : 'Reset password failed'
				}
			});
		}
	}
};
