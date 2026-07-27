import { AiAssetSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import AiAgent from '#models/ai_agent'

export type AiAssetType = 'image' | 'video' | 'document'

/** A media asset (product photo, testimonial, video) the agent can send. */
export default class AiAsset extends compose(AiAssetSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => AiAgent)
  declare agent: BelongsTo<typeof AiAgent>
}
