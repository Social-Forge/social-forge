import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import { ROLES } from '#models/role'

/**
 * Managing team members (Supervisors + Agents) is an Owner-only capability,
 * confined to the actor's tenant. Supervisors may view the roster. Super admins
 * bypass. An Owner cannot delete their own account here.
 */
export default class TeamPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }

  create(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.owner.level)
  }

  update(user: User, target: User): AuthorizerResponse {
    return user.tenantId === target.tenantId && user.atLeast(ROLES.owner.level)
  }

  delete(user: User, target: User): AuthorizerResponse {
    return (
      user.id !== target.id && user.tenantId === target.tenantId && user.atLeast(ROLES.owner.level)
    )
  }
}
