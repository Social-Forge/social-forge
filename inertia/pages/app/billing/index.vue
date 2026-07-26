<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

const { t } = useTrans()

type PlanFeatures = { aiCredits?: number; agents?: number; channels?: Record<string, number> }
interface Plan {
  id: string
  code: string
  name: string
  price: number
  currency: string
  features: PlanFeatures
}
interface Subscription {
  plan: string
  status: string
  aiCredits: number
  features: PlanFeatures
}
interface Invoice {
  id: string
  number: string
  status: string
  amount: number
  description: string
  checkoutUrl: string | null
  createdAt: string
}

const loading = ref(true)
const working = ref(false)
const sub = ref<Subscription | null>(null)
const plans = ref<Plan[]>([])
const invoices = ref<Invoice[]>([])

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`
const currentPlan = computed(() => sub.value?.plan ?? 'free')

async function load() {
  loading.value = true
  const [s, p, i] = await Promise.all([
    api.get<Subscription>('/app/billing/subscription').catch(() => null),
    api.get<Plan[]>('/app/billing/plans').catch(() => []),
    api.get<Invoice[]>('/app/billing/invoices').catch(() => []),
  ])
  sub.value = s
  plans.value = p ?? []
  invoices.value = i ?? []
  loading.value = false
}

async function checkout(body: Record<string, unknown>) {
  working.value = true
  try {
    const res = await api.post<{ checkoutUrl?: string }>('/app/billing/checkout', body)
    if (res?.checkoutUrl) window.location.href = res.checkoutUrl
    else await load()
  } finally {
    working.value = false
  }
}

const statusColor: Record<string, string> = {
  paid: 'text-green-600',
  pending: 'text-amber-600',
  expired: 'text-muted-foreground',
  failed: 'text-red-600',
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <a href="/app/chats" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </a>
        <h1 class="font-semibold">{{ t('billing.title') }}</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <!-- Current plan -->
        <div class="bg-card grid gap-4 rounded-2xl border p-6 sm:grid-cols-3">
          <div>
            <div class="text-muted-foreground text-xs">{{ t('billing.current_plan') }}</div>
            <div class="mt-1 text-2xl font-bold capitalize">{{ currentPlan }}</div>
            <div :class="['mt-1 text-xs font-medium', statusColor[sub?.status ?? ''] ?? '']">
              {{ sub?.status }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground text-xs">{{ t('billing.ai_credits') }}</div>
            <div class="mt-1 text-2xl font-bold">
              {{ (sub?.aiCredits ?? 0).toLocaleString('id-ID') }}
            </div>
            <button
              class="text-primary mt-1 text-xs font-medium hover:underline disabled:opacity-50"
              :disabled="working"
              @click="checkout({ type: 'ai_credits', quantity: 1 })"
            >
              {{ t('billing.buy_credits') }} (+1.000)
            </button>
          </div>
        </div>

        <!-- Plans -->
        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="plan in plans"
            :key="plan.id"
            :class="[
              'bg-card rounded-2xl border p-6',
              plan.code === currentPlan ? 'border-primary border-2' : '',
            ]"
          >
            <div class="flex items-baseline justify-between">
              <h3 class="text-lg font-semibold">{{ plan.name }}</h3>
              <div class="text-xl font-bold">{{ rp(plan.price) }}</div>
            </div>
            <ul class="text-muted-foreground mt-4 space-y-1.5 text-sm">
              <li class="flex items-center gap-2">
                <Icon icon="lucide:sparkles" class="text-primary size-4" />
                {{ (plan.features.aiCredits ?? 0).toLocaleString('id-ID') }} AI credits
              </li>
              <li class="flex items-center gap-2">
                <Icon icon="lucide:users" class="text-primary size-4" />
                {{ plan.features.agents ?? 0 }} team members
              </li>
            </ul>
            <button
              v-if="plan.code === currentPlan"
              class="bg-muted text-muted-foreground mt-6 w-full cursor-default rounded-lg py-2.5 text-sm font-semibold"
              disabled
            >
              {{ t('billing.current') }}
            </button>
            <button
              v-else-if="plan.price > 0"
              class="bg-primary text-primary-foreground mt-6 w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
              :disabled="working"
              @click="checkout({ type: 'subscription', planCode: plan.code })"
            >
              {{ t('billing.upgrade') }}
            </button>
          </div>
        </div>

        <!-- Invoices -->
        <div class="bg-card rounded-2xl border">
          <div class="border-b px-6 py-4 font-semibold">{{ t('billing.invoices') }}</div>
          <div v-if="!invoices.length" class="text-muted-foreground px-6 py-8 text-center text-sm">
            {{ t('billing.no_invoices') }}
          </div>
          <div v-else class="divide-y">
            <div
              v-for="inv in invoices"
              :key="inv.id"
              class="flex items-center gap-3 px-6 py-3 text-sm"
            >
              <div class="min-w-0 flex-1">
                <div class="font-medium">{{ inv.description }}</div>
                <div class="text-muted-foreground text-xs">{{ inv.number }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold">{{ rp(inv.amount) }}</div>
                <div :class="['text-xs font-medium', statusColor[inv.status] ?? '']">
                  {{ inv.status }}
                </div>
              </div>
              <a
                v-if="inv.status === 'pending' && inv.checkoutUrl"
                :href="inv.checkoutUrl"
                class="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {{ t('billing.pay_now') }}
              </a>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
