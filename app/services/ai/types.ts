/**
 * Provider-agnostic AI contract, mirrored app-locally from `@socialforge/ai`
 * (same rationale as `messaging/constants.ts`): the AdonisJS build must never
 * depend on the workspace package resolving raw TypeScript at typecheck time.
 * Keep this in sync with `packages/ai/src/index.ts`.
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

/** Thrown when a requested provider has no registered adapter or lacks an API key. */
export class UnknownAiProviderError extends Error {
  constructor(id: string) {
    super(`No AI adapter available for provider "${id}" (missing key or unknown id)`)
    this.name = 'UnknownAiProviderError'
  }
}
