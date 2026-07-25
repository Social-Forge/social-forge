import { AiKnowledgeSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import AiAgent from '#models/ai_agent'

// Lucid would pluralize to `ai_knowledges`; the table is `ai_knowledge`.
export default class AiKnowledge extends compose(AiKnowledgeSchema, TenantScoped) {
  static table = 'ai_knowledge'

  // node-pg formats a raw JS array as a Postgres array literal, which a jsonb
  // column rejects. Serialize the embedding vector to/from a JSON string.
  @column({
    prepare: (value: number[] | null) => (value === null ? null : JSON.stringify(value)),
    consume: (value: unknown) =>
      typeof value === 'string' ? (JSON.parse(value) as number[]) : (value as number[] | null),
  })
  declare embedding: number[] | null

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => AiAgent)
  declare agent: BelongsTo<typeof AiAgent>

  get vector(): number[] | null {
    return this.embedding ?? null
  }
}
