import { MessageOutboxSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Message from '#models/message'

/**
 * Not `TenantScoped`: the outbound dispatcher worker processes rows across all
 * tenants, so scoping is applied explicitly when needed instead.
 */
export default class MessageOutbox extends MessageOutboxSchema {
  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>
}
