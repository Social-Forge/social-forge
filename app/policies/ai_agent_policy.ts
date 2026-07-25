import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import type AiAgent from '#models/ai_agent'
import { ROLES } from '#models/role'

/**
 * AI agents (and the credit balance they spend) are configured by the tenant
 * Owner. Supervisors and above may view them. Super admins bypass. All checks
 * are confined to the actor's tenant.
 */
export default class AiAgentPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }

  view(user: User, agent: AiAgent): AuthorizerResponse {
    return user.tenantId === agent.tenantId && user.atLeast(ROLES.supervisor.level)
  }

  create(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.owner.level)
  }

  update(user: User, agent: AiAgent): AuthorizerResponse {
    return user.tenantId === agent.tenantId && user.atLeast(ROLES.owner.level)
  }

  delete(user: User, agent: AiAgent): AuthorizerResponse {
    return user.tenantId === agent.tenantId && user.atLeast(ROLES.owner.level)
  }
}
