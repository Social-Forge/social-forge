import type Channel from '#models/channel'
import type { InboundJob } from '#services/messaging/types'
import MessageIngestService from '#services/messaging/message_ingest_service'
import { MetaAdapter, type MetaObject } from '#services/meta/meta_adapter'

/** Meta (Messenger / Instagram / WhatsApp Business) inbound handler. */
export default class MetaInbound {
  static async handle(channel: Channel, job: InboundJob): Promise<void> {
    const object = job.payload?.object as MetaObject
    const entry = job.payload?.entry
    if (!object || !entry) return

    const { messages, statuses } = MetaAdapter.parseEntry(object, entry)
    for (const message of messages) {
      await MessageIngestService.ingestInbound(channel, message)
    }
    for (const status of statuses) {
      await MessageIngestService.updateDeliveryStatus(
        channel,
        status.providerMessageId,
        status.status
      )
    }
  }
}
