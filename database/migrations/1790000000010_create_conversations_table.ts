import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table
        .uuid('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .uuid('contact_id')
        .notNullable()
        .references('id')
        .inTable('contacts')
        .onDelete('CASCADE')
      table
        .uuid('assigned_agent_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // open | unassigned | completed | archived
      table.string('status').notNullable().defaultTo('unassigned')
      table.boolean('is_pinned').notNullable().defaultTo(false)
      table.integer('unread_count').notNullable().defaultTo(0)
      table.timestamp('last_message_at').nullable()
      // Meta 24-hour customer service window (null for channels without one).
      table.timestamp('service_window_expires_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      // A single active conversation per contact per channel.
      table.unique(['channel_id', 'contact_id'])
      table.index(['tenant_id'])
      table.index(['tenant_id', 'status'])
      table.index(['assigned_agent_id'])
      table.index(['last_message_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
