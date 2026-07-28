<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'
import AnalyticsBarChart from '~/components/AnalyticsBarChart.vue'

type Tab = 'general' | 'agents' | 'ai' | 'sla' | 'contacts'

interface Overview {
  messagesIn: number
  messagesOut: number
  aiMessages: number
  activeConversations: number
  totalConversations: number
  conversationsInPeriod: number
  totalContacts: number
  newContacts: number
  avgFirstResponseMinutes: number | null
  daily: { date: string; inbound: number; outbound: number }[]
}
interface AgentsReport {
  agents: {
    id: string
    name: string | null
    messagesSent: number
    conversationsAssigned: number
    lastActiveAt: string | null
  }[]
}
interface AiReport {
  replyCount: number
  creditsUsed: number
  costUsd: number
  daily: { date: string; replies: number; credits: number }[]
  byModel: { model: string; replies: number; credits: number }[]
}
interface SlaReport {
  targetMinutes: number
  avgFirstResponseMinutes: number | null
  respondedConversations: number
  compliantConversations: number
  compliancePct: number
  csat: { available: boolean; score: number | null; responses: number }
}
interface ContactsReport {
  total: number
  blocked: number
  newContacts: number
  byChannel: { id: string; name: string; type: string; contacts: number }[]
  daily: { date: string; added: number }[]
}

const PRIMARY = '#6366f1'
const GREEN = '#22c55e'
const AMBER = '#f59e0b'

const tab = ref<Tab>('general')
const days = ref(30)
const loading = ref(true)

const overview = ref<Overview | null>(null)
const agents = ref<AgentsReport | null>(null)
const ai = ref<AiReport | null>(null)
const sla = ref<SlaReport | null>(null)
const contacts = ref<ContactsReport | null>(null)
const loadedTabs = reactive<Record<Tab, boolean>>({
  general: false,
  agents: false,
  ai: false,
  sla: false,
  contacts: false,
})

async function loadTab(t: Tab, force = false) {
  if (loadedTabs[t] && !force) return
  loading.value = true
  try {
    const q = `?days=${days.value}`
    if (t === 'general') overview.value = await api.get<Overview>(`/app/analytics/overview${q}`)
    else if (t === 'agents') agents.value = await api.get<AgentsReport>(`/app/analytics/agents${q}`)
    else if (t === 'ai') ai.value = await api.get<AiReport>(`/app/analytics/ai${q}`)
    else if (t === 'sla') sla.value = await api.get<SlaReport>(`/app/analytics/sla${q}`)
    else if (t === 'contacts')
      contacts.value = await api.get<ContactsReport>(`/app/analytics/contacts${q}`)
    loadedTabs[t] = true
  } finally {
    loading.value = false
  }
}

function switchTab(t: Tab) {
  tab.value = t
  loadTab(t)
}

watch(days, () => {
  // Reload the active tab and mark others stale.
  ;(Object.keys(loadedTabs) as Tab[]).forEach((k) => (loadedTabs[k] = false))
  loadTab(tab.value, true)
})

function fmt(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toLocaleString('id-ID')
}
function minutes(n: number | null): string {
  if (n === null) return '—'
  return n < 60 ? `${n} min` : `${Math.floor(n / 60)}h ${Math.round(n % 60)}m`
}

onMounted(() => loadTab('general'))

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: 'lucide:bar-chart-3' },
  { key: 'agents', label: 'Agent performance', icon: 'lucide:users' },
  { key: 'ai', label: 'AI report', icon: 'lucide:bot' },
  { key: 'sla', label: 'SLA & CSAT', icon: 'lucide:gauge' },
  { key: 'contacts', label: 'Contacts', icon: 'lucide:contact' },
]
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/app/settings" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">Analytics</h1>
        <div class="ml-auto flex items-center gap-2">
          <select v-model.number="days" class="bg-background rounded-lg border px-2 py-1 text-sm">
            <option :value="7">Last 7 days</option>
            <option :value="30">Last 30 days</option>
            <option :value="90">Last 90 days</option>
          </select>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-6">
      <!-- Tabs -->
      <div class="mb-6 flex flex-wrap gap-1 border-b">
        <button
          v-for="t in TABS"
          :key="t.key"
          :class="[
            '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium',
            tab === t.key
              ? 'border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          ]"
          @click="switchTab(t.key)"
        >
          <Icon :icon="t.icon" class="size-4" />
          {{ t.label }}
        </button>
      </div>

      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <!-- GENERAL -->
        <div v-if="tab === 'general' && overview" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Messages in</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.messagesIn) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Messages out</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.messagesOut) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">New contacts</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.newContacts) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Avg first response</div>
              <div class="mt-1 text-2xl font-bold">
                {{ minutes(overview.avgFirstResponseMinutes) }}
              </div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Active conversations</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.activeConversations) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Total conversations</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.totalConversations) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">AI replies</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.aiMessages) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Total contacts</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(overview.totalContacts) }}</div>
            </div>
          </div>

          <div class="bg-card rounded-2xl border p-5">
            <h3 class="mb-4 font-medium">Message volume</h3>
            <AnalyticsBarChart
              :data="
                overview.daily.map((d) => ({ label: d.date, values: [d.inbound, d.outbound] }))
              "
              :series="[
                { name: 'Inbound', color: PRIMARY },
                { name: 'Outbound', color: GREEN },
              ]"
            />
          </div>
        </div>

        <!-- AGENTS -->
        <div v-else-if="tab === 'agents' && agents" class="space-y-4">
          <div
            v-if="!agents.agents.length"
            class="text-muted-foreground rounded-2xl border py-12 text-center text-sm"
          >
            No agent activity yet.
          </div>
          <div v-else class="bg-card overflow-hidden rounded-2xl border">
            <table class="w-full text-sm">
              <thead class="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th class="px-4 py-2 font-medium">Agent</th>
                  <th class="px-4 py-2 text-right font-medium">Messages sent</th>
                  <th class="px-4 py-2 text-right font-medium">Conversations</th>
                  <th class="px-4 py-2 text-right font-medium">Last active</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="a in agents.agents" :key="a.id">
                  <td class="px-4 py-2.5 font-medium">{{ a.name ?? '—' }}</td>
                  <td class="px-4 py-2.5 text-right">{{ fmt(a.messagesSent) }}</td>
                  <td class="px-4 py-2.5 text-right">{{ fmt(a.conversationsAssigned) }}</td>
                  <td class="text-muted-foreground px-4 py-2.5 text-right">
                    {{
                      a.lastActiveAt ? new Date(a.lastActiveAt).toLocaleDateString('id-ID') : '—'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- AI -->
        <div v-else-if="tab === 'ai' && ai" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">AI replies (billed)</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(ai.replyCount) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Credits used</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(ai.creditsUsed) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Est. cost (USD)</div>
              <div class="mt-1 text-2xl font-bold">${{ ai.costUsd.toFixed(2) }}</div>
            </div>
          </div>

          <div class="bg-card rounded-2xl border p-5">
            <h3 class="mb-4 font-medium">AI replies &amp; credits per day</h3>
            <AnalyticsBarChart
              :data="ai.daily.map((d) => ({ label: d.date, values: [d.replies, d.credits] }))"
              :series="[
                { name: 'Replies', color: PRIMARY },
                { name: 'Credits', color: AMBER },
              ]"
            />
          </div>

          <div v-if="ai.byModel.length" class="bg-card overflow-hidden rounded-2xl border">
            <table class="w-full text-sm">
              <thead class="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th class="px-4 py-2 font-medium">Model</th>
                  <th class="px-4 py-2 text-right font-medium">Replies</th>
                  <th class="px-4 py-2 text-right font-medium">Credits</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="m in ai.byModel" :key="m.model">
                  <td class="px-4 py-2.5 font-mono text-xs">{{ m.model }}</td>
                  <td class="px-4 py-2.5 text-right">{{ fmt(m.replies) }}</td>
                  <td class="px-4 py-2.5 text-right">{{ fmt(m.credits) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SLA & CSAT -->
        <div v-else-if="tab === 'sla' && sla" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Avg first response</div>
              <div class="mt-1 text-2xl font-bold">{{ minutes(sla.avgFirstResponseMinutes) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">
                SLA compliance (&lt; {{ sla.targetMinutes }} min)
              </div>
              <div class="mt-1 text-2xl font-bold">{{ sla.compliancePct }}%</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Responded conversations</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(sla.respondedConversations) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Within target</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(sla.compliantConversations) }}</div>
            </div>
          </div>

          <div class="bg-card rounded-2xl border p-5">
            <h3 class="font-medium">CSAT (customer satisfaction)</h3>
            <div
              v-if="!sla.csat.available"
              class="text-muted-foreground mt-3 rounded-lg border border-dashed p-4 text-sm"
            >
              <Icon icon="lucide:info" class="mr-1 inline size-4" />
              CSAT needs a post-conversation rating survey, which isn't collected yet. Enable
              satisfaction surveys to populate this metric.
            </div>
            <div v-else class="mt-2 text-2xl font-bold">
              {{ sla.csat.score }} <span class="text-muted-foreground text-sm">/ 5</span>
            </div>
          </div>
        </div>

        <!-- CONTACTS -->
        <div v-else-if="tab === 'contacts' && contacts" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Total contacts</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(contacts.total) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">New in period</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(contacts.newContacts) }}</div>
            </div>
            <div class="bg-card rounded-2xl border p-4">
              <div class="text-muted-foreground text-xs">Blocked</div>
              <div class="mt-1 text-2xl font-bold">{{ fmt(contacts.blocked) }}</div>
            </div>
          </div>

          <div class="bg-card rounded-2xl border p-5">
            <h3 class="mb-4 font-medium">New contacts per day</h3>
            <AnalyticsBarChart
              :data="contacts.daily.map((d) => ({ label: d.date, values: [d.added] }))"
              :series="[{ name: 'New contacts', color: PRIMARY }]"
            />
          </div>

          <div v-if="contacts.byChannel.length" class="bg-card overflow-hidden rounded-2xl border">
            <table class="w-full text-sm">
              <thead class="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th class="px-4 py-2 font-medium">Channel</th>
                  <th class="px-4 py-2 font-medium">Type</th>
                  <th class="px-4 py-2 text-right font-medium">Contacts</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="c in contacts.byChannel" :key="c.id">
                  <td class="px-4 py-2.5 font-medium">{{ c.name }}</td>
                  <td class="text-muted-foreground px-4 py-2.5">{{ c.type }}</td>
                  <td class="px-4 py-2.5 text-right">{{ fmt(c.contacts) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
