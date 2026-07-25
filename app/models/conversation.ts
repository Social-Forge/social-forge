import { ConversationSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import Contact from '#models/contact'
import User from '#models/user'
import Message from '#models/message'
import Label from '#models/label'

export default class Conversation extends compose(ConversationSchema, TenantScoped) {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => Contact)
  declare contact: BelongsTo<typeof Contact>

  @belongsTo(() => User, { foreignKey: 'assignedAgentId' })
  declare assignedAgent: BelongsTo<typeof User>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @manyToMany(() => Label, {
    pivotTable: 'conversation_labels',
    pivotForeignKey: 'conversation_id',
    pivotRelatedForeignKey: 'label_id',
  })
  declare labels: ManyToMany<typeof Label>
}
