import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { createApiHandler, createAuthHelper, createUserHelper, createTenantHelper } from '@/server';
import {
	handleAdminRoute,
	handleTenantRoute,
	handleAuthRoute,
	authRoutes,
	restrictedSuperAdminRoutes,
	restrictedTenantOwnerRoutes
} from '@/middleware';
import { createSessionHelper } from '@/helpers';

const initServer: Handle = async ({ event, resolve }) => {
	event.locals.apiHandler = createApiHandler(event);
	event.locals.authServer = createAuthHelper(event);
	event.locals.userServer = createUserHelper(event);
	event.locals.sessionHelper = createSessionHelper(event);
	event.locals.tenantServer = createTenantHelper(event);
	event.locals.safeGetUser = async () => {
		try {
			const shouldRefresh = await handleAutoRefresh(event);
			if (shouldRefresh) {
				console.log('🔄 Token refreshed automatically');
			}

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
				user_tenant: user.user_tenant,
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
	const { url, request } = event;
	const pathname = url.pathname;
	const method = request.method;

	const isApiRoute = pathname.startsWith('/api');
	const isTenantRoute = restrictedTenantOwnerRoutes.some((route) => pathname.startsWith(route));
	const isAdminRoute = restrictedSuperAdminRoutes.some((route) => pathname.startsWith(route));
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	try {
		if (!isApiRoute) {
			await handleAutoRefresh(event);
		}

		const user = await event.locals.safeGetUser();
		event.locals.userTenant = user;

		const isAuthenticated = user?.user !== null;
		const hasTenant = user?.tenant !== null && user?.user_tenant !== null;

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
	} catch (error: any) {
		if (error?.status === 302 || error?.status === 301) {
			throw error;
		}
		console.error('Auth middleware error:', error);
	}

	return resolve(event);
};
export const handle: Handle = sequence(initServer, auth);

async function handleAutoRefresh(event: RequestEvent): Promise<boolean> {
	try {
		const accessToken = event.locals.sessionHelper.getAccessToken();
		const refreshToken = event.locals.sessionHelper.getRefreshToken();

		// Jika ada access token yang valid, tidak perlu refresh
		if (accessToken && !event.locals.sessionHelper.isTokenExpired(accessToken)) {
			return false;
		}

		// Jika ada refresh token yang masih valid, lakukan refresh
		if (refreshToken && !event.locals.sessionHelper.isTokenExpired(refreshToken)) {
			console.log('🔄 Attempting token refresh...');
			const refreshResult = await handleRefreshSession(event);

			if (refreshResult) {
				console.log('✅ Token refresh successful');
				return true;
			} else {
				console.log('❌ Token refresh failed');
				event.locals.sessionHelper.setAuthCookies(null, 0, 0);
				return false;
			}
		}

		return false;
	} catch (error) {
		console.error('Auto refresh error:', error);
		return false;
	}
}
async function handleRefreshSession(event: RequestEvent) {
	try {
		const refreshToken = event.locals.sessionHelper.getRefreshToken();

		if (!refreshToken) {
			return null;
		}

		const response = await event.locals.authServer.refreshToken(refreshToken);

		if (!response.success) {
			console.warn('Refresh token failed:', response.message);
			return null;
		}

		if (!response.data?.access_token || !response.data?.refresh_token) {
			console.warn('Refresh token response missing tokens');
			return null;
		}
		event.locals.sessionHelper.setAuthCookies(
			{
				accessToken: response.data?.access_token || '',
				refreshToken: response.data?.refresh_token || ''
			},
			response.data?.expires_in || 60 * 60 * 24, // 24 jam default
			response.data?.expires_refresh_in || 60 * 60 * 24 * 7 // 7 hari default
		);

		return response;
	} catch (error) {
		console.error('Refresh session error:', error);
		return null;
	}
}
