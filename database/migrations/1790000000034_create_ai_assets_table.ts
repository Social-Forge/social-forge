import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_assets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table
        .uuid('ai_agent_id')
        .notNullable()
        .references('id')
        .inTable('ai_agents')
        .onDelete('CASCADE')

      table.string('name').notNullable()
      // image | video | document
      table.string('type').notNullable().defaultTo('image')
      // MinIO object key — a fresh presigned URL is minted at send time.
      table.string('storage_key').notNullable()
      table.string('mime_type').nullable()
      table.integer('size').nullable()
      table.string('description').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id'])
      table.index(['ai_agent_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
