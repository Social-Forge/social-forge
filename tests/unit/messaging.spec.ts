import { test } from '@japa/runner'
import { EXCHANGES, TOPIC_EXCHANGES } from '#services/messaging/topology'

test.group('messaging topology', () => {
  test('exposes the six pipeline topic exchanges', ({ assert }) => {
    assert.lengthOf(TOPIC_EXCHANGES, 6)
    assert.includeMembers(TOPIC_EXCHANGES, [
      EXCHANGES.inbound,
      EXCHANGES.outbound,
      EXCHANGES.ai,
      EXCHANGES.media,
      EXCHANGES.search,
      EXCHANGES.notifications,
    ])
  })

  test('keeps the dead-letter exchange out of the publish set', ({ assert }) => {
    assert.notInclude(TOPIC_EXCHANGES, EXCHANGES.deadLetter)
  })

  test('namespaces every exchange under the sf. prefix', ({ assert }) => {
    for (const exchange of Object.values(EXCHANGES)) {
      assert.match(exchange, /^sf\./)
    }
  })
})
