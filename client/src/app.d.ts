import type { RequestEvent, ResolveOptions, MaybePromise } from '@sveltejs/kit';
import { ApiHandler, createAuthHelper, createUserHelper, createTenantHelper } from '@/server';
import { createSessionHelper } from '@/helpers';

declare global {
	namespace App {
		interface Error {
			code?: string;
		}
		interface Locals {
			apiHandler: ApiHandler;
			authServer: ReturnType<typeof createAuthHelper>;
			userServer: ReturnType<typeof createUserHelper>;
			sessionHelper: ReturnType<typeof createSessionHelper>;
			tenantServer: ReturnType<typeof createTenantHelper>;
			safeGetUser: () => Promise<UserTenantWithDetails | null | undefined>;
			userTenant?: UserTenantWithDetails | null;
		}
		interface PageData {
			userTenant?: UserTenantWithDetails | null;
			success?: boolean;
			errors?: {
				code: string;
				message: string;
				details?: any;
			};
			messages?: string;
		}
		interface PageState {
			userTenant?: UserTenantWithDetails | null;
		}
		// interface Platform {}
	}
	interface RequestHandlerParams {
		event: RequestEvent;
		resolve: (event: RequestEvent) => MaybePromise<Response>;
		isAuthenticated: boolean;
		hasTenant: boolean;
		method: string;
		pathname: string;
	}
	interface RouteConfig {
		public?: boolean;
		roles?: ('superadmin' | 'admin' | 'tenant_owner' | 'supervisor' | 'agent')[];
		roleLevel?: (1 | 2 | 3 | 4 | 5)[];
		resources?: (
			| 'users'
			| 'tenants'
			| 'divisions'
			| 'agents'
			| 'conversations'
			| 'messages'
			| 'contacts'
			| 'quick_replies'
			| 'auto_replies'
			| 'pages'
			| 'channels'
			| 'analytics'
			| 'settings'
		)[];
		actions?: ('create' | 'read' | 'update' | 'delete' | 'manage' | 'assign' | 'export')[];
		methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
		tenantRequired?: boolean;
	}
	interface RouteRules {
		[key: string]: RouteConfig;
	}
}
export {};
