import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table
        .uuid('conversation_id')
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')

      // in | out
      table.string('direction').notNullable()
      // contact | agent | ai | system
      table.string('sender_type').notNullable()
      // Agent user id when sender_type = agent.
      table.uuid('sender_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      // text | image | video | audio | document | location | template | link | sticker | contact
      table.string('content_type').notNullable().defaultTo('text')
      table.text('body').nullable()
      // { url, mimeType, filename, size, storageKey, thumbnailKey, ... }
      table.jsonb('media').nullable()

      // Provider message id — used for idempotent dedup. NULLs allowed (multiple
      // pending outbound messages) and treated as distinct by Postgres.
      table.string('provider_message_id').nullable().unique()

      // pending | sent | delivered | read | failed
      table.string('status').notNullable().defaultTo('pending')
      table.uuid('reply_to_id').nullable().references('id').inTable('messages').onDelete('SET NULL')
      table.boolean('is_pinned').notNullable().defaultTo(false)
      table.text('error').nullable()
      table.timestamp('edited_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['conversation_id', 'created_at'])
      table.index(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
