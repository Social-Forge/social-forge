import { redirect, error } from '@sveltejs/kit';

export const restrictedSuperAdminRoutes = [
	'/app/admin/settings',
	'/app/admin/tenants',
	'/app/admin/users',
	'/app/admin/divisions',
	'/app/admin/agents',
	'/app/admin/channels',
	'/app/admin/analytics'
];
export const handleAdminRoute = async (handler: RequestHandlerParams) => {
	const { event, resolve, isAuthenticated, hasTenant, method, pathname } = handler;

	if (!isAuthenticated) {
		throw redirect(302, `/auth/sign-in?redirect=${encodeURIComponent(pathname)}`);
	}

	// Check if user has admin access
	const userRole = event.locals.userTenant?.role;
	const allowedRoles = [1, 2];

	if (!userRole || !allowedRoles.includes(userRole.level)) {
		throw error(403, {
			message: 'You do not have permission to access this resource',
			code: 'FORBIDDEN'
		});
	}

	if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
		const isRestricted = restrictedSuperAdminRoutes.some((route) => pathname.startsWith(route));

		if (isRestricted && !allowedRoles.includes(userRole.level)) {
			throw error(403, {
				message: 'You do not have permission to access this action',
				code: 'FORBIDDEN'
			});
		}
	}

	return resolve(event);
};
