import env from '#start/env'
import type { AiProviderId } from '#services/ai/types'

/**
 * AI layer config for Social Forge (ARCHITECTURE.md §11 / Phase 5).
 *
 * Provider API keys are read from the environment (never committed). The model
 * catalog centralizes per-model pricing so token usage can be normalized into
 * provider-agnostic "AI credits" that are fair regardless of which model a
 * tenant's agent uses. Credits are billed as: cost_usd × CREDITS_PER_USD,
 * rounded up, so a tenant is charged the real inference cost expressed in a
 * single internal unit.
 */

/** USD price per 1M tokens for a model, used for credit normalization. */
export type ModelPricing = {
  provider: AiProviderId
  /** Human label for the management UI. */
  label: string
  /** USD per 1,000,000 input tokens. */
  inputPer1M: number
  /** USD per 1,000,000 output tokens. */
  outputPer1M: number
}

/**
 * 1 AI credit = $0.001 of provider spend. A short Haiku reply (~1–2 credits) up
 * to a long Opus reply (~10+ credits) map to intuitive whole numbers.
 */
export const CREDITS_PER_USD = 1000

/**
 * Supported models + pricing. Tenants pick one per AI agent; cheaper models let
 * them stretch their credit balance. Keep IDs exact — see the Claude model
 * catalog. Unknown models fall back to `DEFAULT_MODEL` pricing when metered.
 */
export const AI_MODELS: Record<string, ModelPricing> = {
  'claude-opus-4-8': {
    provider: 'claude',
    label: 'Claude Opus 4.8',
    inputPer1M: 5,
    outputPer1M: 25,
  },
  'claude-sonnet-5': {
    provider: 'claude',
    label: 'Claude Sonnet 5',
    inputPer1M: 3,
    outputPer1M: 15,
  },
  'claude-haiku-4-5': {
    provider: 'claude',
    label: 'Claude Haiku 4.5',
    inputPer1M: 1,
    outputPer1M: 5,
  },
  'gpt-4o': { provider: 'openai', label: 'OpenAI GPT-4o', inputPer1M: 2.5, outputPer1M: 10 },
  'gpt-4o-mini': {
    provider: 'openai',
    label: 'OpenAI GPT-4o mini',
    inputPer1M: 0.15,
    outputPer1M: 0.6,
  },
}

const aiConfig = {
  /** Provider used when an agent doesn't pin one explicitly. */
  defaultProvider: env.get('AI_DEFAULT_PROVIDER', 'claude') as AiProviderId,
  /** Model used when an agent doesn't pin one explicitly. */
  defaultModel: env.get('AI_DEFAULT_MODEL', 'claude-opus-4-8'),

  providers: {
    claude: {
      apiKey: env.get('ANTHROPIC_API_KEY', ''),
    },
    openai: {
      apiKey: env.get('OPENAI_API_KEY', ''),
    },
  },
} as const

export default aiConfig
