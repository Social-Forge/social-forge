import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversation_labels'

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
      table.uuid('label_id').notNullable().references('id').inTable('labels').onDelete('CASCADE')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.unique(['conversation_id', 'label_id'])
      table.index(['tenant_id'])
      table.index(['label_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
