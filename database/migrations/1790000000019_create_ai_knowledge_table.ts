import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_knowledge'

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

      table.string('title').notNullable()
      table.text('content').notNullable()
      // Embedding vector stored as a JSON float array (cosine done app-side —
      // avoids a pgvector dependency at this scale). Null until embedded.
      table.jsonb('embedding').nullable()
      table.integer('token_count').notNullable().defaultTo(0)

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
