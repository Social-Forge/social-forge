import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import type Channel from '#models/channel'
import { ROLES } from '#models/role'

/**
 * Channels are added/edited/removed by the tenant Owner (brief: "Owner Only").
 * Supervisors (and above) may view + manage the live connection (connect/QR).
 * Super admins bypass. All checks confined to the actor's tenant.
 */
export default class ChannelPolicy extends BasePolicy {
  before(user: User | null) {
    if (user?.isSuperAdmin) return true
  }

  viewAny(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.supervisor.level)
  }

  view(user: User, channel: Channel): AuthorizerResponse {
    return user.tenantId === channel.tenantId && user.atLeast(ROLES.supervisor.level)
  }

  create(user: User): AuthorizerResponse {
    return user.atLeast(ROLES.owner.level)
  }

  update(user: User, channel: Channel): AuthorizerResponse {
    return user.tenantId === channel.tenantId && user.atLeast(ROLES.owner.level)
  }

  delete(user: User, channel: Channel): AuthorizerResponse {
    return user.tenantId === channel.tenantId && user.atLeast(ROLES.owner.level)
  }

  /** Connect / QR / disconnect — Supervisor may operate the session. */
  manageSession(user: User, channel: Channel): AuthorizerResponse {
    return user.tenantId === channel.tenantId && user.atLeast(ROLES.supervisor.level)
  }
}
