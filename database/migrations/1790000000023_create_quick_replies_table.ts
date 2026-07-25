import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quick_replies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')

      // The "/shortcut" typed in the composer to expand this reply.
      table.string('shortcut').notNullable()
      // text | image | video | document
      table.string('content_type').notNullable().defaultTo('text')
      table.text('body').nullable()
      // { url, mimeType, filename } for media quick replies.
      table.jsonb('media').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.unique(['tenant_id', 'shortcut'])
      table.index(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
