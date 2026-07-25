import type Channel from '#models/channel'
import type { InboundJob } from '#services/messaging/types'
import MessageIngestService from '#services/messaging/message_ingest_service'
import { TelegramAdapter } from '#services/telegram/telegram_adapter'

/** Telegram inbound handler. */
export default class TelegramInbound {
  static async handle(channel: Channel, job: InboundJob): Promise<void> {
    const normalized = TelegramAdapter.parseUpdate(job.payload)
    if (normalized) await MessageIngestService.ingestInbound(channel, normalized)
  }
}
