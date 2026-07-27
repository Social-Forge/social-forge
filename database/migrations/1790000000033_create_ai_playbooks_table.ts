import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_playbooks'

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
      // Keywords/phrases in the customer message that trigger this playbook.
      table.jsonb('keywords').notNullable().defaultTo('[]')
      // What the agent should do / say when triggered (scope, tone, offer, etc).
      table.text('instruction').notNullable()
      // Asset ids to send to the customer when this playbook fires.
      table.jsonb('asset_ids').notNullable().defaultTo('[]')
      // Higher priority wins when multiple playbooks match.
      table.integer('priority').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)

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
