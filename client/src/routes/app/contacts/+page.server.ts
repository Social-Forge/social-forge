import { defaultMetaTags } from '@/utils/meta-tags.js';

export const load = async ({ url, locals }) => {
	const defaultOrigin = new URL(url.pathname, url.origin).href;
	const pageMetaTags = defaultMetaTags({
		path_url: defaultOrigin,
		canonical: defaultOrigin,
		graph_type: 'website',
		title: `App Contacts`,
		robots: 'noindex, follow',
		is_homepage: false
	});

	return {
		pageMetaTags,
		user: locals.userTenant
	};
};
