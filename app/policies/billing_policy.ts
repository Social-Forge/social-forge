import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import { ROLES } from '#models/role'

/**
 * Billing is visible to Supervisors+ but only the Owner can purchase / change
 * the subscription. Super admins bypass; tenant isolation via TenantScoped.
 */
export default class BillingPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  view(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }

  manage(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.owner.level)
  }
}
