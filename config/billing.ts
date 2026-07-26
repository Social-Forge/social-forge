import env from '#start/env'

/**
 * Billing / payment configuration (Phase 7). Xendit is the first gateway;
 * Midtrans and PayPal follow the same `PaymentGateway` contract later.
 */
const billingConfig = {
  /** Active payment gateway id. */
  provider: 'xendit' as const,

  xendit: {
    secretKey: env.get('XENDIT_SECRET_KEY', ''),
    webhookToken: env.get('XENDIT_WEBHOOK_TOKEN', ''),
    apiUrl: env.get('XENDIT_API_URL', 'https://api.xendit.co'),
  },

  /** Invoice validity window before it auto-expires. */
  invoiceTtlHours: 24,

  /** Billing period length granted on a paid subscription invoice. */
  periodDays: 30,

  /** Add-on prices (IDR). */
  addons: {
    /** Per extra channel slot (one channel of a given type). */
    channelSlot: 50000,
    /** Per 1,000 AI credits. */
    aiCreditsPer1000: 25000,
  },
} as const

export default billingConfig
