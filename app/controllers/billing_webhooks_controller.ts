import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Invoice from '#models/invoice'
import PaymentEvent from '#models/payment_event'
import TenantContext from '#services/tenant_context'
import BillingService from '#services/billing/billing_service'
import { paymentGateway } from '#services/billing/gateway'
import centrifugo from '#services/realtime/centrifugo_service'

/**
 * Public payment-gateway webhook (CSRF-exempt). Verifies authenticity, dedups
 * redeliveries, applies the paid invoice's entitlements, and broadcasts the
 * status to the invoice's realtime channel.
 */
export default class BillingWebhooksController {
  async xendit({ request, response }: HttpContext) {
    const gateway = paymentGateway()

    if (!gateway.verifyWebhook(request.headers() as Record<string, string | undefined>)) {
      return response.unauthorized({ message: 'Invalid webhook signature.' })
    }

    const event = gateway.parseWebhook(request.body())
    if (!event) return response.ok({ ignored: true })

    // Invoice loaded unscoped (worker/public context); mixin is a no-op here.
    const invoice = await Invoice.findBy('number', event.externalId)
    if (!invoice) {
      logger.warn({ externalId: event.externalId }, 'xendit webhook for unknown invoice')
      return response.ok({ ignored: true })
    }

    await TenantContext.run(invoice.tenantId, async () => {
      // Dedup redeliveries by provider event id.
      if (event.eventId) {
        const seen = await PaymentEvent.findBy('external_id', event.eventId)
        if (seen) return
      }

      await PaymentEvent.create({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        provider: gateway.id,
        eventType: event.status,
        externalId: event.eventId ?? null,
        payload: request.body(),
      })

      if (event.status === 'paid') {
        await BillingService.activateInvoice(invoice)
      } else if (event.status === 'expired' || event.status === 'failed') {
        invoice.status = event.status
        await invoice.save()
      }

      await centrifugo.publish(centrifugo.billingInvoiceChannel(invoice.tenantId, invoice.id), {
        type: 'invoice.status',
        invoiceId: invoice.id,
        status: invoice.status,
      })
    })

    return response.ok({ received: true })
  }
}
