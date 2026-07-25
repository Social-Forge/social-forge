import logger from '@adonisjs/core/services/logger'
import Message from '#models/message'
import type Channel from '#models/channel'
import TenantContext from '#services/tenant_context'
import centrifugo from '#services/realtime/centrifugo_service'
import telegramClient from '#services/telegram/telegram_client'
import metaClient from '#services/meta/meta_client'
import MinioService from '#services/storage/minio_service'

export type MediaJob = { messageId: string; tenantId: string; channelId: string }

type MediaAttrs = {
  url?: string | null
  mimeType?: string | null
  filename?: string | null
  providerMediaId?: string | null
  storageKey?: string | null
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'application/pdf': '.pdf',
}

/**
 * Mirrors provider media (Meta/Telegram) into our own MinIO bucket so links
 * don't expire and never require the provider token to view. WAHA media already
 * lives in MinIO and is never enqueued here.
 */
export default class MediaMirror {
  static async process(job: MediaJob): Promise<void> {
    await TenantContext.run(job.tenantId, () => this.#process(job))
  }

  static async #process(job: MediaJob) {
    const message = await Message.query()
      .where('id', job.messageId)
      .preload('conversation', (q) => q.preload('channel'))
      .first()
    if (!message?.media) return

    const media = message.media as MediaAttrs
    if (media.storageKey) return // already mirrored (idempotent)

    const channel = message.conversation.channel
    const source = await this.#resolveSource(channel, media)
    if (!source) return

    const buffer = await this.#download(source.url, source.authToken)
    const contentType = source.mimeType || media.mimeType || 'application/octet-stream'
    const key = `media/${job.tenantId}/${message.id}${this.#extFor(contentType, media.filename)}`

    await MinioService.ensureBucket()
    await MinioService.putBuffer(key, buffer, contentType)

    media.storageKey = key
    media.mimeType = contentType
    media.url = await MinioService.presignedGetUrl(key)
    message.media = media
    await message.save()

    await centrifugo.publish(
      centrifugo.conversationChannel(channel.tenantId, message.conversationId),
      {
        type: 'message.updated',
        id: message.id,
        media,
      }
    )
    logger.info({ messageId: message.id, key }, 'media mirrored to MinIO')
  }

  static async #resolveSource(
    channel: Channel,
    media: MediaAttrs
  ): Promise<{ url: string; mimeType?: string | null; authToken?: string } | null> {
    if (channel.type === 'telegram') {
      const token = channel.getCredential('botToken')
      if (!token || !media.providerMediaId) return null
      const url = await telegramClient.getFileUrl(token, media.providerMediaId)
      return url ? { url } : null
    }
    if (channel.type === 'whatsapp_meta') {
      const token = channel.getCredential('accessToken')
      if (!token || !media.providerMediaId) return null
      const resolved = await metaClient.getMediaUrl(token, media.providerMediaId)
      return resolved.url
        ? { url: resolved.url, mimeType: resolved.mimeType, authToken: token }
        : null
    }
    // Messenger / Instagram serve a direct (temporary) URL.
    return media.url ? { url: media.url } : null
  }

  static async #download(url: string, authToken?: string): Promise<Buffer> {
    const res = await fetch(
      url,
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
    )
    if (!res.ok) throw new Error(`media download failed ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }

  static #extFor(contentType: string, filename?: string | null): string {
    if (filename && filename.includes('.')) return filename.slice(filename.lastIndexOf('.'))
    return EXT_BY_MIME[contentType.split(';')[0]] ?? ''
  }
}
