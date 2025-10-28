import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { createApiHandler, createAuthHelper, createUserHelper } from '@/server';
import { handleAdminRoute, handleTenantRoute, handleAuthRoute } from '@/middleware';
import { createSessionHelper } from '@/helpers';

const initServer: Handle = async ({ event, resolve }) => {
	event.locals.apiHandler = createApiHandler(event);
	event.locals.authServer = createAuthHelper(event);
	event.locals.userServer = createUserHelper(event);
	event.locals.sessionHelper = createSessionHelper(event);
	event.locals.safeGetUser = async () => {
		try {
			const user = await event.locals.userServer.currentUser();
			if (!user) {
				return {
					user: null,
					tenant: null,
					user_tenant: null,
					role: null,
					role_permissions: null,
					metadata: null
				};
			}
			return {
				user,
				tenant: user.tenant,
				user_tenant: user.user_tenants,
				role: user.role,
				role_permissions: user.role_permissions,
				metadata: user.metadata
			} as UserTenantWithDetails;
		} catch (error) {
			console.error('Error fetching user:', error);
			return {
				user: null,
				tenant: null,
				user_tenant: null,
				role: null,
				role_permissions: null,
				metadata: null
			};
		}
	};
	const response = await resolve(event);

	if (response.status === 404) {
		throw redirect(303, '/');
	}
	if (response.status === 403) {
		throw redirect(307, '/');
	}
	return response;
};
const auth: Handle = async ({ event, resolve }) => {
	const user = await event.locals.safeGetUser();

	event.locals.userTenant = user;
	const isAuthenticated = user?.user !== null;
	const hasTenant = user?.tenant !== null && user?.user_tenant !== null;

	const { url, request } = event;
	const pathname = url.pathname;
	const method = request.method;

	const isApiRoute = pathname.startsWith('/api');
	const isTenantRoute = pathname.startsWith('/app');
	const isAdminRoute = pathname.startsWith('/app/admin');
	const isAuthRoute = pathname.startsWith('/auth');

	try {
		if (isAuthRoute) {
			return await handleAuthRoute({
				event,
				resolve,
				isAuthenticated,
				hasTenant,
				method,
				pathname
			});
		}
		if (isAdminRoute) {
			return await handleAdminRoute({
				event,
				resolve,
				isAuthenticated,
				hasTenant,
				method,
				pathname
			});
		}
		if (isTenantRoute) {
			return await handleTenantRoute({
				event,
				resolve,
				isAuthenticated,
				hasTenant,
				method,
				pathname
			});
		}
	} catch (error) {}

	return resolve(event);
};
export const handle: Handle = sequence(initServer, auth);
