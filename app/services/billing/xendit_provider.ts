import billingConfig from '#config/billing'
import logger from '@adonisjs/core/services/logger'
import type {
  CreateInvoiceInput,
  CreatedInvoice,
  NormalizedWebhook,
  NormalizedWebhookStatus,
  PaymentGateway,
} from '#services/billing/payment_gateway'

/** Map Xendit invoice statuses to our normalized set. */
const STATUS_MAP: Record<string, NormalizedWebhookStatus> = {
  PAID: 'paid',
  SETTLED: 'paid',
  EXPIRED: 'expired',
  PENDING: 'pending',
  FAILED: 'failed',
}

/**
 * Xendit gateway over the Invoices API (raw HTTP, Basic auth with the secret key
 * as username). Webhooks are authenticated with the `x-callback-token` header
 * matched against `XENDIT_WEBHOOK_TOKEN`.
 */
export default class XenditProvider implements PaymentGateway {
  readonly id = 'xendit'

  get configured(): boolean {
    return Boolean(billingConfig.xendit.secretKey)
  }

  #authHeader(): string {
    return `Basic ${Buffer.from(`${billingConfig.xendit.secretKey}:`).toString('base64')}`
  }

  async createInvoice(input: CreateInvoiceInput): Promise<CreatedInvoice> {
    const res = await fetch(`${billingConfig.xendit.apiUrl}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': this.#authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: input.externalId,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        payer_email: input.payerEmail ?? undefined,
        success_redirect_url: input.successUrl,
        failure_redirect_url: input.failureUrl,
        invoice_duration: billingConfig.invoiceTtlHours * 3600,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      logger.error({ status: res.status, body }, 'xendit create invoice failed')
      throw new Error(`Xendit invoice creation failed (${res.status})`)
    }

    const data: any = await res.json()
    return {
      providerInvoiceId: data.id,
      checkoutUrl: data.invoice_url,
      status: data.status,
    }
  }

  verifyWebhook(headers: Record<string, string | undefined>): boolean {
    const token = headers['x-callback-token']
    const expected = billingConfig.xendit.webhookToken
    return Boolean(expected) && token === expected
  }

  parseWebhook(payload: any): NormalizedWebhook | null {
    if (!payload?.external_id) return null
    const status = STATUS_MAP[String(payload.status ?? '').toUpperCase()]
    if (!status) return null
    return {
      externalId: payload.external_id,
      status,
      providerInvoiceId: payload.id,
      eventId: payload.id ? `${payload.id}:${status}` : undefined,
    }
  }
}
