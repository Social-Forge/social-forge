<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

interface Metrics {
  tenants: number
  users: number
  activeSubscriptions: number
  paidInvoices: number
  revenue: number
  aiCreditsOutstanding: number
}
interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  aiCredits: number
  createdAt: string
}
interface Plan {
  code: string
  name: string
}

const loading = ref(true)
const metrics = ref<Metrics | null>(null)
const tenants = ref<Tenant[]>([])
const plans = ref<Plan[]>([])
const search = ref('')
const savingId = ref<string | null>(null)

const rp = (n: number) => `Rp${(n ?? 0).toLocaleString('id-ID')}`
const STATUSES = ['trial', 'active', 'suspended', 'canceled']

async function loadTenants() {
  const res = await api
    .get<{ data: Tenant[] }>(`/super/tenants?q=${encodeURIComponent(search.value)}`)
    .catch(() => ({ data: [] }))
  tenants.value = res?.data ?? []
}

async function load() {
  loading.value = true
  const [m, p] = await Promise.all([
    api.get<Metrics>('/super/metrics').catch(() => null),
    api.get<Plan[]>('/super/plans').catch(() => []),
  ])
  metrics.value = m
  plans.value = p ?? []
  await loadTenants()
  loading.value = false
}

async function update(tenant: Tenant, patch: Record<string, unknown>) {
  savingId.value = tenant.id
  try {
    const updated = await api.put<Tenant>(`/super/tenants/${tenant.id}`, patch)
    if (updated) Object.assign(tenant, updated)
  } finally {
    savingId.value = null
  }
}

async function grantCredits(tenant: Tenant) {
  const input = prompt(`Grant how many AI credits to "${tenant.name}"?`, '1000')
  const amount = Number(input)
  if (!amount || amount < 1) return
  await update(tenant, { grantCredits: amount })
}

const statusColor: Record<string, string> = {
  active: 'text-green-600',
  trial: 'text-amber-600',
  suspended: 'text-red-600',
  canceled: 'text-muted-foreground',
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Icon icon="lucide:shield" class="text-primary size-5" />
        <h1 class="font-semibold">Super Admin</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <!-- Metrics -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">Tenants</div>
            <div class="mt-1 text-3xl font-bold">{{ metrics?.tenants ?? 0 }}</div>
          </div>
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">Users</div>
            <div class="mt-1 text-3xl font-bold">{{ metrics?.users ?? 0 }}</div>
          </div>
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">Active subscriptions</div>
            <div class="mt-1 text-3xl font-bold">{{ metrics?.activeSubscriptions ?? 0 }}</div>
          </div>
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">Paid invoices</div>
            <div class="mt-1 text-3xl font-bold">{{ metrics?.paidInvoices ?? 0 }}</div>
          </div>
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">Revenue (paid)</div>
            <div class="mt-1 text-3xl font-bold">{{ rp(metrics?.revenue ?? 0) }}</div>
          </div>
          <div class="bg-card rounded-2xl border p-5">
            <div class="text-muted-foreground text-xs">AI credits outstanding</div>
            <div class="mt-1 text-3xl font-bold">
              {{ (metrics?.aiCreditsOutstanding ?? 0).toLocaleString('id-ID') }}
            </div>
          </div>
        </div>

        <!-- Tenants -->
        <div class="bg-card rounded-2xl border">
          <div class="flex items-center gap-3 border-b px-6 py-4">
            <h2 class="font-semibold">Tenants</h2>
            <div class="relative ml-auto">
              <Icon
                icon="lucide:search"
                class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <input
                v-model="search"
                placeholder="Search…"
                class="bg-muted rounded-lg py-1.5 pr-3 pl-9 text-sm outline-none"
                @keyup.enter="loadTenants"
              />
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-muted-foreground border-b text-left text-xs">
                <tr>
                  <th class="px-6 py-3 font-medium">Tenant</th>
                  <th class="px-4 py-3 font-medium">Plan</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium">Credits</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="tenant in tenants" :key="tenant.id" class="hover:bg-muted/40">
                  <td class="px-6 py-3">
                    <div class="font-medium">{{ tenant.name }}</div>
                    <div class="text-muted-foreground text-xs">{{ tenant.slug }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <select
                      :value="tenant.plan"
                      class="bg-background rounded-lg border px-2 py-1 text-sm"
                      :disabled="savingId === tenant.id"
                      @change="update(tenant, { plan: ($event.target as HTMLSelectElement).value })"
                    >
                      <option v-for="p in plans" :key="p.code" :value="p.code">{{ p.name }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <select
                      :value="tenant.status"
                      :class="[
                        'bg-background rounded-lg border px-2 py-1 text-sm',
                        statusColor[tenant.status] ?? '',
                      ]"
                      :disabled="savingId === tenant.id"
                      @change="
                        update(tenant, { status: ($event.target as HTMLSelectElement).value })
                      "
                    >
                      <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 font-medium">
                    {{ (tenant.aiCredits ?? 0).toLocaleString('id-ID') }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="hover:bg-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
                      @click="grantCredits(tenant)"
                    >
                      + Credits
                    </button>
                  </td>
                </tr>
                <tr v-if="!tenants.length">
                  <td colspan="5" class="text-muted-foreground px-6 py-8 text-center">
                    No tenants found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
