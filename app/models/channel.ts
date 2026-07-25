import { ChannelSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import encryption from '@adonisjs/core/services/encryption'
import Tenant from '#models/tenant'
import Division from '#models/division'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import AiAgent from '#models/ai_agent'

export default class Channel extends compose(ChannelSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Division)
  declare division: BelongsTo<typeof Division>

  @belongsTo(() => AiAgent)
  declare aiAgent: BelongsTo<typeof AiAgent>

  @hasMany(() => Contact)
  declare contacts: HasMany<typeof Contact>

  @hasMany(() => Conversation)
  declare conversations: HasMany<typeof Conversation>

  get isWaha() {
    return this.type === 'whatsapp_waha'
  }

  /** Read a provider credential, decrypting it. Returns null if absent/invalid. */
  getCredential(key: string): string | null {
    const raw = (this.credentials as Record<string, string> | null)?.[key]
    if (!raw) return null
    try {
      return encryption.decrypt<string>(raw)
    } catch {
      return null
    }
  }

  /** Store a provider credential encrypted at rest. */
  setCredential(key: string, value: string) {
    this.credentials = {
      ...((this.credentials as Record<string, string>) ?? {}),
      [key]: encryption.encrypt(value),
    }
  }
}
