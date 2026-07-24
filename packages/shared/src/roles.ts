/**
 * Platform + tenant roles. See ARCHITECTURE.md §6 (Multi-Tenancy & RBAC).
 */
export const PLATFORM_ROLES = ['super_admin'] as const
export const TENANT_ROLES = ['owner', 'supervisor', 'agent'] as const

export type PlatformRole = (typeof PLATFORM_ROLES)[number]
export type TenantRole = (typeof TENANT_ROLES)[number]
export type Role = PlatformRole | TenantRole

/** Conversation lifecycle status shown as badges in the chat sidebar. */
export const CONVERSATION_STATUSES = ['open', 'unassigned', 'completed', 'archived'] as const
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number]

/** Auto-assign strategies (see ARCHITECTURE.md §7 auto_assign_rules). */
export const ASSIGN_STRATEGIES = ['round_robin', 'percentage', 'least_busy'] as const
export type AssignStrategy = (typeof ASSIGN_STRATEGIES)[number]
