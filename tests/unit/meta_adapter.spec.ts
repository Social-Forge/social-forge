import { test } from '@japa/runner'
import { MetaAdapter } from '#services/meta/meta_adapter'

test.group('MetaAdapter — WhatsApp Business', () => {
  const entry = {
    changes: [
      {
        value: {
          metadata: { phone_number_id: '10555' },
          contacts: [{ wa_id: '628123', profile: { name: 'Andi' } }],
          messages: [
            {
              id: 'wamid.1',
              from: '628123',
              type: 'text',
              text: { body: 'Halo' },
              timestamp: '1700000000',
            },
            {
              id: 'wamid.2',
              from: '628123',
              type: 'image',
              image: { id: 'media-9', mime_type: 'image/jpeg', caption: 'foto' },
              timestamp: '1700000001',
            },
          ],
          statuses: [{ id: 'wamid.0', status: 'read', recipient_id: '628123' }],
        },
      },
    ],
  }

  test('resolves the channel external id from phone_number_id', ({ assert }) => {
    assert.equal(MetaAdapter.resolveExternalId('whatsapp_business_account', entry), '10555')
  })

  test('parses text + image messages and statuses', ({ assert }) => {
    const { messages, statuses } = MetaAdapter.parseEntry('whatsapp_business_account', entry)
    assert.lengthOf(messages, 2)
    assert.equal(messages[0].providerMessageId, 'wamid.1')
    assert.equal(messages[0].contactName, 'Andi')
    assert.equal(messages[0].contentType, 'text')
    assert.equal(messages[0].body, 'Halo')

    assert.equal(messages[1].contentType, 'image')
    assert.equal(messages[1].body, 'foto')
    assert.equal(messages[1].media?.providerMediaId, 'media-9')

    assert.deepEqual(statuses, [{ providerMessageId: 'wamid.0', status: 'read' }])
  })
})

test.group('MetaAdapter — Messenger', () => {
  test('parses a text message and resolves page id', ({ assert }) => {
    const entry = {
      id: 'PAGE_1',
      messaging: [
        {
          sender: { id: 'PSID_1' },
          timestamp: 1700000000000,
          message: { mid: 'm_abc', text: 'hi there' },
        },
      ],
    }
    assert.equal(MetaAdapter.resolveExternalId('page', entry), 'PAGE_1')

    const { messages } = MetaAdapter.parseEntry('page', entry)
    assert.lengthOf(messages, 1)
    assert.equal(messages[0].externalContactId, 'PSID_1')
    assert.equal(messages[0].providerMessageId, 'm_abc')
    assert.equal(messages[0].body, 'hi there')
    assert.equal(messages[0].timestamp, 1700000000)
  })

  test('turns delivery receipts into status updates and skips echoes', ({ assert }) => {
    const entry = {
      id: 'PAGE_1',
      messaging: [
        { delivery: { mids: ['m_1', 'm_2'] } },
        { sender: { id: 'PSID' }, message: { mid: 'm_echo', text: 'x', is_echo: true } },
      ],
    }
    const { messages, statuses } = MetaAdapter.parseEntry('page', entry)
    assert.lengthOf(messages, 0)
    assert.lengthOf(statuses, 2)
    assert.equal(statuses[0].status, 'delivered')
  })
})
