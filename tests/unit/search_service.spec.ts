import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Message from '#models/message'
import Contact from '#models/contact'
import searchService from '#services/search/search_service'

test.group('Search document mappers', () => {
  test('messageDoc maps fields and epoch-seconds created_at', ({ assert }) => {
    const message = new Message()
    message.id = 'm1'
    message.tenantId = 't1'
    message.conversationId = 'c1'
    message.direction = 'in'
    message.body = 'Halo dunia'
    message.createdAt = DateTime.fromISO('2026-07-20T10:00:00Z')

    const doc = searchService.messageDoc(message, 'Nina', 'ch1')
    assert.deepEqual(doc, {
      id: 'm1',
      tenant_id: 't1',
      conversation_id: 'c1',
      channel_id: 'ch1',
      contact_name: 'Nina',
      body: 'Halo dunia',
      direction: 'in',
      created_at: Math.floor(DateTime.fromISO('2026-07-20T10:00:00Z').toMillis() / 1000),
    })
  })

  test('contactDoc maps fields with empty-string fallbacks', ({ assert }) => {
    const contact = new Contact()
    contact.id = 'k1'
    contact.tenantId = 't1'
    contact.channelId = 'ch1'
    contact.displayName = null
    contact.externalId = '628@c.us'
    contact.createdAt = DateTime.now()

    const doc = searchService.contactDoc(contact)
    assert.equal(doc.id, 'k1')
    assert.equal(doc.display_name, '')
    assert.equal(doc.external_id, '628@c.us')
  })
})

test.group('Search scoped key', () => {
  test('is deterministic and embeds the tenant filter', ({ assert }) => {
    const a = searchService.scopedSearchKey('search-only-key', 'tenant-1')
    const b = searchService.scopedSearchKey('search-only-key', 'tenant-1')
    assert.equal(a, b)

    const decoded = Buffer.from(a, 'base64').toString('utf8')
    assert.include(decoded, 'filter_by')
    assert.include(decoded, 'tenant_id:=tenant-1')
  })

  test('differs per tenant', ({ assert }) => {
    const a = searchService.scopedSearchKey('search-only-key', 'tenant-1')
    const b = searchService.scopedSearchKey('search-only-key', 'tenant-2')
    assert.notEqual(a, b)
  })
})
