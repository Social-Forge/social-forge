import { PUBLIC_API_URL } from '$env/static/public';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

export class ApiHandler {
	private request: Request;
	private cookies: Cookies;
	private fetch: typeof fetch;
	private baseUrl: string;

	constructor(event: RequestEvent) {
		this.request = event.request;
		this.cookies = event.cookies;
		this.fetch = fetch;
		this.baseUrl = PUBLIC_API_URL;
	}
	private getSecureHeaders(): Headers {
		const headers = new Headers(this.request.headers);
		const url = new URL(this.request.url);

		const clientHost =
			this.request.headers.get('host') ||
			this.request.headers.get('x-forwarded-host') ||
			this.request.headers.get('x-real-host') ||
			url.host;

		const clientProto =
			this.request.headers.get('x-forwarded-proto') ||
			this.request.headers.get('x-forwarded-protocol') ||
			(url.protocol ? url.protocol.replace(':', '') : 'https');

		const clientOrigin = `${clientProto.startsWith('http') ? '' : clientProto + '://'}${clientHost}`;

		headers.set('Host', clientHost || '');
		headers.set('X-Forwarded-Host', clientHost || '');
		headers.set('X-Forwarded-Proto', clientProto || '');
		headers.set(
			'X-Forwarded-For',
			this.request.headers.get('x-forwarded-for') || this.request.headers.get('x-real-ip') || ''
		);

		headers.set('X-Real-IP', this.request.headers.get('x-real-ip') || '');
		headers.set('Origin', clientOrigin);
		headers.set('Referer', this.request.headers.get('referer') || url.href);
		headers.set('X-Requested-With', 'XMLHttpRequest');
		headers.set('User-Agent', this.request.headers.get('user-agent') || '');

		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('X-Frame-Options', 'DENY');
		headers.set('X-XSS-Protection', '1; mode=block');

		if (!headers.get('Origin')) {
			console.warn('[ApiHandler] Origin header missing, using fallback:', url.origin);
			headers.set('Origin', url.origin);
		}
		return headers;
	}
	private async getCsrfToken(): Promise<string | null> {
		try {
			const secureHeaders = this.getSecureHeaders();
			const response = await this.fetch(`${this.baseUrl}/token/csrf`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...secureHeaders,
					Cookie: Object.entries(this.cookies)
						.map(([key, value]) => `${key}=${value}`)
						.join('; ')
				},
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
	private async createApiRequest<T>(
		baseUrl: string,
		method: HttpMethod,
		path: string,
		options: {
			data?: any;
			auth?: boolean;
			csrfProtected?: boolean;
			headers?: HeadersInit;
		}
	): Promise<ApiResponse<T>> {
		const headers = this.getSecureHeaders();
		headers.set('Content-Type', 'application/json');
		Object.assign(headers, options.headers);

		// Handle FormData
		if (options.data instanceof FormData && headers.get('Content-Type')) {
			headers.delete('Content-Type');
		}

		// Add authentication
		const accessToken = this.cookies.get('access_token');
		if (options.auth && accessToken) {
			headers.set('Authorization', `Bearer ${accessToken}`);
		}

		// Add CSRF protection for non-GET requests
		if (options.csrfProtected && method !== 'GET') {
			const csrf = await this.getCsrfToken();
			if (csrf) headers.set('X-XSRF-TOKEN', csrf);
		}

		// Prepare request body
		let requestBody: any;
		if (method !== 'GET' && options.data) {
			requestBody = options.data instanceof FormData ? options.data : JSON.stringify(options.data);
		}

		// Prepare cookies for the request
		const cookieString = Object.entries(this.cookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');

		if (cookieString) {
			headers.set('Cookie', cookieString);
		}

		try {
			const response = await fetch(`${baseUrl}${path}`, {
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

			// Ensure consistent response structure
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
	private async createMultipartRequest<T>(
		baseUrl: string,
		method: HttpMethod,
		path: string,
		options: {
			data?: any;
			auth?: boolean;
			csrfProtected?: boolean;
			headers?: HeadersInit;
		}
	): Promise<ApiResponse<T>> {
		const headers = this.getSecureHeaders();
		Object.assign(headers, options.headers);

		// Remove Content-Type for FormData to let browser set it
		if (options.data instanceof FormData) {
			headers.delete('Content-Type');
		}

		// Add authentication
		const accessToken = this.cookies.get('access_token');
		if (options.auth && accessToken) {
			headers.set('Authorization', `Bearer ${accessToken}`);
		}

		// Add CSRF protection
		if (options.csrfProtected && method !== 'GET') {
			const csrf = await this.getCsrfToken();
			if (csrf) headers.set('X-XSRF-TOKEN', csrf);
		}

		// Prepare cookies
		const cookieString = Object.entries(this.cookies)
			.map(([key, value]) => `${key}=${value}`)
			.join('; ');

		if (cookieString) {
			headers.set('Cookie', cookieString);
		}

		try {
			const response = await fetch(`${baseUrl}${path}`, {
				method,
				headers,
				body: method !== 'GET' ? options.data : undefined,
				credentials: 'include'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw {
					status: response.status,
					message: errorData.message || 'Request failed',
					data: errorData
				};
			}

			const data: ApiResponse<T> = await response.json();
			return {
				status: data.status || response.status,
				success: data.success ?? true,
				message: data.message || 'Request successful',
				data: data.data,
				meta: data.meta
			};
		} catch (error: any) {
			const status = error.status || 500;
			const errorData = error.data || {};
			return {
				status,
				success: false,
				message: errorData.message || error.message || 'API request failed',
				error: {
					code: errorData.code || `HTTP_${status}`,
					details:
						errorData.error || (process.env.NODE_ENV === 'development' ? error.stack : undefined)
				},
				meta: error.meta
			};
		}
	}
	public async authRequest<T>(
		method: HttpMethod,
		path: string,
		data?: any,
		headers?: HeadersInit
	): Promise<ApiResponse<T>> {
		return this.createApiRequest<T>(this.baseUrl, method, path, {
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
		headers?: HeadersInit
	): Promise<ApiResponse<T>> {
		return this.createApiRequest<T>(this.baseUrl, method, path, {
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
		headers?: HeadersInit
	): Promise<ApiResponse<T>> {
		return this.createMultipartRequest<T>(this.baseUrl, method, path, {
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
