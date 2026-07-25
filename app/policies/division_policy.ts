import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import type Division from '#models/division'
import { ROLES } from '#models/role'

/**
 * Divisions are managed by the tenant Owner; Supervisors (and above) may view
 * them. Every check is confined to the actor's own tenant. Super admins bypass.
 */
export default class DivisionPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }

  view(user: User, division: Division): AuthorizerResponse {
    return user.tenantId === division.tenantId && user.atLeast(ROLES.supervisor.level)
  }

  create(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.owner.level)
  }

  update(user: User, division: Division): AuthorizerResponse {
    return user.tenantId === division.tenantId && user.atLeast(ROLES.owner.level)
  }

  delete(user: User, division: Division): AuthorizerResponse {
    return user.tenantId === division.tenantId && user.atLeast(ROLES.owner.level)
  }
}
