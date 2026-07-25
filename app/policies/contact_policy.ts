import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import type Contact from '#models/contact'
import { ROLES } from '#models/role'

/**
 * Contacts are viewable by any agent, edited/blocked/exported by Supervisors+,
 * and deleted only by the Owner (destructive — cascades conversations). Super
 * admins bypass; all checks confined to the actor's tenant.
 */
export default class ContactPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.agent.level)
  }

  view(user: User, contact: Contact): AuthorizerResponse {
    return user.tenantId === contact.tenantId && user.atLeast(ROLES.agent.level)
  }

  update(user: User, contact: Contact): AuthorizerResponse {
    return user.tenantId === contact.tenantId && user.atLeast(ROLES.supervisor.level)
  }

  delete(user: User, contact: Contact): AuthorizerResponse {
    return user.tenantId === contact.tenantId && user.atLeast(ROLES.owner.level)
  }
}
