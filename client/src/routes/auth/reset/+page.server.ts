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
		title: 'Forgot Password',
		is_homepage: false
	});

	const initialValue = {
		current_password: '',
		new_password: '',
		confirm_password: '',
		token
	} as ResetPasswordSchema;

	const form = await superValidate(initialValue, zod4(resetPasswordSchema));

	return {
		pageMetaTags,
		form
	};
};
