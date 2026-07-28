import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

type Row = Record<string, any>

/** Target for a "good" first response, in minutes (SLA compliance basis). */
const SLA_TARGET_MINUTES = 15

function since(days: number): Date {
  return DateTime.now()
    .minus({ days: days - 1 })
    .startOf('day')
    .toJSDate()
}

/** Build a zero-filled `yyyy-MM-dd` skeleton for the last N days. */
function daySkeleton(days: number): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    out.push(DateTime.now().minus({ days: i }).toFormat('yyyy-MM-dd'))
  }
  return out
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

/** Run a raw Postgres query and return its rows. */
async function rows(sql: string, bindings: unknown[]): Promise<Row[]> {
  const result = await db.rawQuery(sql, bindings)
  return result.rows as Row[]
}

/**
 * Tenant-scoped reporting aggregates computed from the operational tables
 * (messages, conversations, contacts, ai_credit_ledger). Postgres-specific
 * (`FILTER`, `date_trunc`). All methods take an explicit tenantId so they never
 * leak across tenants regardless of the request scope.
 */
export default class AnalyticsService {
  static async overview(tenantId: string, days: number) {
    const start = since(days)

    const totalsRows = await rows(
      `select
         count(*) filter (where direction = 'in') as messages_in,
         count(*) filter (where direction = 'out') as messages_out,
         count(*) filter (where sender_type = 'ai') as ai_messages,
         count(distinct conversation_id) as active_conversations
       from messages
       where tenant_id = ? and created_at >= ?`,
      [tenantId, start]
    )
    const totals = totalsRows[0] ?? {}

    const contactRows = await rows(
      `select
         count(*) as total,
         count(*) filter (where created_at >= ?) as new_in_period
       from contacts where tenant_id = ?`,
      [start, tenantId]
    )
    const contacts = contactRows[0] ?? {}

    const convRows = await rows(
      `select
         count(*) as total,
         count(*) filter (where status not in ('completed', 'archived')) as active
       from conversations where tenant_id = ?`,
      [tenantId]
    )
    const convs = convRows[0] ?? {}

    const frt = await this.#firstResponse(tenantId, start)

    const seriesRows = await rows(
      `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d,
         count(*) filter (where direction = 'in') as inbound,
         count(*) filter (where direction = 'out') as outbound
       from messages
       where tenant_id = ? and created_at >= ?
       group by d order by d`,
      [tenantId, start]
    )
    const byDay = new Map(seriesRows.map((r) => [r.d, r]))
    const daily = daySkeleton(days).map((date) => ({
      date,
      inbound: num(byDay.get(date)?.inbound),
      outbound: num(byDay.get(date)?.outbound),
    }))

    return {
      messagesIn: num(totals.messages_in),
      messagesOut: num(totals.messages_out),
      aiMessages: num(totals.ai_messages),
      activeConversations: num(convs.active),
      totalConversations: num(convs.total),
      conversationsInPeriod: num(totals.active_conversations),
      totalContacts: num(contacts.total),
      newContacts: num(contacts.new_in_period),
      avgFirstResponseMinutes: frt.avgMinutes,
      daily,
    }
  }

  static async agents(tenantId: string, days: number) {
    const start = since(days)
    const agentRows = await rows(
      `select u.id, u.full_name, u.last_login_at,
         count(m.id) filter (where m.sender_type = 'agent' and m.created_at >= ?) as messages_sent,
         (select count(*) from conversations c
            where c.tenant_id = u.tenant_id and c.assigned_agent_id = u.id) as conversations_assigned
       from users u
       left join messages m on m.sender_id = u.id and m.tenant_id = u.tenant_id
       where u.tenant_id = ?
       group by u.id, u.full_name, u.last_login_at
       order by messages_sent desc`,
      [start, tenantId]
    )

    return {
      agents: agentRows.map((r) => ({
        id: r.id,
        name: r.full_name,
        messagesSent: num(r.messages_sent),
        conversationsAssigned: num(r.conversations_assigned),
        lastActiveAt: r.last_login_at,
      })),
    }
  }

  static async ai(tenantId: string, days: number) {
    const start = since(days)

    const totalsRows = await rows(
      `select
         count(*) filter (where delta < 0) as reply_count,
         coalesce(-sum(delta) filter (where delta < 0), 0) as credits_used,
         coalesce(sum(cost_usd::numeric) filter (where delta < 0), 0) as cost_usd
       from ai_credit_ledger
       where tenant_id = ? and created_at >= ?`,
      [tenantId, start]
    )
    const totals = totalsRows[0] ?? {}

    const seriesRows = await rows(
      `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d,
         count(*) filter (where delta < 0) as replies,
         coalesce(-sum(delta) filter (where delta < 0), 0) as credits
       from ai_credit_ledger
       where tenant_id = ? and created_at >= ?
       group by d order by d`,
      [tenantId, start]
    )
    const byDay = new Map(seriesRows.map((r) => [r.d, r]))
    const daily = daySkeleton(days).map((date) => ({
      date,
      replies: num(byDay.get(date)?.replies),
      credits: num(byDay.get(date)?.credits),
    }))

    const modelRows = await rows(
      `select model, count(*) filter (where delta < 0) as replies,
         coalesce(-sum(delta) filter (where delta < 0), 0) as credits
       from ai_credit_ledger
       where tenant_id = ? and created_at >= ? and model is not null
       group by model order by credits desc`,
      [tenantId, start]
    )

    return {
      replyCount: num(totals.reply_count),
      creditsUsed: num(totals.credits_used),
      costUsd: num(totals.cost_usd),
      daily,
      byModel: modelRows.map((r) => ({
        model: r.model,
        replies: num(r.replies),
        credits: num(r.credits),
      })),
    }
  }

  static async sla(tenantId: string, days: number) {
    const start = since(days)
    const frt = await this.#firstResponse(tenantId, start)
    const compliant = frt.responded.filter((m) => m <= SLA_TARGET_MINUTES).length
    const total = frt.responded.length
    return {
      targetMinutes: SLA_TARGET_MINUTES,
      avgFirstResponseMinutes: frt.avgMinutes,
      respondedConversations: total,
      compliantConversations: compliant,
      compliancePct: total ? Math.round((compliant / total) * 100) : 0,
      // CSAT requires a post-conversation rating survey, which is not collected
      // yet. Surfaced honestly so the UI can label it "not available".
      csat: { available: false, score: null as number | null, responses: 0 },
    }
  }

  static async contacts(tenantId: string, days: number) {
    const start = since(days)

    const totalRows = await rows(
      `select
         count(*) as total,
         count(*) filter (where is_blocked) as blocked,
         count(*) filter (where created_at >= ?) as new_in_period
       from contacts where tenant_id = ?`,
      [start, tenantId]
    )
    const totals = totalRows[0] ?? {}

    const channelRows = await rows(
      `select ch.id, ch.name, ch.type, count(co.id) as contacts
       from channels ch
       left join contacts co on co.channel_id = ch.id
       where ch.tenant_id = ?
       group by ch.id, ch.name, ch.type
       order by contacts desc`,
      [tenantId]
    )

    const seriesRows = await rows(
      `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as d, count(*) as added
       from contacts where tenant_id = ? and created_at >= ?
       group by d order by d`,
      [tenantId, start]
    )
    const byDay = new Map(seriesRows.map((r) => [r.d, r]))
    const daily = daySkeleton(days).map((date) => ({
      date,
      added: num(byDay.get(date)?.added),
    }))

    return {
      total: num(totals.total),
      blocked: num(totals.blocked),
      newContacts: num(totals.new_in_period),
      byChannel: channelRows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        contacts: num(r.contacts),
      })),
      daily,
    }
  }

  /**
   * Per-conversation first-response latency (minutes) for conversations that
   * received an inbound message in the window: min(outbound) − min(inbound),
   * where an outbound reply exists after the first inbound.
   */
  static async #firstResponse(tenantId: string, start: Date) {
    const convRows = await rows(
      `select conversation_id,
         min(created_at) filter (where direction = 'in') as first_in,
         min(created_at) filter (where direction = 'out') as first_out
       from messages
       where tenant_id = ? and created_at >= ?
       group by conversation_id`,
      [tenantId, start]
    )

    const responded: number[] = []
    for (const r of convRows) {
      if (!r.first_in || !r.first_out) continue
      const minutes = (new Date(r.first_out).getTime() - new Date(r.first_in).getTime()) / 60000
      if (minutes >= 0) responded.push(minutes)
    }
    const avgMinutes = responded.length
      ? Math.round((responded.reduce((a, b) => a + b, 0) / responded.length) * 10) / 10
      : null
    return { responded, avgMinutes }
  }
}
