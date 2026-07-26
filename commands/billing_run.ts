import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Billing housekeeping — run on a schedule (cron):
 *  - Expire subscriptions past their period end and downgrade the tenant to free.
 *  - Expire pending invoices past their validity window.
 *
 *   node ace billing:run
 */
export default class BillingRun extends BaseCommand {
  static commandName = 'billing:run'
  static description = 'Expire lapsed subscriptions/invoices and downgrade tenants'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { DateTime } = await import('luxon')
    const { default: Subscription } = await import('#models/subscription')
    const { default: Invoice } = await import('#models/invoice')
    const { default: Tenant } = await import('#models/tenant')
    const { default: TenantContext } = await import('#services/tenant_context')

    const now = DateTime.now()

    await TenantContext.runBypassed(async () => {
      // Lapsed subscriptions → expire + downgrade to free.
      const lapsed = await Subscription.query()
        .whereIn('status', ['active', 'trialing'])
        .whereNotNull('current_period_end')
        .where('current_period_end', '<', now.toSQL()!)

      for (const subscription of lapsed) {
        subscription.status = 'expired'
        await subscription.save()
        const tenant = await Tenant.find(subscription.tenantId)
        if (tenant && tenant.plan !== 'free') {
          tenant.plan = 'free'
          await tenant.save()
        }
      }
      this.logger.info(`expired ${lapsed.length} subscriptions`)

      // Stale pending invoices → expired.
      const stale = await Invoice.query()
        .where('status', 'pending')
        .whereNotNull('expires_at')
        .where('expires_at', '<', now.toSQL()!)
      for (const invoice of stale) {
        invoice.status = 'expired'
        await invoice.save()
      }
      this.logger.info(`expired ${stale.length} pending invoices`)
    })

    this.logger.success('billing run complete')
  }
}
