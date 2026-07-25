import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table
        .uuid('division_id')
        .nullable()
        .references('id')
        .inTable('divisions')
        .onDelete('SET NULL')

      // whatsapp_waha | whatsapp_meta | messenger | instagram | telegram
      table.string('type').notNullable()
      table.string('name').notNullable()
      // disconnected | connecting | connected | failed
      table.string('status').notNullable().defaultTo('disconnected')
      // Phone number / page id / bot username, resolved once connected.
      table.string('external_id').nullable()

      // WAHA-only: engine + session name (gows | noweb | webjs).
      table.string('waha_engine').nullable()
      table.string('waha_session_name').nullable().unique()

      // Secret used to verify inbound webhooks for this channel.
      table.string('webhook_secret').nullable()

      // Encrypted provider credentials (Meta/Telegram tokens) + free-form config.
      table.jsonb('credentials').notNullable().defaultTo('{}')
      table.jsonb('settings').notNullable().defaultTo('{}')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id'])
      table.index(['tenant_id', 'type'])
      table.index(['division_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
