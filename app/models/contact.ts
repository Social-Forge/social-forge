import { ContactSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import Conversation from '#models/conversation'

export default class Contact extends compose(ContactSchema, TenantScoped) {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => Conversation)
  declare conversations: HasMany<typeof Conversation>
}
