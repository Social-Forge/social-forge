import { redirect } from '@sveltejs/kit';

export const handleAuthRoute = async (handler: RequestHandlerParams) => {
	const { event, resolve, isAuthenticated, method, pathname } = handler;

	if (isAuthenticated) {
		const allowedWhenAuthenticated = ['/auth/sign-out', '/auth/profile', '/auth/tenant-switch'];

		const isAllowed = allowedWhenAuthenticated.some((route) => pathname.startsWith(route));

		if (!isAllowed) {
			const redirectTo = event.url.searchParams.get('redirect') || '/app/home';
			return redirect(302, redirectTo);
		}
	}

	// Method restrictions for auth routes
	if (method !== 'GET' && method !== 'POST') {
		// Only allow GET and POST methods for auth routes
		return new Response('Method not allowed', { status: 405 });
	}

	return resolve(event);
};
