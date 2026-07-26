import { PaymentEventSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import Invoice from '#models/invoice'

/** Append-only audit of provider webhook deliveries. */
export default class PaymentEvent extends compose(PaymentEventSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>
}
