import { defaultMetaTags } from '@/utils/meta-tags.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { updateProfileSchema, type UpdateProfileSchema } from '@/utils/form-schema.js';
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
	const initialValue: UpdateProfileSchema = {
		full_name: user?.full_name || '',
		email: user?.email || '',
		username: user?.username || '',
		phone: user?.phone || ''
	};
	const form = await superValidate(initialValue, zod4(updateProfileSchema));

	return {
		pageMetaTags,
		userTenant,
		form
	};
};
