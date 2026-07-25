import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Audit trail for conversation lifecycle: assignment changes, completion,
 * archiving, labeling, rejected calls, etc.
 */
export default class extends BaseSchema {
  protected tableName = 'conversation_events'

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
      table.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      // assigned | unassigned | completed | reopened | archived | unarchived |
      // labeled | note | call_rejected | auto_response
      table.string('type').notNullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['conversation_id', 'created_at'])
      table.index(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
