import { NODE_ENV } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { redirect, type Cookies } from '@sveltejs/kit';

export const createSessionHelper = (event: RequestEvent): SessionHelper => {
	const setAuthCookies = (
		tokens: {
			accessToken: string;
			refreshToken: string;
		} | null,
		expiresAccIn: number,
		expiresRefreshIn: number
	) => {
		const isProduction = NODE_ENV === 'production';
		if (!tokens) {
			event.cookies.delete('access_token', { path: '/' });
			event.cookies.delete('refresh_token', { path: '/' });
			return;
		}
		event.cookies.set('access_token', tokens.accessToken, {
			path: '/',
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: expiresAccIn,
			expires: new Date(Date.now() + expiresAccIn * 1000)
		});

		event.cookies.set('refresh_token', tokens.refreshToken, {
			path: '/',
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: expiresRefreshIn,
			expires: new Date(Date.now() + expiresRefreshIn * 1000)
		});
	};
	const validateCSRF = (): boolean => {
		const cookieToken = event.cookies.get('csrf_token') || event.cookies.get('XSRF-TOKEN');
		const headerToken =
			event.request.headers.get('X-XSRF-TOKEN') || event.request.headers.get('X-Xsrf-Token');
		return !!cookieToken && cookieToken === headerToken;
	};
	const setSecurityHeaders = () => {
		event.request.headers.set('Cache-Control', 'no-store, max-age=0');
		event.request.headers.set('CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300');
	};
	const clearAuthCookies = () => {
		event.cookies.delete('access_token', { path: '/' });
		event.cookies.delete('refresh_token', { path: '/' });
		event.cookies.delete('twofa_session_id', { path: '/' });
	};
	const isAuthenticated = async (): Promise<boolean> => {
		const accessToken = getAccessToken();
		const refreshToken = getRefreshToken();

		if (accessToken && !isTokenExpired(accessToken)) {
			return true;
		}
		if (refreshToken && !isTokenExpired(refreshToken)) {
			return true;
		}
		return false;
	};
	const handleUnauthorized = (redirectTo = '/auth/sign-in') => {
		clearAuthCookies();
		return redirect(302, `/auth/sign-in?from=${encodeURIComponent(redirectTo)}`);
	};
	const getAccessToken = (): string | undefined => {
		return event.cookies.get('access_token');
	};
	const getRefreshToken = (): string | undefined => {
		return event.cookies.get('refresh_token');
	};
	const getTwoSessionToken = (): string | undefined => {
		const twoFaSession =
			event.request.headers.get('X-2FA-Session') || event.cookies.get('twofa_session_id');
		return twoFaSession;
	};
	const isTokenExpired = (token: string): boolean => {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const exp = payload.exp * 1000;
			const now = Date.now();
			const buffer = 5 * 60 * 1000;
			return now >= exp - buffer;
		} catch {
			return true;
		}
	};
	return {
		setAuthCookies,
		validateCSRF,
		setSecurityHeaders,
		clearAuthCookies,
		isAuthenticated,
		handleUnauthorized,
		getAccessToken,
		getRefreshToken,
		getTwoSessionToken,
		isTokenExpired
	};
};
