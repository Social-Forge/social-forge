import env from '#start/env'

/**
 * Meta Graph API client for outbound sends. Tokens are per-channel (stored
 * encrypted) and passed via the Authorization header (never the query string).
 */
class MetaClient {
  #base() {
    return `https://graph.facebook.com/${env.get('META_GRAPH_API_VERSION', 'v21.0')}`
  }

  async #post(token: string, path: string, body: unknown): Promise<any> {
    const res = await fetch(`${this.#base()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(`Meta ${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
    }
    return data
  }

  // --- Messenger / Instagram ---
  async sendMessengerText(token: string, recipientId: string, text: string): Promise<string> {
    const data = await this.#post(token, '/me/messages', {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text },
    })
    return String(data.message_id ?? '')
  }

  async sendMessengerAttachment(
    token: string,
    recipientId: string,
    type: 'image' | 'video' | 'audio' | 'file',
    url: string
  ): Promise<string> {
    const data = await this.#post(token, '/me/messages', {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { attachment: { type, payload: { url, is_reusable: false } } },
    })
    return String(data.message_id ?? '')
  }

  // --- WhatsApp Business ---
  async sendWhatsAppText(
    token: string,
    phoneNumberId: string,
    to: string,
    text: string
  ): Promise<string> {
    const data = await this.#post(token, `/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    })
    return String(data.messages?.[0]?.id ?? '')
  }

  /** Resolve a WhatsApp/Meta media id to a (short-lived, authed) download URL. */
  async getMediaUrl(
    token: string,
    mediaId: string
  ): Promise<{ url: string; mimeType: string | null }> {
    const res = await fetch(`${this.#base()}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json().catch(() => ({}))) as any
    if (!res.ok) {
      throw new Error(`Meta getMedia ${mediaId} -> ${res.status}`)
    }
    return { url: String(data.url ?? ''), mimeType: data.mime_type ?? null }
  }

  /** Template message — required outside the 24-hour customer service window. */
  async sendWhatsAppTemplate(
    token: string,
    phoneNumberId: string,
    to: string,
    template: { name: string; languageCode: string; components?: unknown[] }
  ): Promise<string> {
    const data = await this.#post(token, `/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.languageCode },
        components: template.components ?? [],
      },
    })
    return String(data.messages?.[0]?.id ?? '')
  }
}

export default new MetaClient()
