import type { RegisterSchema, LoginSchema, ForgotSchema, ResetPasswordSchema } from '@/utils';

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
	// Helpers
	interface ServerAuth {
		register: (value: RegisterSchema) => Promise<ApiResponse>;
		login: (value: LoginSchema) => Promise<ApiResponse<LoginResponse>>;
		forgot: (value: ForgotSchema) => Promise<ApiResponse>;
		verifyEmail: (token: string) => Promise<ApiResponse>;
		resetPassword: (value: ResetPasswordSchema) => Promise<ApiResponse>;
	}
	interface ServerUser {
		currentUser: () => Promise<User | null | undefined>;
	}
	interface SessionHelper {
		setAuthCookies: (
			tokens: {
				accessToken: string;
				refreshToken: string;
			} | null
		) => void;
		validateCSRF: () => boolean;
		setSecurityHeaders: () => void;
		clearAuthCookies: () => void;
		handleUnauthorized: (redirectTo?: string) => never;
		getTwoSessionToken: () => string | undefined;
	}
	// Database

	type Role = {
		id: string;
		name: string;
		slug: string;
		description?: string;
		level: number;
		created_at: string;
		updated_at: string;
	};
	type Permission = {
		id: string;
		name: string;
		slug: string;
		resource: string;
		action: string;
		description?: string;
		created_at: string;
		updated_at: string;
	};
	type RolePermission = {
		id: string;
		role_id: string;
		permission_id: string;
		created_at: string;
		updated_at: string;
	};
	type RolePermissionWithDetails = RolePermission & {
		role_name: Role['name'];
		role_slug: Role['slug'];
		permission_name: Permission['name'];
		permission_slug: Permission['slug'];
		permission_resource: Permission['resource'];
		permission_action: Permission['action'];
	};
	type RolePermissionWithNested = {
		role_permission: RolePermission;
		role: Role;
		permission: Permission;
	};
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
		user_tenants: UserTenant | null;
		tenant: Tenant | null;
		role: Role | null;
		role_permissions: RolePermissionWithDetails[] | null;
		metadata: UserTenantMetadata | null;
	};
	type Tenant = {
		id: string;
		name: string;
		slug: string;
		owner_id: string;
		subdomain?: string;
		logo_url?: string;
		description?: string;
		max_divisions: number;
		max_agents: number;
		max_quick_replies: number;
		max_pages: number;
		max_whatsapp: number;
		max_meta_whatsapp: number;
		max_meta_messenger: number;
		max_instagram: number;
		max_telegram: number;
		max_webchat: number;
		max_linkchat: number;
		subscription_plan: 'free' | 'starter' | 'pro' | 'enterprise';
		subscription_status: 'active' | 'canceled' | 'suspended' | 'expired';
		trial_ends_at?: string;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type UserTenant = {
		id: string;
		user_id: string;
		tenant_id: string;
		role_id: string;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type UserTenantWithDetails = {
		user_tenant: UserTenant | null;
		user: User | null;
		tenant: Tenant | null;
		role: Role | null;
		role_permissions: RolePermissionWithDetails[] | null;
		metadata: UserTenantMetadata | null;
	};
	type UserTenantWithDetailsNested = {
		user_tenant: UserTenant | null;
		user: User | null;
		tenant: Tenant | null;
		role: Role | null;
		role_permissions: RolePermissionWithNested[] | null;
		metadata: UserTenantMetadata | null;
		tenant: Tenant;
		role: Role;
		role_permissions: RolePermissionWithDetails[];
		metadata: UserTenantMetadata;
	};
	type UserTenantWithDetailsNested = {
		user_tenant: UserTenant;
		user: User;
		tenant: Tenant;
		role: Role;
		role_permissions: RolePermissionWithNested[];
		metadata: UserTenantMetadata;
	};
	type UserTenantMetadata = {
		permission_count: number;
		user_status: string;
		last_updated: string;
	};
	type LoginResponse = {
		access_token?: string;
		refresh_token?: string;
		two_fa_token?: string;
		token_type?: string;
		expires_in?: number;
		status: 'require_email_verification' | 'two_fa_required' | 'accepted';
		user: UserResponse | null;
	};
}

export {};
