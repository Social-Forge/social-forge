import { MessageOutboxSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Message from '#models/message'

/**
 * Not `TenantScoped`: the outbound dispatcher worker processes rows across all
 * tenants, so scoping is applied explicitly when needed instead.
 */
export default class MessageOutbox extends MessageOutboxSchema {
  // The table is singular (`message_outbox`); override Lucid's plural inference.
  static table = 'message_outbox'

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>
}
