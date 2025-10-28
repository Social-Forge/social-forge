import { defaultMetaTags } from '@/utils/meta-tags.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
	const token = url.searchParams.get('token');
	const type = url.searchParams.get('type');
	// if (!token || !type) {
	// 	throw redirect(302, '/auth/sign-in');
	// }
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: `${type == 'email' ? 'Validate Email' : 'Validate Reset Password'}`,
		is_homepage: false
	});

	return {
		pageMetaTags,
		token,
		type
	};
};
