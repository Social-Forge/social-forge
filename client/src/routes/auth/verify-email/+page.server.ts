import { defaultMetaTags } from '@/utils/meta-tags.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
	const email = url.searchParams.get('email');
	if (!email) {
		throw redirect(302, '/auth/sign-in');
	}
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: 'Verify Email',
		is_homepage: false
	});

	return {
		pageMetaTags,
		email
	};
};
