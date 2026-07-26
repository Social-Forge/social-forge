import XenditProvider from '#services/billing/xendit_provider'
import type { PaymentGateway } from '#services/billing/payment_gateway'

let instance: PaymentGateway | null = null

/** The configured payment gateway (singleton). Xendit for now. */
export function paymentGateway(): PaymentGateway {
  if (!instance) instance = new XenditProvider()
  return instance
}
