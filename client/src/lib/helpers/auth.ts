import { NODE_ENV } from '$env/static/private';
import { redirect, type Cookies } from '@sveltejs/kit';

export const getTwoSessionToken = (headers: Headers, cookies: Cookies, isMobile = false) => {
	if (isMobile) {
		const twoFaSession = headers.get('X-2FA-Session');
		return { twoFaSession };
	} else {
		return {
			twoFaSession: cookies.get('twofa_session_id')
		};
	}
};
export const createSessionHelper = (): SessionHelper => {
	const setAuthCookies = (
		cookies: Cookies,
		tokens: {
			accessToken: string;
			refreshToken: string;
		} | null
	) => {
		const isProduction = NODE_ENV === 'production';
		if (!tokens) {
			cookies.delete('access_token', { path: '/' });
			cookies.delete('refresh_token', { path: '/' });
			return;
		}
		cookies.set('access_token', tokens.accessToken, {
			path: '/',
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 1 day
		});

		cookies.set('refresh_token', tokens.refreshToken, {
			path: '/',
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 hari
		});
	};
	const validateCSRF = (headers: Headers, cookies: Cookies): boolean => {
		const cookieToken = cookies.get('csrf_token') || cookies.get('XSRF-TOKEN');
		const headerToken = headers.get('X-XSRF-TOKEN') || headers.get('X-Xsrf-Token');
		return !!cookieToken && cookieToken === headerToken;
	};
	const setSecurityHeaders = (headers: Headers) => {
		headers.set('Cache-Control', 'no-store, max-age=0');
		headers.set('CDN-Cache-Control', 'max-age=60, stale-while-revalidate=300');
	};
	const clearAuthCookies = (cookies: Cookies) => {
		cookies.delete('access_token', { path: '/' });
		cookies.delete('refresh_token', { path: '/' });
		cookies.delete('twofa_session_id', { path: '/' });
	};
	const handleUnauthorized = (cookies: Cookies, redirectTo = '/auth/sign-in') => {
		clearAuthCookies(cookies);
		return redirect(302, `/auth/sign-in?from=${encodeURIComponent(redirectTo)}`);
	};
	const getTwoSessionToken = (headers: Headers, cookies: Cookies): string | undefined => {
		const twoFaSession = headers.get('X-2FA-Session') || cookies.get('twofa_session_id');
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
