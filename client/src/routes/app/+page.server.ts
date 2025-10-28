import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
	throw redirect(302, '/app/home');
};
