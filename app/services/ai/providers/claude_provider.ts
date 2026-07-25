import Anthropic from '@anthropic-ai/sdk'
import type { AiChatOptions, AiChunk, AiMessage, AiProvider, AiResult } from '#services/ai/types'

/**
 * Claude adapter over the official Anthropic SDK (Messages API).
 *
 * Notes for the current model family (Opus 4.8 / Sonnet 5 / Haiku 4.5):
 *  - `temperature` is rejected (400) on Opus 4.7+/Sonnet 5, so we never send it;
 *    behavior is steered via the system prompt instead.
 *  - Thinking is left off — customer-service auto-replies are short and want low
 *    latency, so we don't opt into adaptive thinking here.
 *  - Anthropic has no embeddings endpoint; `embed()` is unsupported (webchat RAG
 *    uses the OpenAI provider for embeddings).
 */
export default class ClaudeProvider implements AiProvider {
  readonly id = 'claude' as const
  #client: Anthropic

  constructor(apiKey: string) {
    this.#client = new Anthropic({ apiKey })
  }

  async chat(messages: AiMessage[], options: AiChatOptions): Promise<AiResult> {
    const { system, turns } = this.#split(messages, options.system)

    const response = await this.#client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 1024,
      ...(system ? { system } : {}),
      messages: turns,
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
      provider: this.id,
    }
  }

  async *stream(messages: AiMessage[], options: AiChatOptions): AsyncIterable<AiChunk> {
    const { system, turns } = this.#split(messages, options.system)

    const stream = this.#client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens ?? 1024,
      ...(system ? { system } : {}),
      messages: turns,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { delta: event.delta.text, done: false }
      }
    }
    yield { delta: '', done: true }
  }

  countTokens(input: string): number {
    // Best-effort heuristic for quota pre-checks (~4 chars/token).
    return Math.ceil(input.length / 4)
  }

  async embed(): Promise<number[]> {
    throw new Error('Claude provider does not support embeddings; use the OpenAI provider for RAG')
  }

  /**
   * The Messages API takes `system` as a top-level field and `messages` as
   * alternating user/assistant turns. Pull any system messages out and merge
   * them with the caller-supplied system prompt.
   */
  #split(messages: AiMessage[], baseSystem?: string) {
    const systemParts = [
      ...(baseSystem ? [baseSystem] : []),
      ...messages.filter((m) => m.role === 'system').map((m) => m.content),
    ]
    const turns = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    return { system: systemParts.join('\n\n'), turns }
  }
}
