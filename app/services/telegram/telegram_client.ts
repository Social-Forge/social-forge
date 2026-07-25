/**
 * Telegram Bot API client. The bot token is per-channel (stored encrypted in
 * the channel credentials), so every method takes it explicitly.
 */
class TelegramClient {
  #api(token: string) {
    return `https://api.telegram.org/bot${token}`
  }

  async #request<T = any>(token: string, method: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.#api(token)}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json()) as any
    if (!res.ok || !data.ok) {
      throw new Error(`Telegram ${method} -> ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
    }
    return data.result as T
  }

  setWebhook(token: string, url: string, secret: string) {
    return this.#request(token, 'setWebhook', {
      url,
      secret_token: secret,
      allowed_updates: ['message', 'edited_message'],
    })
  }

  deleteWebhook(token: string) {
    return this.#request(token, 'deleteWebhook', { drop_pending_updates: false })
  }

  getMe(token: string) {
    return this.#request(token, 'getMe', {})
  }

  sendMessage(token: string, chatId: string, text: string, replyToMessageId?: number) {
    return this.#request<{ message_id: number }>(token, 'sendMessage', {
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
    })
  }

  sendPhoto(token: string, chatId: string, photoUrl: string, caption?: string) {
    return this.#request<{ message_id: number }>(token, 'sendPhoto', {
      chat_id: chatId,
      photo: photoUrl,
      caption,
    })
  }

  /** Resolve a file_id to a temporary download URL (valid ~1h). */
  async getFileUrl(token: string, fileId: string): Promise<string | null> {
    const file = await this.#request<{ file_path?: string }>(token, 'getFile', { file_id: fileId })
    if (!file?.file_path) return null
    return `https://api.telegram.org/file/bot${token}/${file.file_path}`
  }
}

export default new TelegramClient()
