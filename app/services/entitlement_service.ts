import Channel from '#models/channel'
import type Tenant from '#models/tenant'
import type { ChannelType } from '#services/messaging/constants'

/**
 * Minimal entitlement engine for Phase 2 — enforces per-plan channel limits.
 * The full metered billing model (add-ons, AI credits, materialized usage)
 * arrives in Phase 7; this keeps the shape stable so callers don't change.
 */
type ChannelLimits = Record<ChannelType, number>

const PLAN_CHANNEL_LIMITS: Record<string, ChannelLimits> = {
  free: {
    whatsapp_waha: 0,
    whatsapp_meta: 0,
    messenger: 1,
    instagram: 1,
    telegram: 1,
  },
  pro: {
    whatsapp_waha: 1,
    whatsapp_meta: 1,
    messenger: 10,
    instagram: 10,
    telegram: 10,
  },
}

export class ChannelLimitReachedException extends Error {
  constructor(type: ChannelType, limit: number) {
    super(
      `Channel limit reached for "${type}" on your plan (max ${limit}). Upgrade or buy an add-on.`
    )
    this.name = 'ChannelLimitReachedException'
  }
}

export default class EntitlementService {
  static channelLimit(plan: string, type: ChannelType): number {
    return PLAN_CHANNEL_LIMITS[plan]?.[type] ?? 0
  }

  /** Throws ChannelLimitReachedException when the tenant is at its limit. */
  static async assertCanCreateChannel(tenant: Tenant, type: ChannelType): Promise<void> {
    const limit = this.channelLimit(tenant.plan, type)
    const used = await Channel.query()
      .where('tenant_id', tenant.id)
      .where('type', type)
      .count('* as total')
    const total = Number((used[0] as any).$extras.total)
    if (total >= limit) {
      throw new ChannelLimitReachedException(type, limit)
    }
  }
}
