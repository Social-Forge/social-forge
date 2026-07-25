import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import { ROLES } from '#models/role'

/**
 * Shared authorization for tenant "catalog" resources (labels, quick replies):
 * any agent may read + apply them; Supervisors+ manage them. Tenant isolation
 * is enforced by the TenantScoped models, so these checks are role-only.
 */
export default class CatalogPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.agent.level)
  }

  manage(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }
}
