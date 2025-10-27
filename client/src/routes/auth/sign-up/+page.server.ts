import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { registerSchema } from '@/utils/form-schema.js';
import { fail } from '@sveltejs/kit';
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
