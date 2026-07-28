<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'
import { uploadFile, type UploadedMedia } from '~/composables/useUpload'

type FirstReplyType = 'text' | 'image' | 'video' | 'document' | 'hybrid'
interface FrMediaItem {
  key: string
  type: 'image' | 'video' | 'document'
  name?: string | null
  size?: number | null
  url?: string | null
}
interface FirstReplyConfig {
  enabled: boolean
  contentType: FirstReplyType
  body?: string | null
  mediaItems?: FrMediaItem[]
}
interface Channel {
  id: string
  type: string
  name: string
  status: string
  wahaEngine: string | null
  externalId: string | null
  aiAgentId: string | null
  settings: { firstReply?: FirstReplyConfig } | null
}
interface AgentOption {
  id: string
  name: string
}

const CHANNEL_TYPES = [
  { value: 'webchat', label: 'Webchat (website)', icon: 'fluent-color:chat-multiple-24' },
  { value: 'whatsapp_waha', label: 'WhatsApp (WAHA)', icon: 'logos:whatsapp-icon' },
  { value: 'telegram', label: 'Telegram', icon: 'logos:telegram' },
  { value: 'messenger', label: 'Messenger', icon: 'logos:messenger' },
  { value: 'instagram', label: 'Instagram', icon: 'skill-icons:instagram' },
  {
    value: 'whatsapp_meta',
    label: 'WhatsApp Business (Meta)',
    icon: 'hugeicons:whatsapp-business',
  },
]

const loading = ref(true)
const channels = ref<Channel[]>([])
const agents = ref<AgentOption[]>([])
const expandedId = ref<string | null>(null)
const busy = ref(false)
const channelError = ref('')

const showCreate = ref(false)
const create = reactive({ name: '', type: 'webchat', wahaEngine: 'gows' })
const createError = ref('')

// Per-channel transient state.
const qr = ref<string | null>(null)
const embed = ref<string | null>(null)
const creds = reactive<Record<string, string>>({})
const credExternalId = ref('')
let statusTimer: ReturnType<typeof setInterval> | null = null

// First-reply (auto greeting for new contacts) editor for the expanded channel.
const fr = reactive({
  enabled: false,
  contentType: 'text' as FirstReplyType,
  body: '',
  mediaItems: [] as FrMediaItem[],
})
const frUploading = ref(false)
const frError = ref('')
const frSaved = ref(false)
const frAllowsBody = computed(() => fr.contentType === 'text' || fr.contentType === 'hybrid')
const frAllowsMedia = computed(() => fr.contentType !== 'text')
const frMaxFiles = computed(() => (fr.contentType === 'hybrid' ? 1 : 5))
const frAccept = computed(() => {
  switch (fr.contentType) {
    case 'image':
      return '.jpg,.jpeg,.png,.gif,.webp'
    case 'video':
      return '.mp4,.mov,.webm'
    case 'document':
      return '.pdf'
    case 'hybrid':
      return '.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.pdf'
    default:
      return ''
  }
})

function loadFirstReply(channel: Channel) {
  const cfg = channel.settings?.firstReply
  fr.enabled = cfg?.enabled ?? false
  fr.contentType = cfg?.contentType ?? 'text'
  fr.body = cfg?.body ?? ''
  fr.mediaItems = cfg?.mediaItems ? [...cfg.mediaItems] : []
  frError.value = ''
  frSaved.value = false
}

function onFrType() {
  if (fr.contentType === 'text') fr.mediaItems = []
  else if (fr.contentType !== 'hybrid')
    fr.mediaItems = fr.mediaItems.filter((m) => m.type === fr.contentType)
  if (fr.mediaItems.length > frMaxFiles.value)
    fr.mediaItems = fr.mediaItems.slice(0, frMaxFiles.value)
}

async function onFrFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  frError.value = ''
  frUploading.value = true
  try {
    for (const file of files) {
      if (fr.mediaItems.length >= frMaxFiles.value) break
      const up: UploadedMedia = await uploadFile(file)
      if (fr.contentType !== 'hybrid' && up.type !== fr.contentType) {
        frError.value = `"${up.name}" is not a ${fr.contentType} file.`
        continue
      }
      fr.mediaItems.push({ key: up.key, type: up.type, name: up.name, size: up.size, url: up.url })
    }
  } catch (err) {
    frError.value = (err as Error).message
  } finally {
    frUploading.value = false
  }
}

function removeFrMedia(i: number) {
  fr.mediaItems.splice(i, 1)
}

async function saveFirstReply(channel: Channel) {
  frError.value = ''
  if (fr.enabled) {
    if (
      frAllowsBody.value &&
      (fr.contentType === 'text' || fr.contentType === 'hybrid') &&
      !fr.body.trim()
    ) {
      frError.value = 'A message body is required for this type.'
      return
    }
    if (frAllowsMedia.value && !fr.mediaItems.length) {
      frError.value = 'Add at least one media file.'
      return
    }
  }
  busy.value = true
  try {
    const firstReply: FirstReplyConfig = {
      enabled: fr.enabled,
      contentType: fr.contentType,
      body: frAllowsBody.value ? fr.body : null,
      mediaItems: fr.mediaItems.map((m) => ({
        key: m.key,
        type: m.type,
        name: m.name,
        size: m.size,
      })),
    }
    await api.put(`/app/channels/${channel.id}`, { firstReply })
    channel.settings = { ...(channel.settings ?? {}), firstReply }
    frSaved.value = true
    setTimeout(() => (frSaved.value = false), 1500)
  } catch (err) {
    frError.value = (err as Error).message
  } finally {
    busy.value = false
  }
}

const typeMeta = (type: string) => CHANNEL_TYPES.find((c) => c.value === type)
const statusColor: Record<string, string> = {
  connected: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  connecting: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  disconnected: 'bg-muted text-muted-foreground',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

async function load() {
  loading.value = true
  const [ch, ag] = await Promise.all([
    api.get<Channel[]>('/app/channels/list').catch(() => []),
    api.get<AgentOption[]>('/app/ai/agents').catch(() => []),
  ])
  channels.value = ch ?? []
  agents.value = (ag ?? []).map((a) => ({ id: a.id, name: a.name }))
  loading.value = false
}

async function submitCreate() {
  if (!create.name.trim()) return
  createError.value = ''
  busy.value = true
  try {
    await api.post('/app/channels', {
      name: create.name,
      type: create.type,
      wahaEngine: create.type === 'whatsapp_waha' ? create.wahaEngine : undefined,
    })
    showCreate.value = false
    create.name = ''
    await load()
  } catch (e: any) {
    createError.value = e?.body?.message ?? 'Failed to create channel.'
  } finally {
    busy.value = false
  }
}

async function removeChannel(channel: Channel) {
  if (!confirm(`Delete channel "${channel.name}"?`)) return
  await api.del(`/app/channels/${channel.id}`)
  if (expandedId.value === channel.id) collapse()
  await load()
}

function collapse() {
  expandedId.value = null
  channelError.value = ''
  qr.value = null
  embed.value = null
  credExternalId.value = ''
  Object.keys(creds).forEach((k) => delete creds[k])
  if (statusTimer) clearInterval(statusTimer)
  statusTimer = null
}

async function expand(channel: Channel) {
  if (expandedId.value === channel.id) return collapse()
  collapse()
  expandedId.value = channel.id
  loadFirstReply(channel)
  if (channel.type === 'webchat') await loadEmbed(channel)
}

async function assignBot(channel: Channel, agentId: string) {
  await api.put(`/app/channels/${channel.id}`, { aiAgentId: agentId || null })
  channel.aiAgentId = agentId || null
}

// --- WAHA ------------------------------------------------------------------
async function connect(channel: Channel) {
  busy.value = true
  channelError.value = ''
  try {
    await api.post(`/app/channels/${channel.id}/connect`)
    await refreshQr(channel)
    startStatusPolling(channel)
  } catch (e) {
    channelError.value = wahaHint((e as Error).message)
  } finally {
    busy.value = false
  }
}

/** Turn a raw WAHA error into an actionable hint. */
function wahaHint(msg: string): string {
  if (msg.includes('401')) {
    return 'WAHA rejected the API key (401). Recreate the WAHA container so its WHATSAPP_API_KEY matches your .env: docker compose up -d --force-recreate waha-gows waha-noweb waha-webjs'
  }
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
    return 'Cannot reach the WAHA server. Is the container running? docker compose up -d waha-gows'
  }
  return msg
}

async function refreshQr(channel: Channel) {
  const res = await api.get<{ qr: string }>(`/app/channels/${channel.id}/qr`).catch(() => null)
  const raw = res?.qr ?? null
  qr.value = raw && !raw.startsWith('data:') ? `data:image/png;base64,${raw}` : raw
}

function startStatusPolling(channel: Channel) {
  if (statusTimer) clearInterval(statusTimer)
  statusTimer = setInterval(async () => {
    const res = await api
      .get<{ status: string }>(`/app/channels/${channel.id}/status`)
      .catch(() => null)
    if (res?.status) {
      channel.status = res.status
      if (res.status === 'connected') {
        qr.value = null
        if (statusTimer) clearInterval(statusTimer)
        statusTimer = null
      }
    }
  }, 3000)
}

async function disconnect(channel: Channel) {
  busy.value = true
  try {
    await api.post(`/app/channels/${channel.id}/disconnect`)
    channel.status = 'disconnected'
    qr.value = null
    if (statusTimer) clearInterval(statusTimer)
    statusTimer = null
  } finally {
    busy.value = false
  }
}

// --- Meta / Telegram -------------------------------------------------------
const credFields = (type: string): { key: string; label: string; needsExternalId?: boolean }[] => {
  if (type === 'telegram') return [{ key: 'botToken', label: 'Bot token' }]
  if (type === 'whatsapp_meta')
    return [{ key: 'accessToken', label: 'Access token', needsExternalId: true }]
  return [{ key: 'pageAccessToken', label: 'Page access token' }]
}

async function saveConfigure(channel: Channel) {
  busy.value = true
  channelError.value = ''
  try {
    const res = await api.put<{ status: string }>(`/app/channels/${channel.id}/configure`, {
      credentials: { ...creds },
      externalId: credExternalId.value || undefined,
    })
    if (res?.status) channel.status = res.status
    Object.keys(creds).forEach((k) => delete creds[k])
    credExternalId.value = ''
  } catch (e) {
    channelError.value = configureHint((e as Error).message, channel.type)
  } finally {
    busy.value = false
  }
}

/** Turn a raw provider error into an actionable hint. */
function configureHint(msg: string, type: string): string {
  if (type === 'telegram' && /HTTPS URL must be provided|bad webhook/i.test(msg)) {
    return 'Telegram needs a public HTTPS webhook URL and cannot reach http://localhost. Expose the app with an HTTPS tunnel (e.g. ngrok / cloudflared) and set WAHA_WEBHOOK_BASE_URL to that https URL, then try again.'
  }
  if (/401|invalid.*token|Unauthorized/i.test(msg)) {
    return 'The provider rejected the token. Double-check the credential you pasted.'
  }
  return msg
}

// --- Webchat ---------------------------------------------------------------
async function loadEmbed(channel: Channel) {
  const res = await api
    .get<{ snippet: string }>(`/app/channels/${channel.id}/webchat-embed`)
    .catch(() => null)
  embed.value = res?.snippet ?? null
}

const copied = ref(false)
async function copyEmbed() {
  if (!embed.value) return
  await navigator.clipboard.writeText(embed.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <Link href="/app/settings" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">Channels</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Your channels</h2>
          <button
            class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
            @click="showCreate = !showCreate"
          >
            + Add channel
          </button>
        </div>

        <!-- Create -->
        <div v-if="showCreate" class="bg-card mb-6 space-y-3 rounded-2xl border p-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">Name</span>
              <input
                v-model="create.name"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">Type</span>
              <select
                v-model="create.type"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option v-for="ct in CHANNEL_TYPES" :key="ct.value" :value="ct.value">
                  {{ ct.label }}
                </option>
              </select>
            </label>
            <label v-if="create.type === 'whatsapp_waha'" class="block">
              <span class="text-sm font-medium">Engine</span>
              <select
                v-model="create.wahaEngine"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="gows">GOWS</option>
                <option value="noweb">NOWEB</option>
                <option value="webjs">WEBJS</option>
              </select>
            </label>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          <div class="flex justify-end gap-2">
            <button
              class="hover:bg-muted rounded-lg border px-4 py-2 text-sm"
              @click="showCreate = false"
            >
              Cancel
            </button>
            <button
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              :disabled="busy"
              @click="submitCreate"
            >
              Create
            </button>
          </div>
        </div>

        <div
          v-if="!channels.length"
          class="text-muted-foreground rounded-2xl border py-12 text-center text-sm"
        >
          No channels yet. Add one to start receiving messages.
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
          <div v-for="channel in channels" :key="channel.id" class="bg-card rounded-2xl border">
            <div class="flex items-center gap-3 p-4">
              <div class="bg-muted flex size-10 items-center justify-center rounded-xl">
                <Icon :icon="typeMeta(channel.type)?.icon ?? 'lucide:radio'" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">{{ channel.name }}</div>
                <div class="text-muted-foreground text-xs">{{ typeMeta(channel.type)?.label }}</div>
              </div>
              <span
                :class="[
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusColor[channel.status] ?? '',
                ]"
              >
                {{ channel.status }}
              </span>
              <button class="hover:bg-muted rounded-lg p-2" @click="expand(channel)">
                <Icon
                  :icon="expandedId === channel.id ? 'lucide:chevron-up' : 'lucide:settings'"
                  class="size-4"
                />
              </button>
              <button
                class="hover:bg-muted rounded-lg p-2 text-red-600"
                @click="removeChannel(channel)"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </div>

            <!-- Expanded -->
            <div v-if="expandedId === channel.id" class="space-y-4 border-t p-4">
              <div
                v-if="channelError"
                class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              >
                {{ channelError }}
              </div>
              <!-- AI bot -->
              <label class="block max-w-sm">
                <span class="text-sm font-medium">AI bot (auto-reply)</span>
                <select
                  :value="channel.aiAgentId ?? ''"
                  class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  @change="assignBot(channel, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">No bot</option>
                  <option v-for="a in agents" :key="a.id" :value="a.id">{{ a.name }}</option>
                </select>
              </label>

              <!-- Auto first-reply -->
              <div class="rounded-xl border p-4">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-sm font-semibold">Auto first-reply</div>
                    <p class="text-muted-foreground text-xs">
                      Sent automatically to a brand-new contact's first message.
                    </p>
                  </div>
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      v-model="fr.enabled"
                      type="checkbox"
                      class="size-4"
                      :disabled="!!channel.aiAgentId"
                    />
                    Enabled
                  </label>
                </div>

                <div
                  v-if="channel.aiAgentId"
                  class="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  An AI bot is attached to this channel — it overrides the auto first-reply, so this
                  is disabled. Remove the bot above to use a canned first-reply instead.
                </div>

                <div v-else-if="fr.enabled" class="mt-3 space-y-3">
                  <label class="block max-w-xs">
                    <span class="text-sm font-medium">Type</span>
                    <select
                      v-model="fr.contentType"
                      class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      @change="onFrType"
                    >
                      <option value="text">Text only</option>
                      <option value="hybrid">Text + media (hybrid)</option>
                      <option value="image">Image(s)</option>
                      <option value="video">Video(s)</option>
                      <option value="document">Document(s)</option>
                    </select>
                  </label>

                  <label v-if="frAllowsBody" class="block">
                    <span class="text-sm font-medium">
                      Message {{ fr.contentType === 'hybrid' ? '(caption)' : '' }}
                    </span>
                    <textarea
                      v-model="fr.body"
                      rows="2"
                      placeholder="Halo Kak! 👋 Terima kasih sudah menghubungi kami…"
                      class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </label>

                  <div v-if="frAllowsMedia" class="space-y-2">
                    <span class="text-sm font-medium">
                      Media
                      <span class="text-muted-foreground font-normal">
                        ({{ fr.contentType === 'hybrid' ? '1 file' : 'up to 5 files' }}, 1–5 MB)
                      </span>
                    </span>
                    <div v-if="fr.mediaItems.length" class="flex flex-wrap gap-2">
                      <div
                        v-for="(m, i) in fr.mediaItems"
                        :key="m.key"
                        class="bg-muted relative flex h-16 w-20 items-center justify-center overflow-hidden rounded-lg border"
                      >
                        <img
                          v-if="m.type === 'image' && m.url"
                          :src="m.url"
                          :alt="m.name ?? ''"
                          class="size-full object-cover"
                        />
                        <Icon
                          v-else
                          :icon="m.type === 'video' ? 'lucide:video' : 'lucide:file-text'"
                          class="text-muted-foreground size-6"
                        />
                        <button
                          class="bg-background/90 absolute right-1 top-1 rounded p-0.5 text-red-600 shadow"
                          @click="removeFrMedia(i)"
                        >
                          <Icon icon="lucide:x" class="size-3" />
                        </button>
                      </div>
                    </div>
                    <input
                      v-if="fr.mediaItems.length < frMaxFiles"
                      type="file"
                      :accept="frAccept"
                      :multiple="fr.contentType !== 'hybrid'"
                      class="text-sm"
                      @change="onFrFiles"
                    />
                    <p v-if="frUploading" class="text-muted-foreground text-xs">Uploading…</p>
                  </div>
                </div>

                <p v-if="frError" class="mt-2 text-sm text-red-600">{{ frError }}</p>
                <div v-if="!channel.aiAgentId" class="mt-3 flex items-center gap-2">
                  <button
                    class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    :disabled="busy || frUploading"
                    @click="saveFirstReply(channel)"
                  >
                    Save first-reply
                  </button>
                  <span v-if="frSaved" class="text-xs text-green-600">Saved</span>
                </div>
              </div>

              <!-- WAHA connect -->
              <div v-if="channel.type === 'whatsapp_waha'" class="space-y-3">
                <div class="flex gap-2">
                  <button
                    v-if="channel.status !== 'connected'"
                    class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    :disabled="busy"
                    @click="connect(channel)"
                  >
                    Connect / show QR
                  </button>
                  <button
                    v-else
                    class="hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold"
                    @click="disconnect(channel)"
                  >
                    Disconnect
                  </button>
                  <button
                    v-if="channel.status !== 'connected'"
                    class="hover:bg-muted rounded-lg border px-4 py-2 text-sm"
                    @click="refreshQr(channel)"
                  >
                    Refresh QR
                  </button>
                </div>
                <div v-if="qr" class="inline-block rounded-xl border bg-white p-3">
                  <img :src="qr" alt="WhatsApp QR" class="size-52" />
                  <p class="text-muted-foreground mt-2 text-center text-xs">
                    Scan with WhatsApp → Linked devices
                  </p>
                </div>
              </div>

              <!-- Meta / Telegram configure -->
              <form
                v-else-if="channel.type !== 'webchat'"
                class="max-w-md space-y-3"
                @submit.prevent="saveConfigure(channel)"
              >
                <label v-for="field in credFields(channel.type)" :key="field.key" class="block">
                  <span class="text-sm font-medium">{{ field.label }}</span>
                  <input
                    v-model="creds[field.key]"
                    type="password"
                    autocomplete="off"
                    class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <label v-if="channel.type === 'whatsapp_meta'" class="block">
                  <span class="text-sm font-medium">Phone number ID</span>
                  <input
                    v-model="credExternalId"
                    class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  :disabled="busy"
                >
                  Save & connect
                </button>
              </form>

              <!-- Webchat embed -->
              <div v-else-if="channel.type === 'webchat'" class="space-y-2">
                <span class="text-sm font-medium">Embed snippet</span>
                <div class="relative">
                  <textarea
                    :value="embed ?? 'Loading…'"
                    readonly
                    rows="3"
                    class="bg-muted w-full rounded-lg border px-3 py-2 font-mono text-xs"
                  />
                  <button
                    class="bg-background absolute top-2 right-2 rounded-md border px-2 py-1 text-xs font-medium"
                    @click="copyEmbed"
                  >
                    {{ copied ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <p class="text-muted-foreground text-xs">
                  Paste this before &lt;/body&gt; on your website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
