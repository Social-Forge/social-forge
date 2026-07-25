import db from '@adonisjs/lucid/services/db'
import aiConfig, { AI_MODELS, CREDITS_PER_USD } from '#config/ai'
import Tenant from '#models/tenant'
import AiCreditLedger, { type CreditReason } from '#models/ai_credit_ledger'
import type { AiUsage } from '#services/ai/types'

export class InsufficientCreditsError extends Error {
  constructor(tenantId: string) {
    super(`Tenant "${tenantId}" has no AI credits remaining`)
    this.name = 'InsufficientCreditsError'
  }
}

type DebitInput = {
  tenantId: string
  model: string
  usage: AiUsage
  conversationId?: string | null
  messageId?: string | null
}

/**
 * Normalizes provider token usage into provider-agnostic "AI credits" and keeps
 * the tenant's running balance (`tenants.ai_credits`) in sync with an append-only
 * ledger. Credits are the real inference cost in USD × CREDITS_PER_USD, rounded
 * up — fair across models with very different token pricing.
 */
export default class AiCreditService {
  /** Provider spend in USD for a given model + token usage. */
  static costUsd(model: string, usage: AiUsage): number {
    const pricing = AI_MODELS[model] ?? AI_MODELS[aiConfig.defaultModel]
    return (
      (usage.inputTokens / 1_000_000) * pricing.inputPer1M +
      (usage.outputTokens / 1_000_000) * pricing.outputPer1M
    )
  }

  /** Whole AI credits for a usage — at least 1 whenever there was any spend. */
  static creditsFor(model: string, usage: AiUsage): number {
    const usd = this.costUsd(model, usage)
    if (usd <= 0) return 0
    // Subtract a tiny epsilon so floating-point noise (e.g. 0.03 * 1000 =
    // 30.000000000000004) doesn't over-charge by a whole credit.
    return Math.max(1, Math.ceil(usd * CREDITS_PER_USD - 1e-9))
  }

  /** Current credit balance for a tenant. */
  static async balance(tenantId: string): Promise<number> {
    const tenant = await Tenant.find(tenantId)
    return tenant?.aiCredits ?? 0
  }

  /** True when the tenant can afford at least one more reply. */
  static async hasCredits(tenantId: string): Promise<boolean> {
    return (await this.balance(tenantId)) > 0
  }

  /**
   * Atomically debit the metered credits for one AI reply: locks the tenant row,
   * decrements the balance, and writes a ledger entry — all in one transaction.
   * Returns the credits charged and the resulting balance.
   */
  static async debit(input: DebitInput): Promise<{ credits: number; balanceAfter: number }> {
    const credits = this.creditsFor(input.model, input.usage)
    const costUsd = this.costUsd(input.model, input.usage)

    return db.transaction(async (trx) => {
      const rows = await trx
        .from('tenants')
        .where('id', input.tenantId)
        .forUpdate()
        .select('ai_credits')
      const current = Number(rows[0]?.ai_credits ?? 0)
      const balanceAfter = current - credits

      await trx.from('tenants').where('id', input.tenantId).update({ ai_credits: balanceAfter })

      await AiCreditLedger.create(
        {
          tenantId: input.tenantId,
          delta: -credits,
          balanceAfter,
          reason: 'debit',
          model: input.model,
          inputTokens: input.usage.inputTokens,
          outputTokens: input.usage.outputTokens,
          costUsd: costUsd.toFixed(6),
          conversationId: input.conversationId ?? null,
          messageId: input.messageId ?? null,
        },
        { client: trx }
      )

      return { credits, balanceAfter }
    })
  }

  /** Grant or top-up credits (subscription bundle, add-on, manual adjustment). */
  static async grant(
    tenantId: string,
    amount: number,
    reason: CreditReason = 'grant'
  ): Promise<number> {
    return db.transaction(async (trx) => {
      const rows = await trx.from('tenants').where('id', tenantId).forUpdate().select('ai_credits')
      const current = Number(rows[0]?.ai_credits ?? 0)
      const balanceAfter = current + amount

      await trx.from('tenants').where('id', tenantId).update({ ai_credits: balanceAfter })

      await AiCreditLedger.create(
        { tenantId, delta: amount, balanceAfter, reason },
        { client: trx }
      )

      return balanceAfter
    })
  }
}
