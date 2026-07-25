import { test } from '@japa/runner'
import { TelegramAdapter } from '#services/telegram/telegram_adapter'

test.group('TelegramAdapter', () => {
  test('parses a text message with a globally-unique composite id', ({ assert }) => {
    const n = TelegramAdapter.parseUpdate({
      update_id: 1,
      message: {
        message_id: 42,
        from: { id: 555, first_name: 'Sarah', last_name: 'Lee' },
        chat: { id: 555, type: 'private' },
        date: 1700000000,
        text: 'Hello',
      },
    })
    assert.exists(n)
    assert.equal(n!.providerMessageId, '555:42')
    assert.equal(n!.externalContactId, '555')
    assert.equal(n!.contactName, 'Sarah Lee')
    assert.equal(n!.contentType, 'text')
    assert.equal(n!.body, 'Hello')
    assert.isFalse(n!.fromMe)
  })

  test('parses a photo message and picks the largest size', ({ assert }) => {
    const n = TelegramAdapter.parseUpdate({
      message: {
        message_id: 7,
        from: { id: 9, username: 'bob' },
        chat: { id: 9 },
        date: 1,
        caption: 'pic',
        photo: [
          { file_id: 'small', width: 90 },
          { file_id: 'large', width: 1280 },
        ],
      },
    })
    assert.equal(n!.contentType, 'image')
    assert.equal(n!.body, 'pic')
    assert.equal(n!.contactName, 'bob')
    assert.equal(n!.media?.providerMediaId, 'large')
  })

  test('parses a document message', ({ assert }) => {
    const n = TelegramAdapter.parseUpdate({
      message: {
        message_id: 8,
        from: { id: 9 },
        chat: { id: 9 },
        date: 1,
        document: { file_id: 'doc1', file_name: 'invoice.pdf', mime_type: 'application/pdf' },
      },
    })
    assert.equal(n!.contentType, 'document')
    assert.equal(n!.media?.filename, 'invoice.pdf')
    assert.equal(n!.media?.mimeType, 'application/pdf')
  })

  test('returns null for a non-message update', ({ assert }) => {
    assert.isNull(TelegramAdapter.parseUpdate({ update_id: 1 }))
  })
})
