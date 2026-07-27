import { AiPlaybookSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import AiAgent from '#models/ai_agent'

/**
 * A training rule for a sales agent: when the customer message matches
 * `keywords`, the agent follows `instruction` (scope/tone/offer) and may send
 * the referenced `assetIds` (product images, testimonials, videos).
 */
export default class AiPlaybook extends compose(AiPlaybookSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => AiAgent)
  declare agent: BelongsTo<typeof AiAgent>

  get keywordList(): string[] {
    return (this.keywords as string[] | null) ?? []
  }

  get assetIdList(): string[] {
    return (this.assetIds as string[] | null) ?? []
  }
}
