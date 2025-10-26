declare global {
	interface Window {
		gtag: (...args: any[]) => void;
	}
	// APi Response
	interface ApiResponse<T = any, M extends Record<string, any> = ApiMeta> {
		status: number;
		success: boolean;
		message: string;
		data?: T | null;
		error?: ApiError;
		meta?: M;
		headers?: Headers;
	}
	interface ApiMeta {
		total: number;
		limit: number;
		offset: number;
		has_more: boolean;
	}
	interface ApiError {
		code: string;
		message?: string;
		redirect_url?: string;
		details?: any;
		retryable?: boolean;
		timestamp?: string;
	}
	interface ErrorResponse extends ApiResponse<undefined, undefined> {
		error: {
			code: string;
			details?: Record<string, unknown>;
			redirect_url?: Record<string, unknown>;
		};
	}
	type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

	interface CsrfTokenResponse extends ApiResponse<string> {
		data?: any;
	}
	// Database
	type User = {
		id: string;
		email: string;
		username: string;
		full_name: string;
		phone?: string;
		avatar_url?: string;
		two_fa_secret?: string;
		is_active: boolean;
		is_verified: boolean;
		email_verified_at?: string;
		last_login_at?: string;
		updated_at: string;
		created_at: string;
	};
	type Role = {
		id: string;
		name: string;
		description?: string;
		created_at: string;
		updated_at: string;
	};
}

export {};
