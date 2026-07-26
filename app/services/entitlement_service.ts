import { DateTime } from 'luxon'
import Channel from '#models/channel'
import Plan, { type PlanFeatures } from '#models/plan'
import SubscriptionAddon from '#models/subscription_addon'
import type Tenant from '#models/tenant'
import type { ChannelType } from '#services/messaging/constants'

/**
 * Entitlement engine. The plan catalog in Postgres (`plans.features`) is the
 * source of truth; the hardcoded maps below are a fallback for environments
 * where the catalog isn't seeded (unit tests) and keep the sync `channelLimit`
 * helper working. Real enforcement (`channelLimitFor` / `assertCanCreateChannel`)
 * reads the tenant's plan features and adds any purchased `channel_slot` add-ons.
 */
type ChannelLimits = Record<ChannelType, number>

const PLAN_CHANNEL_LIMITS: Record<string, ChannelLimits> = {
  free: {
    whatsapp_waha: 0,
    whatsapp_meta: 0,
    messenger: 1,
    instagram: 1,
    telegram: 1,
    webchat: 1,
  },
  pro: {
    whatsapp_waha: 1,
    whatsapp_meta: 1,
    messenger: 10,
    instagram: 10,
    telegram: 10,
    webchat: 5,
  },
}

/** Opening AI credit balance granted per plan on tenant provisioning. */
const PLAN_AI_CREDITS: Record<string, number> = {
  free: 200,
  pro: 10000,
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
  /** Static fallback catalog lookup (sync). */
  static channelLimit(plan: string, type: ChannelType): number {
    return PLAN_CHANNEL_LIMITS[plan]?.[type] ?? 0
  }

  /** Opening AI credit balance for a plan (granted at tenant provisioning). */
  static planAiCredits(plan: string): number {
    return PLAN_AI_CREDITS[plan] ?? 0
  }

  /** Resolve a tenant's plan features from the catalog, falling back to the map. */
  static async featuresFor(tenant: Tenant): Promise<PlanFeatures> {
    const plan = await Plan.findBy('code', tenant.plan)
    if (plan) return plan.featuresConfig
    return {
      channels: PLAN_CHANNEL_LIMITS[tenant.plan],
      aiCredits: PLAN_AI_CREDITS[tenant.plan] ?? 0,
    }
  }

  /** Extra channel slots of a given type bought as add-ons (non-expired). */
  static async addonSlots(tenant: Tenant, type: ChannelType): Promise<number> {
    const addons = await SubscriptionAddon.query()
      .where('tenant_id', tenant.id)
      .where('type', 'channel_slot')
    return addons.reduce((sum, addon) => {
      const meta = (addon.meta as { channelType?: string } | null) ?? {}
      const active = !addon.expiresAt || addon.expiresAt > DateTime.now()
      return meta.channelType === type && active ? sum + addon.quantity : sum
    }, 0)
  }

  /** Effective channel limit for a tenant: plan feature + add-on slots. */
  static async channelLimitFor(tenant: Tenant, type: ChannelType): Promise<number> {
    const features = await this.featuresFor(tenant)
    const base = features.channels?.[type] ?? this.channelLimit(tenant.plan, type)
    const addons = await this.addonSlots(tenant, type)
    return base + addons
  }

  /** Throws ChannelLimitReachedException when the tenant is at its limit. */
  static async assertCanCreateChannel(tenant: Tenant, type: ChannelType): Promise<void> {
    const limit = await this.channelLimitFor(tenant, type)
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
