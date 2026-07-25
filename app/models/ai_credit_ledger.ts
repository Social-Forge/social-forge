import { AiCreditLedgerSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'

export type CreditReason = 'grant' | 'topup' | 'debit' | 'adjustment'

/** Append-only audit trail of AI credit movements (see AiCreditService). */
export default class AiCreditLedger extends compose(AiCreditLedgerSchema, TenantScoped) {
  // Lucid would pluralize to `ai_credit_ledgers`; the table is singular.
  static table = 'ai_credit_ledger'

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>
}
