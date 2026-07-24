/**
 * Provider-agnostic AI abstraction for Social Forge (ARCHITECTURE.md §11).
 *
 * Concrete adapters (Claude, OpenAI, …) implement `AiProvider`. Token usage is
 * reported per call so the billing layer can normalize it into internal
 * "AI credits" that are fair across providers with different token pricing.
 *
 * Adapters are added in Phase 5; this package defines the contract now so the
 * rest of the codebase can depend on a stable interface.
 */
export type AiProviderId = 'claude' | 'openai'

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiChatOptions {
  model: string
  system?: string
  temperature?: number
  maxTokens?: number
}

export interface AiUsage {
  inputTokens: number
  outputTokens: number
}

export interface AiResult {
  text: string
  usage: AiUsage
  model: string
  provider: AiProviderId
}

export interface AiChunk {
  delta: string
  done: boolean
}

export interface AiProvider {
  readonly id: AiProviderId

  /** Single-shot completion. */
  chat(messages: AiMessage[], options: AiChatOptions): Promise<AiResult>

  /** Streaming completion for interactive UIs. */
  stream(messages: AiMessage[], options: AiChatOptions): AsyncIterable<AiChunk>

  /** Best-effort token estimate for quota pre-checks. */
  countTokens(input: string): number

  /** Embedding vector for RAG (webchat knowledge base). */
  embed(text: string): Promise<number[]>
}

/** Thrown when a requested provider has no registered adapter. */
export class UnknownAiProviderError extends Error {
  constructor(id: string) {
    super(`No AI adapter registered for provider "${id}"`)
    this.name = 'UnknownAiProviderError'
  }
}
