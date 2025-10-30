import { redirect } from '@sveltejs/kit';

export const allowedWhenAuthenticated = ['/auth/sign-out', '/auth/profile', '/auth/tenant-switch'];
export const authRoutes = [
	'/auth/sign-in',
	'/auth/sign-up',
	'/auth/verify-email',
	'/auth/reset',
	'/auth/verify-two-factor',
	'/auth/forgot',
	'/auth/confirm'
];
export const handleAuthRoute = async (handler: RequestHandlerParams) => {
	const { event, resolve, isAuthenticated, method, pathname } = handler;

	if (isAuthenticated) {
		const isAuthPage =
			authRoutes.some((route) => pathname.startsWith(route)) &&
			!allowedWhenAuthenticated.some((route) => pathname.startsWith(route));

		if (isAuthPage) {
			const redirectTo = event.url.searchParams.get('redirect') || '/app/chats';
			throw redirect(302, redirectTo);
		}
	}

	if (method !== 'GET' && method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	return resolve(event);
};
