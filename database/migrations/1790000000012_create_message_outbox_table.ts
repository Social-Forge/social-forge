import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Transactional outbox for reliable outbound delivery. A row is written in the
 * same transaction as the outbound message; the dispatcher worker consumes it,
 * and a sweeper can re-publish rows still `pending` if the broker publish failed.
 */
export default class extends BaseSchema {
  protected tableName = 'message_outbox'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table
        .uuid('message_id')
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')

      // pending | processing | sent | failed
      table.string('status').notNullable().defaultTo('pending')
      table.integer('attempts').notNullable().defaultTo(0)
      table.integer('max_attempts').notNullable().defaultTo(5)
      table.timestamp('next_retry_at').nullable()
      table.text('last_error').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['status', 'next_retry_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
