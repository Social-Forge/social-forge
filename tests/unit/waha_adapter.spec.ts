import { test } from '@japa/runner'
import { WahaAdapter } from '#services/waha/waha_adapter'

test.group('WahaAdapter.parseMessage', () => {
  test('normalizes a text message', ({ assert }) => {
    const body = {
      event: 'message',
      payload: {
        id: 'false_628@c.us_ABC',
        from: '628@c.us',
        fromMe: false,
        type: 'chat',
        body: 'Halo',
        timestamp: 1700000000,
        _data: { notifyName: 'Budi' },
      },
    }
    const n = WahaAdapter.parseMessage(body)
    assert.exists(n)
    assert.equal(n!.providerMessageId, 'false_628@c.us_ABC')
    assert.equal(n!.externalContactId, '628@c.us')
    assert.equal(n!.contactName, 'Budi')
    assert.equal(n!.contentType, 'text')
    assert.equal(n!.body, 'Halo')
    assert.isFalse(n!.fromMe)
    assert.isNull(n!.media)
  })

  test('normalizes an image message with media', ({ assert }) => {
    const n = WahaAdapter.parseMessage({
      payload: {
        id: 'x',
        from: '628@c.us',
        type: 'image',
        hasMedia: true,
        caption: 'photo',
        media: { url: 'http://minio/x.jpg', mimetype: 'image/jpeg', filename: 'x.jpg' },
        timestamp: 1,
      },
    })
    assert.equal(n!.contentType, 'image')
    assert.equal(n!.body, 'photo')
    assert.deepEqual(n!.media, {
      url: 'http://minio/x.jpg',
      mimeType: 'image/jpeg',
      filename: 'x.jpg',
    })
  })

  test('returns null for a payload without id/from', ({ assert }) => {
    assert.isNull(WahaAdapter.parseMessage({ payload: { type: 'chat' } }))
    assert.isNull(WahaAdapter.parseMessage({}))
  })

  test('maps ack levels to delivery status', ({ assert }) => {
    assert.equal(WahaAdapter.mapAckStatus(1), 'sent')
    assert.equal(WahaAdapter.mapAckStatus(2), 'delivered')
    assert.equal(WahaAdapter.mapAckStatus(3), 'read')
    assert.isNull(WahaAdapter.mapAckStatus(0))
  })

  test('parses an ack payload', ({ assert }) => {
    const ack = WahaAdapter.parseAck({ payload: { id: 'msg1', ack: 3 } })
    assert.deepEqual(ack, { providerMessageId: 'msg1', status: 'read' })
  })
})
