import { AsyncLocalStorage } from 'node:async_hooks'

type TenantStore = {
  tenantId: string | null
  /** When true, tenant scoping is intentionally disabled (platform ops). */
  bypass: boolean
}

/**
 * Request-scoped tenant context backed by AsyncLocalStorage.
 *
 * The `tenant` middleware wraps each authenticated request in `run()`, so any
 * code executed downstream (controllers, services, model query hooks) can read
 * the current tenant without threading it through every function call. Workers
 * and seeders set it explicitly around their unit of work.
 *
 * This is the source of truth consumed by the `TenantScoped` model mixin.
 */
const storage = new AsyncLocalStorage<TenantStore>()

const TenantContext = {
  /** Run `callback` with the given tenant as the active scope. */
  run<T>(tenantId: string | null, callback: () => T): T {
    return storage.run({ tenantId, bypass: false }, callback)
  },

  /**
   * Run `callback` with tenant scoping disabled — for platform/super-admin
   * operations that legitimately span tenants. Use sparingly.
   */
  runBypassed<T>(callback: () => T): T {
    return storage.run({ tenantId: null, bypass: true }, callback)
  },

  /** The active tenant id, or null when unset or bypassed. */
  current(): string | null {
    const store = storage.getStore()
    if (!store || store.bypass) return null
    return store.tenantId
  },

  /** True when a concrete tenant is active and scoping should be applied. */
  get isScoped(): boolean {
    const store = storage.getStore()
    return !!store && !store.bypass && store.tenantId !== null
  },
}

export default TenantContext
