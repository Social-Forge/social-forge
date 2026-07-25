import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contacts'

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

      // Provider-side identity: phone (wa), PSID (messenger), IG id, chat id (tg).
      table.string('external_id').notNullable()
      table.string('display_name').nullable()
      table.text('avatar_url').nullable()
      table.boolean('is_blocked').notNullable().defaultTo(false)
      table.jsonb('attributes').notNullable().defaultTo('{}')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      // One identity per channel (D5: contacts are separate per channel).
      table.unique(['channel_id', 'external_id'])
      table.index(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
