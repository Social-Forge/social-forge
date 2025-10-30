import { PUBLIC_API_URL } from '$env/static/public';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

export class ApiHandler {
	private event: RequestEvent;
	private baseUrl: string;

	constructor(event: RequestEvent) {
		this.event = event;
		this.baseUrl = PUBLIC_API_URL;
	}
	private getSecureHeaders(): Headers {
		const headers = new Headers();
		const url = new URL(this.event.request.url);

		const clientHost =
			this.event.request.headers.get('host') ||
			this.event.request.headers.get('x-forwarded-host') ||
			this.event.request.headers.get('x-real-host') ||
			url.host;

		const clientProto =
			this.event.request.headers.get('x-forwarded-proto') ||
			this.event.request.headers.get('x-forwarded-protocol') ||
			(url.protocol ? url.protocol.replace(':', '') : 'https');

		const clientOrigin = `${clientProto.startsWith('http') ? '' : clientProto + '://'}${clientHost}`;

		headers.set('Host', clientHost || '');
		headers.set('X-Forwarded-Host', clientHost || '');
		headers.set('X-Forwarded-Proto', clientProto || '');
		headers.set(
			'X-Forwarded-For',
			this.event.request.headers.get('x-forwarded-for') ||
				this.event.request.headers.get('x-real-ip') ||
				''
		);

		headers.set('X-Real-IP', this.event.request.headers.get('x-real-ip') || '');
		headers.set('Origin', clientOrigin);
		headers.set('Referer', this.event.request.headers.get('referer') || url.href);
		headers.set('X-Requested-With', 'XMLHttpRequest');
		headers.set('User-Agent', this.event.request.headers.get('user-agent') || '');

		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('X-Frame-Options', 'DENY');
		headers.set('X-XSS-Protection', '1; mode=block');

		if (!headers.get('Origin')) {
			console.warn('[ApiHandler] Origin header missing, using fallback:', url.origin);
			headers.set('Origin', url.origin);
		}
		return headers;
	}
	private async getCsrfToken(headers: Headers): Promise<string | null> {
		try {
			const cookieString = this.getCookieString();
			if (cookieString) {
				headers.set('Cookie', cookieString);
			}
			headers.set('X-Platform', 'browser');
			const response = await this.event.fetch(`${this.baseUrl}/token/csrf`, {
				method: 'GET',
				headers,
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data: ApiResponse<{ csrf_token: string }> = await response.json();
			return data.data?.csrf_token ?? null;
		} catch (err) {
			console.error('❌ Failed to get CSRF token', err);
			return null;
		}
	}
	private getCookieString(): string {
		const cookies: string[] = [];

		for (const [key, value] of Object.entries(this.event.cookies.getAll())) {
			cookies.push(`${key}=${value}`);
		}

		return cookies.join('; ');
	}
	private async createApiRequest<T>(
		method: HttpMethod,
		path: string,
		options: {
			data?: any;
			auth?: boolean;
			csrfProtected?: boolean;
			headers?: Record<string, string>;
		}
	): Promise<ApiResponse<T>> {
		const headers = this.getSecureHeaders();
		headers.set('X-Platform', 'browser');

		if (!(options.data instanceof FormData)) {
			headers.set('Content-Type', 'application/json');
		}

		if (options.headers) {
			for (const [key, value] of Object.entries(options.headers)) {
				headers.set(key, value);
			}
		}

		if (options.auth) {
			const accessToken = this.event.cookies.get('access_token');
			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`);
			}
		}

		if (options.csrfProtected && method !== 'GET') {
			const csrf = await this.getCsrfToken(new Headers(headers));
			if (csrf) {
				headers.set('X-XSRF-TOKEN', csrf);
			}
		}

		const cookieString = this.getCookieString();
		if (cookieString) {
			headers.set('Cookie', cookieString);
		}

		let requestBody: any;
		if (method !== 'GET' && options.data) {
			requestBody = options.data instanceof FormData ? options.data : JSON.stringify(options.data);
		}

		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers,
				body: requestBody,
				credentials: 'include'
			});

			const responseData: ApiResponse<T> = await response.json().catch(() => ({
				status: response.status,
				success: false,
				message: 'Invalid JSON response'
			}));

			return {
				status: responseData.status || response.status,
				success: responseData.success ?? response.ok,
				message: responseData.message || (response.ok ? 'Request successful' : 'Request failed'),
				data: responseData.data,
				meta: responseData.meta,
				error: responseData.error
			};
		} catch (error: any) {
			console.error('❌ API Request failed:', error);
			return {
				status: 500,
				success: false,
				message: error.message || 'API request failed',
				error: {
					code: 'NETWORK_ERROR',
					details: process.env.NODE_ENV === 'development' ? error.stack : undefined
				}
			};
		}
	}
	private async createMultipartApiRequest<T>(
		method: HttpMethod,
		path: string,
		options: {
			data?: FormData;
			auth?: boolean;
			csrfProtected?: boolean;
			headers?: Record<string, string>;
		}
	): Promise<ApiResponse<T>> {
		const headers = this.getSecureHeaders();
		headers.set('X-Platform', 'browser');

		if (options.headers) {
			for (const [key, value] of Object.entries(options.headers)) {
				headers.set(key, value);
			}
		}

		if (options.auth) {
			const accessToken = this.event.cookies.get('access_token');
			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`);
			}
		}

		if (options.csrfProtected && method !== 'GET') {
			const csrf = await this.getCsrfToken(new Headers(headers));
			if (csrf) {
				headers.set('X-XSRF-TOKEN', csrf);
			}
		}

		const cookieString = this.getCookieString();
		if (cookieString) {
			headers.set('Cookie', cookieString);
		}

		let requestBody: FormData = new FormData();
		if (method !== 'GET' && options.data) {
			requestBody = options.data;
		}

		try {
			const response = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers,
				body: requestBody,
				credentials: 'include'
			});

			const responseData: ApiResponse<T> = await response.json().catch(() => ({
				status: response.status,
				success: false,
				message: 'Invalid JSON response'
			}));

			return {
				status: responseData.status || response.status,
				success: responseData.success ?? response.ok,
				message: responseData.message || (response.ok ? 'Request successful' : 'Request failed'),
				data: responseData.data,
				meta: responseData.meta,
				error: responseData.error
			};
		} catch (error: any) {
			console.error('❌ Multipart API Request failed:', error);
			return {
				status: 500,
				success: false,
				message: error.message || 'API request failed',
				error: {
					code: 'NETWORK_ERROR',
					details: process.env.NODE_ENV === 'development' ? error.stack : undefined
				}
			};
		}
	}
	public async authRequest<T>(
		method: HttpMethod,
		path: string,
		data?: any,
		headers?: Record<string, string>
	): Promise<ApiResponse<T>> {
		return this.createApiRequest<T>(method, path, {
			data,
			auth: true,
			csrfProtected: true,
			headers
		});
	}
	public async publicRequest<T>(
		method: HttpMethod,
		path: string,
		data?: any,
		headers?: Record<string, string>
	): Promise<ApiResponse<T>> {
		return this.createApiRequest<T>(method, path, {
			data,
			auth: false,
			csrfProtected: false,
			headers
		});
	}
	public async multipartAuthRequest<T>(
		method: HttpMethod,
		path: string,
		data?: FormData,
		headers?: Record<string, string>
	): Promise<ApiResponse<T>> {
		return this.createMultipartApiRequest<T>(method, path, {
			data,
			auth: true,
			csrfProtected: true,
			headers
		});
	}
}
export function createApiHandler(event: RequestEvent) {
	return new ApiHandler(event);
}
