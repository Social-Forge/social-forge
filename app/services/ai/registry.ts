import aiConfig from '#config/ai'
import ClaudeProvider from '#services/ai/providers/claude_provider'
import OpenAiProvider from '#services/ai/providers/openai_provider'
import { UnknownAiProviderError, type AiProvider, type AiProviderId } from '#services/ai/types'

/**
 * Lazily instantiates and caches the concrete AI adapters. A provider is only
 * available when its API key is configured; requesting an unconfigured provider
 * throws `UnknownAiProviderError` so callers fail loudly rather than making
 * unauthenticated API calls.
 */
class AiRegistry {
  #cache = new Map<AiProviderId, AiProvider>()

  get(id: AiProviderId): AiProvider {
    const cached = this.#cache.get(id)
    if (cached) return cached

    const provider = this.#build(id)
    if (!provider) throw new UnknownAiProviderError(id)
    this.#cache.set(id, provider)
    return provider
  }

  /** Whether a provider has a configured API key. */
  isConfigured(id: AiProviderId): boolean {
    return Boolean(aiConfig.providers[id]?.apiKey)
  }

  #build(id: AiProviderId): AiProvider | null {
    const key = aiConfig.providers[id]?.apiKey
    if (!key) return null

    switch (id) {
      case 'claude':
        return new ClaudeProvider(key)
      case 'openai':
        return new OpenAiProvider(key)
      default:
        return null
    }
  }
}

export default new AiRegistry()
