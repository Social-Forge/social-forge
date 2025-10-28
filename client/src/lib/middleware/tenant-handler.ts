import { redirect, error } from '@sveltejs/kit';

export const handleTenantRoute = async (handler: RequestHandlerParams) => {
	const { event, resolve, isAuthenticated, hasTenant, method, pathname } = handler;

	if (!isAuthenticated) {
		return redirect(302, `/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
	}

	// Check if user has admin access
	const userRole = event.locals.userTenant?.role;

	if (!userRole || userRole.level !== 3) {
		throw error(403, {
			message: 'You do not have permission to access this resource',
			code: 'FORBIDDEN'
		});
	}

	if (!hasTenant) {
		return redirect(302, '/auth/sign-up');
	}

	if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
		const restrictedRoutes = [
			'/app/settings',
			'/app/divisions',
			'/app/agents',
			'/app/channels',
			'/app/analytics'
		];

		const isRestricted = restrictedRoutes.some((route) => pathname.startsWith(route));

		if (isRestricted && userRole.level !== 3) {
			throw error(403, {
				message: 'You do not have permission to access this action',
				code: 'FORBIDDEN'
			});
		}
	}

	return resolve(event);
};
