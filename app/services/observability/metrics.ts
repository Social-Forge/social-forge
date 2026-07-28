import { Counter, Gauge } from 'prom-client'
import db from '@adonisjs/lucid/services/db'

/**
 * Business metrics exposed through the existing `@julr/adonisjs-prometheus`
 * `/metrics` endpoint (they register on prom-client's default registry, which
 * that package serves). Counters are created lazily via `inc(name)`; process +
 * DB gauges below are scraped on demand.
 */
class MetricRegistry {
  #tally = new Map<string, number>()
  #counters = new Map<string, Counter>()

  #counter(name: string): Counter {
    let counter = this.#counters.get(name)
    if (!counter) {
      counter = new Counter({ name, help: name })
      this.#counters.set(name, counter)
    }
    return counter
  }

  inc(name: string, by = 1): void {
    this.#tally.set(name, (this.#tally.get(name) ?? 0) + by)
    try {
      this.#counter(name).inc(by)
    } catch {
      // Name already registered on the default registry — ignore.
    }
  }

  /** Current in-process counter values (used by tests / debugging). */
  counters(): Record<string, number> {
    return Object.fromEntries(this.#tally)
  }
}

const metrics = new MetricRegistry()
export default metrics

// --- Gauges (registered once at import) --------------------------------------
async function tableCount(table: string, where?: (q: any) => void): Promise<number> {
  try {
    const q = db.from(table).count('* as c')
    if (where) where(q)
    const rows = await q
    return Number((rows[0] as any)?.c ?? 0)
  } catch {
    return 0
  }
}

new Gauge({
  name: 'sf_process_uptime_seconds',
  help: 'Process uptime in seconds.',
  collect() {
    this.set(Math.round(process.uptime()))
  },
})

new Gauge({
  name: 'sf_process_resident_memory_bytes',
  help: 'Resident memory size in bytes.',
  collect() {
    this.set(process.memoryUsage().rss)
  },
})

new Gauge({
  name: 'sf_tenants_total',
  help: 'Total number of tenants.',
  async collect() {
    this.set(await tableCount('tenants'))
  },
})

new Gauge({
  name: 'sf_conversations_active',
  help: 'Conversations not completed or archived.',
  async collect() {
    this.set(
      await tableCount('conversations', (q) => q.whereNotIn('status', ['completed', 'archived']))
    )
  },
})

new Gauge({
  name: 'sf_outbox_pending',
  help: 'Pending outbound messages in the outbox.',
  async collect() {
    this.set(await tableCount('message_outbox', (q) => q.where('status', 'pending')))
  },
})
