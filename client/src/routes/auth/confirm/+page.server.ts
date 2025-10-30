import { defaultMetaTags } from '@/utils/meta-tags.js';
import { redirect } from '@sveltejs/kit';

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
		title: 'Validate Account',
		is_homepage: false
	});

	return {
		pageMetaTags,
		token
	};
};
