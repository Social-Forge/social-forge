import { PlanSchema } from '#database/schema'
import type { ChannelType } from '#services/messaging/constants'

/** Entitlements encoded in a plan's `features` jsonb. */
export type PlanFeatures = {
  channels?: Partial<Record<ChannelType, number>>
  agents?: number
  aiCredits?: number
  aiAgents?: number
  quickReplies?: number
}

/** Global plan catalog (not tenant-scoped). */
export default class Plan extends PlanSchema {
  get featuresConfig(): PlanFeatures {
    return (this.features as PlanFeatures | null) ?? {}
  }
}
