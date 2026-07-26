/** Provider-agnostic payment gateway contract (Xendit first; Midtrans/PayPal later). */

export type CreateInvoiceInput = {
  /** Our invoice number — echoed back on the webhook as external_id. */
  externalId: string
  amount: number
  currency: string
  description: string
  payerEmail?: string | null
  successUrl?: string
  failureUrl?: string
}

export type CreatedInvoice = {
  providerInvoiceId: string
  checkoutUrl: string
  status: string
}

export type NormalizedWebhookStatus = 'paid' | 'expired' | 'failed' | 'pending'

export type NormalizedWebhook = {
  externalId: string
  status: NormalizedWebhookStatus
  providerInvoiceId?: string
  /** Stable provider event id for dedup. */
  eventId?: string
}

export interface PaymentGateway {
  readonly id: string
  createInvoice(input: CreateInvoiceInput): Promise<CreatedInvoice>
  /** Verify a webhook's authenticity from its headers. */
  verifyWebhook(headers: Record<string, string | undefined>): boolean
  /** Normalize a raw webhook body into a status update. */
  parseWebhook(payload: any): NormalizedWebhook | null
}
