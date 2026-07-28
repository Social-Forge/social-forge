import { test } from '@japa/runner'
import metrics from '#services/observability/metrics'
import ErrorReporter from '#services/observability/error_reporter'
import TurnstileService from '#services/security/turnstile_service'

test.group('metrics registry', () => {
  test('increments and snapshots counters', ({ assert }) => {
    const name = `sf_test_counter_${Date.now()}`
    metrics.inc(name)
    metrics.inc(name, 4)
    assert.equal(metrics.counters()[name], 5)
  })
})

test.group('TurnstileService (disabled)', () => {
  test('is disabled and passes verification when no secret configured', async ({ assert }) => {
    // No TURNSTILE_SECRET_KEY in the test env → feature off.
    assert.isFalse(TurnstileService.enabled)
    assert.isTrue(await TurnstileService.verify(null))
    assert.isTrue(await TurnstileService.verify('anything'))
  })
})

test.group('ErrorReporter (disabled)', () => {
  test('is disabled and capture is a safe no-op', async ({ assert }) => {
    assert.isFalse(ErrorReporter.enabled)
    // Should resolve without throwing and without any network call.
    await ErrorReporter.capture(new Error('boom'), { url: '/x' })
    assert.isTrue(true)
  })
})
