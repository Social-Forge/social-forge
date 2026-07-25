import { RoleSchema } from '#database/schema'

/**
 * Canonical roles + their hierarchy level. Higher level = more authority.
 * Used by Bouncer policies for `atLeast(level)` comparisons and seeded into
 * the `roles` table. Kept in sync with `@socialforge/shared` role slugs.
 */
export const ROLES = {
  superAdmin: { name: 'super_admin', level: 100 },
  owner: { name: 'owner', level: 80 },
  supervisor: { name: 'supervisor', level: 50 },
  agent: { name: 'agent', level: 20 },
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]['name']

export const ROLE_LEVELS = {
  super_admin: 100,
  owner: 80,
  supervisor: 50,
  agent: 20,
} as const satisfies Record<RoleName, number>

export default class Role extends RoleSchema {}
