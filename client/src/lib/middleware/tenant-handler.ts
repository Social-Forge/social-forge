import { redirect, error } from '@sveltejs/kit';

export const restrictedTenantOwnerRoutes = [
	'/app/settings',
	'/app/divisions',
	'/app/agents',
	'/app/channels',
	'/app/analytics'
];

export const handleTenantRoute = async (handler: RequestHandlerParams) => {
	const { event, resolve, isAuthenticated, hasTenant, method, pathname } = handler;

	if (!isAuthenticated) {
		throw redirect(302, `/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
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
		throw redirect(302, '/auth/sign-up');
	}

	if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
		const isRestricted = restrictedTenantOwnerRoutes.some((route) => pathname.startsWith(route));

		if (isRestricted && userRole.level !== 3) {
			throw error(403, {
				message: 'You do not have permission to access this action',
				code: 'FORBIDDEN'
			});
		}
	}

	return resolve(event);
};
