import { NODE_ENV } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { redirect, type Cookies } from '@sveltejs/kit';

export const createSessionHelper = (event: RequestEvent): SessionHelper => {
	const setAuthCookies = (
		tokens: {
			accessToken: string;
			refreshToken: string;
		} | null
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
			maxAge: 60 * 60 * 24 // 1 day
		});

		event.cookies.set('refresh_token', tokens.refreshToken, {
			path: '/',
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 hari
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
	const handleUnauthorized = (redirectTo = '/auth/sign-in') => {
		clearAuthCookies();
		return redirect(302, `/auth/sign-in?from=${encodeURIComponent(redirectTo)}`);
	};
	const getTwoSessionToken = (): string | undefined => {
		const twoFaSession =
			event.request.headers.get('X-2FA-Session') || event.cookies.get('twofa_session_id');
		return twoFaSession;
	};
	return {
		setAuthCookies,
		validateCSRF,
		setSecurityHeaders,
		clearAuthCookies,
		handleUnauthorized,
		getTwoSessionToken
	};
};
