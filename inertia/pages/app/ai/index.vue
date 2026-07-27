<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

interface ModelInfo {
  id: string
  label: string
  provider: 'claude' | 'openai'
}
interface Persona {
  agentName?: string
  soul?: string
  styleTone?: string
  gender?: 'male' | 'female' | 'neutral'
  characterStyle?: string
  greeting?: string
}
interface Safety {
  avoidTopics?: string[]
  onSensitive?: 'handoff' | 'disclaimer'
  escalationMessage?: string
}
interface Agent {
  id: string
  name: string
  provider: 'claude' | 'openai'
  model: string
  systemPrompt: string
  temperature: number | null
  maxTokens: number
  autoReplyEnabled: boolean
  isActive: boolean
  workingHours: WorkingHours | null
  persona: Persona | null
  safety: Safety | null
  guardrails: string[] | null
}
interface Playbook {
  id: string
  aiAgentId: string
  name: string
  keywords: string[]
  instruction: string
  assetIds: string[]
  priority: number
  isActive: boolean
}
interface Asset {
  id: string
  aiAgentId: string
  name: string
  type: string
  description: string | null
  url: string | null
}
interface WorkingHours {
  enabled: boolean
  timezone: string
  schedule: Record<string, [string, string][]>
  outsideAction: 'silent' | 'reply'
  outsideMessage?: string
}
interface Knowledge {
  id: string
  aiAgentId: string
  title: string
  content: string
  embedded?: boolean
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
type DayRow = { key: string; enabled: boolean; start: string; end: string }

const loading = ref(true)
const saving = ref(false)
const agents = ref<Agent[]>([])
const models = ref<ModelInfo[]>([])
const configured = ref<Record<string, boolean>>({ claude: false, openai: false })
const balance = ref(0)
const editingId = ref<string | null>(null)
const showForm = ref(false)

const knowledge = ref<Knowledge[]>([])
const newKnowledge = reactive({ title: '', content: '' })
const playbooks = ref<Playbook[]>([])
const assets = ref<Asset[]>([])
const section = ref<'basics' | 'identity' | 'safety' | 'playbooks' | 'assets' | 'knowledge'>(
  'basics'
)

const form = reactive({
  name: '',
  provider: 'claude' as 'claude' | 'openai',
  model: '',
  systemPrompt: '',
  temperature: null as number | null,
  maxTokens: 1024,
  autoReplyEnabled: true,
  isActive: true,
  whEnabled: false,
  timezone: 'Asia/Jakarta',
  outsideAction: 'silent' as 'silent' | 'reply',
  outsideMessage: '',
  days: DAYS.map((d) => ({ key: d, enabled: false, start: '09:00', end: '17:00' })) as DayRow[],
  // Identity / persona
  agentName: '',
  soul: '',
  styleTone: '',
  gender: '' as '' | 'male' | 'female' | 'neutral',
  characterStyle: '',
  greeting: '',
  // Safety + guardrails
  avoidTopics: '',
  onSensitive: 'handoff' as 'handoff' | 'disclaimer',
  escalationMessage: '',
  guardrailsText: '',
})

const modelsForProvider = computed(() => models.value.filter((m) => m.provider === form.provider))

async function load() {
  loading.value = true
  const [a, m, c] = await Promise.all([
    api.get<Agent[]>('/app/ai/agents').catch(() => []),
    api
      .get<{ models: ModelInfo[]; configured: Record<string, boolean> }>('/app/ai/models')
      .catch(() => ({ models: [], configured: {} })),
    api.get<{ balance: number }>('/app/ai/credits').catch(() => ({ balance: 0 })),
  ])
  agents.value = a ?? []
  models.value = m?.models ?? []
  configured.value = m?.configured ?? {}
  balance.value = c?.balance ?? 0
  loading.value = false
}

function resetForm() {
  form.name = ''
  form.provider = 'claude'
  form.model = ''
  form.systemPrompt = 'You are a helpful customer support assistant. Reply concisely and politely.'
  form.temperature = null
  form.maxTokens = 1024
  form.autoReplyEnabled = true
  form.isActive = true
  form.whEnabled = false
  form.timezone = 'Asia/Jakarta'
  form.outsideAction = 'silent'
  form.outsideMessage = ''
  form.days = DAYS.map((d) => ({ key: d, enabled: false, start: '09:00', end: '17:00' }))
  form.agentName = ''
  form.soul = ''
  form.styleTone = ''
  form.gender = ''
  form.characterStyle = ''
  form.greeting = ''
  form.avoidTopics = ''
  form.onSensitive = 'handoff'
  form.escalationMessage = ''
  form.guardrailsText = ''
}

function openCreate() {
  editingId.value = null
  knowledge.value = []
  playbooks.value = []
  assets.value = []
  section.value = 'basics'
  resetForm()
  showForm.value = true
}

function openEdit(agent: Agent) {
  editingId.value = agent.id
  form.name = agent.name
  form.provider = agent.provider
  form.model = agent.model
  form.systemPrompt = agent.systemPrompt
  form.temperature = agent.temperature
  form.maxTokens = agent.maxTokens
  form.autoReplyEnabled = agent.autoReplyEnabled
  form.isActive = agent.isActive
  const wh = agent.workingHours
  form.whEnabled = wh?.enabled ?? false
  form.timezone = wh?.timezone ?? 'Asia/Jakarta'
  form.outsideAction = wh?.outsideAction ?? 'silent'
  form.outsideMessage = wh?.outsideMessage ?? ''
  form.days = DAYS.map((d) => {
    const range = wh?.schedule?.[d]?.[0]
    return {
      key: d,
      enabled: Boolean(range),
      start: range?.[0] ?? '09:00',
      end: range?.[1] ?? '17:00',
    }
  })
  const p = agent.persona
  form.agentName = p?.agentName ?? ''
  form.soul = p?.soul ?? ''
  form.styleTone = p?.styleTone ?? ''
  form.gender = p?.gender ?? ''
  form.characterStyle = p?.characterStyle ?? ''
  form.greeting = p?.greeting ?? ''
  const s = agent.safety
  form.avoidTopics = (s?.avoidTopics ?? []).join(', ')
  form.onSensitive = s?.onSensitive ?? 'handoff'
  form.escalationMessage = s?.escalationMessage ?? ''
  form.guardrailsText = (agent.guardrails ?? []).join('\n')
  section.value = 'basics'
  showForm.value = true
  loadKnowledge(agent.id)
  loadPlaybooks(agent.id)
  loadAssets(agent.id)
}

function buildPayload() {
  const schedule: Record<string, [string, string][]> = {}
  for (const day of form.days) {
    schedule[day.key] = day.enabled ? [[day.start, day.end]] : []
  }
  const avoidTopics = form.avoidTopics
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const guardrails = form.guardrailsText
    .split('\n')
    .map((g) => g.trim())
    .filter(Boolean)
  const persona = {
    agentName: form.agentName.trim() || undefined,
    soul: form.soul.trim() || undefined,
    styleTone: form.styleTone.trim() || undefined,
    gender: form.gender || undefined,
    characterStyle: form.characterStyle.trim() || undefined,
    greeting: form.greeting.trim() || undefined,
  }
  const hasPersona = Object.values(persona).some((v) => v !== undefined)
  return {
    name: form.name,
    provider: form.provider,
    model: form.model,
    systemPrompt: form.systemPrompt,
    temperature: form.provider === 'openai' ? form.temperature : null,
    maxTokens: form.maxTokens,
    autoReplyEnabled: form.autoReplyEnabled,
    isActive: form.isActive,
    workingHours: form.whEnabled
      ? {
          enabled: true,
          timezone: form.timezone,
          schedule,
          outsideAction: form.outsideAction,
          outsideMessage: form.outsideMessage || undefined,
        }
      : null,
    persona: hasPersona ? persona : null,
    safety: avoidTopics.length
      ? {
          avoidTopics,
          onSensitive: form.onSensitive,
          escalationMessage: form.escalationMessage.trim() || undefined,
        }
      : null,
    guardrails: guardrails.length ? guardrails : null,
  }
}

async function save() {
  if (!form.name.trim() || !form.model || !form.systemPrompt.trim()) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await api.put(`/app/ai/agents/${editingId.value}`, payload)
    } else {
      await api.post('/app/ai/agents', payload)
    }
    showForm.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function remove(agent: Agent) {
  if (!confirm(`Delete agent "${agent.name}"?`)) return
  await api.del(`/app/ai/agents/${agent.id}`)
  await load()
}

async function loadKnowledge(agentId: string) {
  knowledge.value = await api
    .get<Knowledge[]>(`/app/ai/knowledge?agentId=${agentId}`)
    .catch(() => [])
}

async function addKnowledge() {
  if (!editingId.value || !newKnowledge.title.trim() || !newKnowledge.content.trim()) return
  await api.post('/app/ai/knowledge', {
    aiAgentId: editingId.value,
    title: newKnowledge.title,
    content: newKnowledge.content,
  })
  newKnowledge.title = ''
  newKnowledge.content = ''
  await loadKnowledge(editingId.value)
}

async function removeKnowledge(id: string) {
  await api.del(`/app/ai/knowledge/${id}`)
  if (editingId.value) await loadKnowledge(editingId.value)
}

// ── Playbooks (keyword-triggered sales scripts) ──────────────────────────────
const newPlaybook = reactive({
  name: '',
  keywords: '',
  instruction: '',
  priority: 0,
  assetIds: [] as string[],
})

async function loadPlaybooks(agentId: string) {
  playbooks.value = await api
    .get<Playbook[]>(`/app/ai/playbooks?agentId=${agentId}`)
    .catch(() => [])
}

async function addPlaybook() {
  if (!editingId.value || !newPlaybook.name.trim() || !newPlaybook.instruction.trim()) return
  const keywords = newPlaybook.keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  await api.post('/app/ai/playbooks', {
    aiAgentId: editingId.value,
    name: newPlaybook.name,
    keywords,
    instruction: newPlaybook.instruction,
    assetIds: newPlaybook.assetIds,
    priority: newPlaybook.priority,
    isActive: true,
  })
  newPlaybook.name = ''
  newPlaybook.keywords = ''
  newPlaybook.instruction = ''
  newPlaybook.priority = 0
  newPlaybook.assetIds = []
  await loadPlaybooks(editingId.value)
}

async function togglePlaybook(pb: Playbook) {
  await api.put(`/app/ai/playbooks/${pb.id}`, { isActive: !pb.isActive })
  if (editingId.value) await loadPlaybooks(editingId.value)
}

async function removePlaybook(id: string) {
  await api.del(`/app/ai/playbooks/${id}`)
  if (editingId.value) await loadPlaybooks(editingId.value)
}

function assetName(id: string): string {
  return assets.value.find((a) => a.id === id)?.name ?? id
}

// ── Assets (product photos, testimonials, videos) ────────────────────────────
const newAsset = reactive({ name: '', description: '' })
const assetFile = ref<File | null>(null)
const uploading = ref(false)

async function loadAssets(agentId: string) {
  assets.value = await api.get<Asset[]>(`/app/ai/assets?agentId=${agentId}`).catch(() => [])
}

function onAssetFile(e: Event) {
  const files = (e.target as HTMLInputElement).files
  assetFile.value = files && files.length ? files[0] : null
}

async function uploadAsset() {
  if (!editingId.value || !assetFile.value || !newAsset.name.trim()) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('aiAgentId', editingId.value)
    fd.append('name', newAsset.name)
    if (newAsset.description.trim()) fd.append('description', newAsset.description)
    fd.append('file', assetFile.value)
    const res = await fetch('/app/ai/assets', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-XSRF-TOKEN': readXsrfToken(), 'Accept': 'application/json' },
      body: fd,
    })
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)
    newAsset.name = ''
    newAsset.description = ''
    assetFile.value = null
    await loadAssets(editingId.value)
  } finally {
    uploading.value = false
  }
}

async function removeAsset(id: string) {
  await api.del(`/app/ai/assets/${id}`)
  if (editingId.value) await loadAssets(editingId.value)
}

function readXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/app/settings" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">AI Agents</h1>
        <span
          class="bg-primary/10 text-primary ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {{ balance.toLocaleString('id-ID') }} credits
        </span>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-8">
      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <div
          v-if="!configured.claude && !configured.openai"
          class="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable replies.
        </div>

        <!-- List -->
        <div v-if="!showForm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Your agents</h2>
            <button
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
              @click="openCreate"
            >
              + New agent
            </button>
          </div>
          <div
            v-if="!agents.length"
            class="text-muted-foreground rounded-2xl border py-12 text-center text-sm"
          >
            No AI agents yet. Create one to enable auto-reply.
          </div>
          <div v-else class="grid gap-3 sm:grid-cols-2">
            <div v-for="agent in agents" :key="agent.id" class="bg-card rounded-2xl border p-5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate font-semibold">{{ agent.name }}</div>
                  <div class="text-muted-foreground text-xs">{{ agent.model }}</div>
                </div>
                <div class="flex shrink-0 gap-1">
                  <button
                    class="hover:bg-muted rounded-lg p-1.5"
                    title="Edit"
                    @click="openEdit(agent)"
                  >
                    <Icon icon="lucide:pencil" class="size-4" />
                  </button>
                  <button
                    class="hover:bg-muted rounded-lg p-1.5 text-red-600"
                    title="Delete"
                    @click="remove(agent)"
                  >
                    <Icon icon="lucide:trash-2" class="size-4" />
                  </button>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <span
                  :class="[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    agent.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-muted text-muted-foreground',
                  ]"
                >
                  {{ agent.isActive ? 'Active' : 'Inactive' }}
                </span>
                <span
                  v-if="agent.autoReplyEnabled"
                  class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  Auto-reply
                </span>
                <span
                  v-if="agent.workingHours?.enabled"
                  class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  Working hours
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div v-else class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">{{ editingId ? 'Edit agent' : 'New agent' }}</h2>
            <button
              class="text-muted-foreground hover:text-foreground text-sm"
              @click="showForm = false"
            >
              Cancel
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex flex-wrap gap-1 border-b">
            <button
              v-for="tab in [
                { key: 'basics', label: 'Basics', always: true },
                { key: 'identity', label: 'Identity', always: true },
                { key: 'safety', label: 'Safety & guardrails', always: true },
                { key: 'playbooks', label: 'Playbooks', always: false },
                { key: 'assets', label: 'Assets', always: false },
                { key: 'knowledge', label: 'Knowledge', always: false },
              ]"
              v-show="tab.always || editingId"
              :key="tab.key"
              type="button"
              :class="[
                '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
                section === tab.key
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              ]"
              @click="section = tab.key as typeof section"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-show="section === 'basics'" class="bg-card space-y-4 rounded-2xl border p-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-medium">Name</span>
                <input
                  v-model="form.name"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label class="block">
                <span class="text-sm font-medium">Provider</span>
                <select
                  v-model="form.provider"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Model</span>
                <select
                  v-model="form.model"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="" disabled>Select a model</option>
                  <option v-for="m in modelsForProvider" :key="m.id" :value="m.id">
                    {{ m.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Max tokens</span>
                <input
                  v-model.number="form.maxTokens"
                  type="number"
                  min="64"
                  max="8192"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label v-if="form.provider === 'openai'" class="block">
                <span class="text-sm font-medium">Temperature (0–2)</span>
                <input
                  v-model.number="form.temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label class="block">
              <span class="text-sm font-medium">System prompt</span>
              <textarea
                v-model="form.systemPrompt"
                rows="4"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.autoReplyEnabled" type="checkbox" class="size-4" /> Auto-reply
                enabled
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.isActive" type="checkbox" class="size-4" /> Active
              </label>
            </div>
          </div>

          <!-- Working hours (part of Basics) -->
          <div v-show="section === 'basics'" class="bg-card space-y-4 rounded-2xl border p-6">
            <label class="flex items-center gap-2 font-medium">
              <input v-model="form.whEnabled" type="checkbox" class="size-4" /> Working hours
            </label>
            <template v-if="form.whEnabled">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block">
                  <span class="text-sm font-medium">Timezone</span>
                  <input
                    v-model="form.timezone"
                    class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <label class="block">
                  <span class="text-sm font-medium">Outside hours</span>
                  <select
                    v-model="form.outsideAction"
                    class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="silent">Stay silent</option>
                    <option value="reply">Send a canned message</option>
                  </select>
                </label>
              </div>
              <label v-if="form.outsideAction === 'reply'" class="block">
                <span class="text-sm font-medium">Outside-hours message</span>
                <textarea
                  v-model="form.outsideMessage"
                  rows="2"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <div class="space-y-2">
                <div
                  v-for="day in form.days"
                  :key="day.key"
                  class="flex items-center gap-3 text-sm"
                >
                  <label class="flex w-28 items-center gap-2 capitalize">
                    <input v-model="day.enabled" type="checkbox" class="size-4" /> {{ day.key }}
                  </label>
                  <template v-if="day.enabled">
                    <input
                      v-model="day.start"
                      type="time"
                      class="bg-background rounded-lg border px-2 py-1"
                    />
                    <span class="text-muted-foreground">–</span>
                    <input
                      v-model="day.end"
                      type="time"
                      class="bg-background rounded-lg border px-2 py-1"
                    />
                  </template>
                  <span v-else class="text-muted-foreground">Closed</span>
                </div>
              </div>
            </template>
          </div>

          <!-- Identity / persona -->
          <div v-show="section === 'identity'" class="bg-card space-y-4 rounded-2xl border p-6">
            <div>
              <h3 class="font-medium">Identity & persona</h3>
              <p class="text-muted-foreground text-sm">
                Give the agent a name, character and voice — like a virtual sales rep. This is
                injected at the top of the system prompt.
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-medium">Agent name</span>
                <input
                  v-model="form.agentName"
                  placeholder="e.g. Sinta"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
                <span class="text-muted-foreground text-xs">How the agent introduces itself.</span>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Gender / voice</span>
                <select
                  v-model="form.gender"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Not specified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
            </div>
            <label class="block">
              <span class="text-sm font-medium">Soul / backstory</span>
              <textarea
                v-model="form.soul"
                rows="2"
                placeholder="e.g. A warm, upbeat sales rep who genuinely loves our products and wants to help."
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">Style & tone</span>
              <textarea
                v-model="form.styleTone"
                rows="2"
                placeholder='e.g. Friendly and casual. Use "Kak". Short sentences, a few emojis 😊.'
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">Character style</span>
              <textarea
                v-model="form.characterStyle"
                rows="2"
                placeholder="Full voice description à la ElevenLabs — energy, pacing, quirks, catchphrases."
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">Greeting / opener</span>
              <input
                v-model="form.greeting"
                placeholder="e.g. Halo Kak! 👋 Ada yang bisa Sinta bantu hari ini?"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <!-- Safety & guardrails -->
          <div v-show="section === 'safety'" class="bg-card space-y-4 rounded-2xl border p-6">
            <div>
              <h3 class="font-medium">Safety & guardrails</h3>
              <p class="text-muted-foreground text-sm">
                Keep the agent on-brand and safe. Sensitive topics can hand off to a human.
              </p>
            </div>
            <label class="block">
              <span class="text-sm font-medium">Sensitive / avoid topics</span>
              <input
                v-model="form.avoidTopics"
                placeholder="refund, medical claims, legal, complaint (comma-separated)"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <span class="text-muted-foreground text-xs">
                When a customer message mentions one of these, the rule below applies.
              </span>
            </label>
            <label class="block">
              <span class="text-sm font-medium">On a sensitive topic</span>
              <select
                v-model="form.onSensitive"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="handoff">Escalate to a human agent (stop replying)</option>
                <option value="disclaimer">Give a brief safe disclaimer and continue</option>
              </select>
            </label>
            <label v-if="form.onSensitive === 'handoff'" class="block">
              <span class="text-sm font-medium">Escalation message</span>
              <textarea
                v-model="form.escalationMessage"
                rows="2"
                placeholder="e.g. Untuk hal ini, tim kami akan segera membantu Kakak ya 🙏"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <span class="text-muted-foreground text-xs">
                Sent once, then the bot stays silent so a human can take over.
              </span>
            </label>
            <label class="block">
              <span class="text-sm font-medium">Guardrails (one per line)</span>
              <textarea
                v-model="form.guardrailsText"
                rows="4"
                placeholder="Never promise same-day delivery.&#10;Do not quote prices below the catalog.&#10;Never share personal opinions on politics."
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <!-- Playbooks (existing agents) -->
          <div
            v-show="section === 'playbooks' && editingId"
            class="bg-card space-y-4 rounded-2xl border p-6"
          >
            <div>
              <h3 class="font-medium">Training playbooks</h3>
              <p class="text-muted-foreground text-sm">
                Keyword-triggered scripts. When a customer message matches a keyword, the
                instruction is injected and any linked assets are sent. Higher priority wins.
              </p>
            </div>
            <div v-if="!playbooks.length" class="text-muted-foreground text-sm">
              No playbooks yet.
            </div>
            <ul v-else class="divide-y">
              <li v-for="pb in playbooks" :key="pb.id" class="py-3">
                <div class="flex items-start gap-2">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ pb.name }}</span>
                      <span
                        class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                        title="Priority"
                      >
                        p{{ pb.priority }}
                      </span>
                      <span
                        v-if="!pb.isActive"
                        class="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      >
                        inactive
                      </span>
                    </div>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <span
                        v-for="kw in pb.keywords"
                        :key="kw"
                        class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                      >
                        {{ kw }}
                      </span>
                    </div>
                    <p class="text-muted-foreground mt-1 text-sm">{{ pb.instruction }}</p>
                    <div
                      v-if="pb.assetIds.length"
                      class="text-muted-foreground mt-1 flex flex-wrap gap-1 text-xs"
                    >
                      <Icon icon="lucide:paperclip" class="size-3.5" />
                      <span v-for="aid in pb.assetIds" :key="aid">{{ assetName(aid) }}</span>
                    </div>
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button
                      class="hover:bg-muted rounded p-1 text-xs"
                      :title="pb.isActive ? 'Disable' : 'Enable'"
                      @click="togglePlaybook(pb)"
                    >
                      <Icon
                        :icon="pb.isActive ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                        class="size-5"
                      />
                    </button>
                    <button
                      class="hover:bg-muted rounded p-1 text-red-600"
                      @click="removePlaybook(pb.id)"
                    >
                      <Icon icon="lucide:x" class="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            </ul>
            <div class="space-y-2 border-t pt-4">
              <div class="grid gap-2 sm:grid-cols-2">
                <input
                  v-model="newPlaybook.name"
                  placeholder="Name (e.g. Social proof)"
                  class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  v-model.number="newPlaybook.priority"
                  type="number"
                  placeholder="Priority (0)"
                  class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <input
                v-model="newPlaybook.keywords"
                placeholder="Keywords: testimoni, bukti, review (comma-separated)"
                class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                v-model="newPlaybook.instruction"
                rows="2"
                placeholder="What the agent should do — e.g. Share a customer testimonial and the before/after photo, then ask for the order."
                class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
              <div v-if="assets.length">
                <span class="text-sm font-medium">Attach assets</span>
                <div class="mt-1 flex flex-wrap gap-2">
                  <label
                    v-for="a in assets"
                    :key="a.id"
                    class="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs"
                  >
                    <input
                      v-model="newPlaybook.assetIds"
                      type="checkbox"
                      :value="a.id"
                      class="size-3.5"
                    />
                    {{ a.name }}
                  </label>
                </div>
              </div>
              <button
                class="hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold"
                @click="addPlaybook"
              >
                Add playbook
              </button>
            </div>
          </div>

          <!-- Assets (existing agents) -->
          <div
            v-show="section === 'assets' && editingId"
            class="bg-card space-y-4 rounded-2xl border p-6"
          >
            <div>
              <h3 class="font-medium">Assets library</h3>
              <p class="text-muted-foreground text-sm">
                Product photos, testimonials and videos the agent can send. Link them to a playbook
                so they go out automatically.
              </p>
            </div>
            <div v-if="!assets.length" class="text-muted-foreground text-sm">No assets yet.</div>
            <div v-else class="grid gap-3 sm:grid-cols-3">
              <div v-for="a in assets" :key="a.id" class="rounded-xl border p-2">
                <div class="bg-muted relative mb-2 aspect-video overflow-hidden rounded-lg">
                  <img
                    v-if="a.type === 'image' && a.url"
                    :src="a.url"
                    :alt="a.name"
                    class="size-full object-cover"
                  />
                  <div
                    v-else
                    class="text-muted-foreground flex size-full items-center justify-center"
                  >
                    <Icon
                      :icon="
                        a.type === 'video'
                          ? 'lucide:video'
                          : a.type === 'document'
                            ? 'lucide:file-text'
                            : 'lucide:image'
                      "
                      class="size-8"
                    />
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ a.name }}</span>
                  <button
                    class="hover:bg-muted rounded p-1 text-red-600"
                    @click="removeAsset(a.id)"
                  >
                    <Icon icon="lucide:trash-2" class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div class="space-y-2 border-t pt-4">
              <div class="grid gap-2 sm:grid-cols-2">
                <input
                  v-model="newAsset.name"
                  placeholder="Asset name"
                  class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  v-model="newAsset.description"
                  placeholder="Description (optional)"
                  class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.pdf"
                class="text-sm"
                @change="onAssetFile"
              />
              <button
                class="hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                :disabled="uploading"
                @click="uploadAsset"
              >
                {{ uploading ? 'Uploading…' : 'Upload asset' }}
              </button>
            </div>
          </div>

          <!-- Knowledge base (existing agents) -->
          <div
            v-show="section === 'knowledge' && editingId"
            class="bg-card space-y-4 rounded-2xl border p-6"
          >
            <h3 class="font-medium">Knowledge base (RAG)</h3>
            <div v-if="!knowledge.length" class="text-muted-foreground text-sm">
              No knowledge entries yet.
            </div>
            <ul v-else class="divide-y">
              <li v-for="k in knowledge" :key="k.id" class="flex items-center gap-2 py-2 text-sm">
                <Icon icon="lucide:file-text" class="text-muted-foreground size-4 shrink-0" />
                <span class="flex-1 truncate">{{ k.title }}</span>
                <span v-if="k.embedded === false" class="text-amber-600 text-xs">not embedded</span>
                <button
                  class="hover:bg-muted rounded p-1 text-red-600"
                  @click="removeKnowledge(k.id)"
                >
                  <Icon icon="lucide:x" class="size-4" />
                </button>
              </li>
            </ul>
            <div class="space-y-2 border-t pt-4">
              <input
                v-model="newKnowledge.title"
                placeholder="Title"
                class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                v-model="newKnowledge.content"
                rows="3"
                placeholder="Content the bot should know…"
                class="bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button
                class="hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold"
                @click="addKnowledge"
              >
                Add entry
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              class="hover:bg-muted rounded-lg border px-5 py-2.5 text-sm font-semibold"
              @click="showForm = false"
            >
              Cancel
            </button>
            <button
              class="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              :disabled="saving"
              @click="save"
            >
              {{ saving ? 'Saving…' : 'Save agent' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
