import { InvoiceSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'

/** What paying an invoice grants. */
export type InvoicePurpose =
  | { type: 'subscription'; planCode: string }
  | { type: 'addon'; addon: 'channel_slot'; channelType: string; quantity: number }
  | { type: 'addon'; addon: 'ai_credits'; quantity: number }

export default class Invoice extends compose(InvoiceSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  get purposeConfig(): InvoicePurpose | null {
    return (this.purpose as InvoicePurpose | null) ?? null
  }
}
