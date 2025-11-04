import type {
	RegisterSchema,
	LoginSchema,
	ForgotSchema,
	ResetPasswordSchema,
	VerifyTwoFactorSchema,
	UpdateProfileSchema,
	UpdatePasswordSchema,
	ActivatedTwoFactorSchema
} from '@/utils';

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
		page: number;
		limit: number;
		total_rows: number;
		total_pages: number;
		has_prev: boolean;
		has_next: boolean;
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

	interface QueryParams {
		page: number;
		limit: number;
		search?: string;
		sort_by?: string;
		order_by?: 'asc' | 'desc';
		status?: string;
		include_deleted?: boolean;
		is_active?: boolean;
		is_verified?: boolean;
		tenant_id?: string;
		user_id?: string;
		division_id?: string;
		extra?: Record<string, any>;
	}
	interface QueryState {
		params: QueryParams;
		meta: ApiMeta | null;
		isLoading: boolean;
	}
	const DEFAULT_PAGINATION: QueryParams = {
		page: 1,
		limit: 10,
		order_by: 'desc'
	};

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
		verifyTwoFactor: (value: VerifyTwoFactorSchema) => Promise<ApiResponse<LoginResponse>>;
		refreshToken: (refreshToken: string) => Promise<ApiResponse<LoginResponse>>;
	}
	interface ServerUser {
		currentUser: () => Promise<User | null | undefined>;
		logout: () => Promise<ApiResponse>;
		uploadAvatar: (file: File) => Promise<ApiResponse>;
		updateProfile: (value: UpdateProfileSchema) => Promise<ApiResponse<User>>;
		changePassword: (value: UpdatePasswordSchema) => Promise<ApiResponse>;
		enableTwoFactor: (status: string) => Promise<
			ApiResponse<{
				qr_code?: string;
				secret?: string;
			}>
		>;
		verifyTwoFactor: (value: ActivatedTwoFactorSchema) => Promise<ApiResponse>;
	}
	interface TenantServer {
		uploadLogo: (file: File) => Promise<ApiResponse<{ logo_url: string }>>;
		updateInfo: (value: UpdateTenantSchema) => Promise<ApiResponse<Tenant>>;
	}
	interface SessionHelper {
		setAuthCookies: (
			tokens: {
				accessToken: string;
				refreshToken: string;
			} | null,
			expiresAccIn: number,
			expiresRefreshIn: number
		) => void;
		validateCSRF: () => boolean;
		setSecurityHeaders: () => void;
		clearAuthCookies: () => void;
		isAuthenticated: () => Promise<boolean>;
		handleUnauthorized: (redirectTo?: string) => never;
		getAccessToken: () => string | undefined;
		getRefreshToken: () => string | undefined;
		isTokenExpired: (token: string) => boolean;
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
		phone?: string | null;
		avatar_url?: string | null;
		two_fa_secret?: string | null;
		is_active: boolean;
		is_verified: boolean;
		email_verified_at?: string | null;
		last_login_at?: string | null;
		updated_at: string;
		created_at: string;
		user_tenant: UserTenant | null;
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
		subdomain?: string | null;
		logo_url?: string | null;
		description?: string | null;
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
		trial_ends_at?: string | null;
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
	type AgentAssignment = {
		id: string;
		user_id: string;
		tenant_id: string;
		division_id: string;
		status: 'available' | 'busy' | 'offline';
		assigned_count: number;
		resolved_count: number;
		avg_response_time?: number | null;
		is_active: boolean;
		percentage?: number | null;
		weight?: number | null;
		priority?: number | null;
		meta_data?: AssignMetaData | null;
		created_at: string;
		updated_at: string;
	};
	type AutoReply = {
		id: string;
		tenant_id: string;
		division_id: string;
		trigger_type: 'first_message' | 'keyword' | 'outside_hours';
		trigger_value?: string | null;
		message: string;
		media_type?:
			| 'text'
			| 'image'
			| 'video'
			| 'audio'
			| 'file'
			| 'link'
			| 'location'
			| 'contact'
			| 'button'
			| 'quick_reply'
			| 'template'
			| 'document'
			| null;
		media_url?: string | null;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type ChannelIntegration = {
		id: string;
		tenant_id: string;
		division_id: string;
		channel_id: string;
		name: string;
		type:
			| 'whatsapp'
			| 'meta_whatsapp'
			| 'meta_messenger'
			| 'instagram'
			| 'telegram'
			| 'webchat'
			| 'linkchat';
		identifier?: string | null;
		access_token?: string | null;
		refresh_token?: string | null;
		webhook_url?: string | null;
		webhook_secret?: string | null;
		config?: Record<string, any> | null;
		is_active: boolean;
		is_verified: boolean;
		verified_at?: string | null;
		last_sync_at?: string | null;
		created_at: string;
		updated_at: string;
	};
	type Channel = {
		id: string;
		name: string;
		slug: string;
		icon_url?: string | null;
		description?: string | null;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type Conversation = {
		id: string;
		tenant_id: string;
		division_id: string;
		contact_id: string;
		assigned_agent_id?: string | null;
		channel_integration_id: string;
		status: 'open' | 'closed' | 'assigned' | 'resolved';
		priority: 'low' | 'normal' | 'high' | 'urgent';
		label_ids?: string[] | null;
		tags?: string[] | null;
		first_message_at?: string | null;
		last_message_at?: string | null;
		assigned_at?: string | null;
		resolved_at?: string | null;
		closed_at?: string | null;
		archived_at?: string | null;
		message_count: number;
		agent_response_time?: number | null;
		metadata?: Record<string, any> | null;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type Label = {
		id: string;
		tenant_id: string;
		agent_owner_id: string;
		name: string;
		slug: string;
		description?: string | null;
		color: string;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type MessageRead = {
		id: string;
		message_id: string;
		user_id: string;
		read_at: string;
		created_at: string;
		updated_at: string;
	};
	type Message = {
		id: string;
		conversation_id: string;
		tenant_id: string;
		sender_id?: string | null;
		message_type: 'contact' | 'agent' | 'system' | 'bot';
		message_type:
			| 'text'
			| 'image'
			| 'video'
			| 'audio'
			| 'file'
			| 'link'
			| 'location'
			| 'contact'
			| 'button'
			| 'quick_reply'
			| 'template'
			| 'document'
			| 'reaction'
			| 'sticker'
			| 'interactive';
		content?: string | null;
		media_url?: string | null;
		media_type?: string | null;
		media_size?: number | null;
		thumbnail_url?: string | null;
		channel_message_id?: string | null;
		reply_to_id?: string | null;
		status: MessageStatus;
		sent_at?: string | null;
		delivered_at?: string | null;
		read_at?: string | null;
		failed_at?: string | null;
		error_message?: string | null;
		metadata?: Record<string, any> | null;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type QuickReply = {
		id: string;
		tenant_id: string;
		created_by_id: string;
		title: string;
		shortcut: string;
		content: string;
		media_type?:
			| 'text'
			| 'image'
			| 'video'
			| 'audio'
			| 'file'
			| 'link'
			| 'location'
			| 'contact'
			| 'button'
			| 'quick_reply'
			| 'template'
			| 'document'
			| null;
		media_url?: string | null;
		is_shared: boolean;
		usage_count: number;
		last_used_at?: string | null;
		meta_data?: Record<string, any> | null;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	type WebhookLog = {
		id: string;
		tenant_id: string;
		channel_integration_id?: string | null;
		event_type: string;
		event_id: string;
		url: string;
		method: 'POST' | 'GET' | 'PUT' | 'DELETE';
		payload: Record<string, any> | null;
		headers?: Record<string, string> | null;
		response_status: 'pending' | 'success' | 'failed' | 'processing' | 'unknown';
		response_body?: Record<string, any> | null;
		processed_at?: string | null;
		error_message?: string | null;
		retry_count: number;
		created_at: string;
		updated_at: string;
	};
	type WorkingHours = {
		id: string;
		tenant_id: string;
		division_id: string;
		day_of_week: number;
		start_time: string;
		end_time: string;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	};
	// Api Response
	type LoginResponse = {
		access_token?: string;
		refresh_token?: string;
		two_fa_token?: string;
		token_type?: string;
		expires_in?: number;
		expires_refresh_in?: number;
		status: 'require_email_verification' | 'two_fa_required' | 'accepted';
		user: UserResponse | null;
	};
}

export {};
