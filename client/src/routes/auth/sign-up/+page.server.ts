import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { registerSchema } from '@/utils/form-schema.js';
import { fail, redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async ({ url, locals }) => {
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: 'Sign Up',
		is_homepage: false
	});

	const form = await superValidate(zod4(registerSchema));

	return {
		pageMetaTags,
		form
	};
};
export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, zod4(registerSchema));

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
			const response = await locals.authServer.register(form.data);
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

			return {
				form,
				success: true,
				message: response.message || 'Registration successful',
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
