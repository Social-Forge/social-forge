import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { forgotSchema } from '@/utils/form-schema.js';
import { fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async ({ url, locals }) => {
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: 'Forgot Password',
		is_homepage: false
	});

	const form = await superValidate(zod4(forgotSchema));

	return {
		pageMetaTags,
		form
	};
};
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(forgotSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				success: false,
				error: {
					message: 'Email is not valid'
				}
			});
		}

		try {
			const response = await locals.authServer.forgot(form.data);
			if (!response.success) {
				return fail(400, {
					form,
					success: false,
					error: {
						message: response?.message || 'Email not found'
					}
				});
			}
			return {
				form,
				success: true,
				message: response.message || 'Password reset email sent'
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
