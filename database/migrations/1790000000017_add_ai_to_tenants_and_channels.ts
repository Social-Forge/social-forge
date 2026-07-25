import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Wires the AI layer into existing domains:
 *  - tenants.ai_credits: running credit balance (source of truth for spend
 *    checks; the ai_credit_ledger is the audit trail).
 *  - channels.ai_agent_id: the AI agent that auto-replies on this channel
 *    (nullable = no bot).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('tenants', (table) => {
      table.integer('ai_credits').notNullable().defaultTo(0)
    })
    this.schema.alterTable('channels', (table) => {
      table
        .uuid('ai_agent_id')
        .nullable()
        .references('id')
        .inTable('ai_agents')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('channels', (table) => {
      table.dropColumn('ai_agent_id')
    })
    this.schema.alterTable('tenants', (table) => {
      table.dropColumn('ai_credits')
    })
  }
}
