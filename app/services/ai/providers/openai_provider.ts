import OpenAI from 'openai'
import type { AiChatOptions, AiChunk, AiMessage, AiProvider, AiResult } from '#services/ai/types'

/** Model used for embeddings (webchat RAG knowledge base). */
const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * OpenAI adapter over the official SDK (Chat Completions). Unlike Claude, this
 * provider accepts `temperature` and exposes an embeddings endpoint used by the
 * webchat RAG bot.
 */
export default class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const
  #client: OpenAI

  constructor(apiKey: string) {
    this.#client = new OpenAI({ apiKey })
  }

  async chat(messages: AiMessage[], options: AiChatOptions): Promise<AiResult> {
    const response = await this.#client.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      messages: this.#toMessages(messages, options.system),
    })

    return {
      text: response.choices[0]?.message?.content ?? '',
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      model: response.model,
      provider: this.id,
    }
  }

  async *stream(messages: AiMessage[], options: AiChatOptions): AsyncIterable<AiChunk> {
    const stream = await this.#client.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      messages: this.#toMessages(messages, options.system),
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield { delta, done: false }
    }
    yield { delta: '', done: true }
  }

  countTokens(input: string): number {
    return Math.ceil(input.length / 4)
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.#client.embeddings.create({ model: EMBEDDING_MODEL, input: text })
    return response.data[0].embedding
  }

  #toMessages(
    messages: AiMessage[],
    system?: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const out: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    if (system) out.push({ role: 'system', content: system })
    for (const m of messages) out.push({ role: m.role, content: m.content })
    return out
  }
}
