<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

interface Label {
  id: string
  name: string
  color: string
}
interface QuickReply {
  id: string
  shortcut: string
  contentType: string
  body: string | null
}

const tab = ref<'labels' | 'quick'>('labels')
const loading = ref(true)
const labels = ref<Label[]>([])
const replies = ref<QuickReply[]>([])

const labelForm = reactive({ id: '', name: '', color: '#4f46e5' })
const replyForm = reactive({ id: '', shortcut: '', body: '' })
const savingLabel = ref(false)
const savingReply = ref(false)

async function load() {
  loading.value = true
  const [l, q] = await Promise.all([
    api.get<Label[]>('/app/labels').catch(() => []),
    api.get<QuickReply[]>('/app/quick-replies').catch(() => []),
  ])
  labels.value = l ?? []
  replies.value = q ?? []
  loading.value = false
}

// --- Labels ---------------------------------------------------------------
function editLabel(label: Label) {
  labelForm.id = label.id
  labelForm.name = label.name
  labelForm.color = label.color
}
function resetLabel() {
  labelForm.id = ''
  labelForm.name = ''
  labelForm.color = '#4f46e5'
}
async function saveLabel() {
  if (!labelForm.name.trim()) return
  savingLabel.value = true
  try {
    const body = { name: labelForm.name, color: labelForm.color }
    if (labelForm.id) await api.put(`/app/labels/${labelForm.id}`, body)
    else await api.post('/app/labels', body)
    resetLabel()
    await load()
  } finally {
    savingLabel.value = false
  }
}
async function removeLabel(label: Label) {
  if (!confirm(`Delete label "${label.name}"?`)) return
  await api.del(`/app/labels/${label.id}`)
  await load()
}

// --- Quick replies --------------------------------------------------------
function editReply(reply: QuickReply) {
  replyForm.id = reply.id
  replyForm.shortcut = reply.shortcut
  replyForm.body = reply.body ?? ''
}
function resetReply() {
  replyForm.id = ''
  replyForm.shortcut = ''
  replyForm.body = ''
}
async function saveReply() {
  if (!replyForm.shortcut.trim() || !replyForm.body.trim()) return
  savingReply.value = true
  try {
    const body = { shortcut: replyForm.shortcut, contentType: 'text', body: replyForm.body }
    if (replyForm.id) await api.put(`/app/quick-replies/${replyForm.id}`, body)
    else await api.post('/app/quick-replies', body)
    resetReply()
    await load()
  } finally {
    savingReply.value = false
  }
}
async function removeReply(reply: QuickReply) {
  if (!confirm(`Delete quick reply "/${reply.shortcut}"?`)) return
  await api.del(`/app/quick-replies/${reply.id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <Link href="/app/settings" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">Labels & Quick Replies</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-3xl px-4 py-8">
      <div class="bg-muted mb-6 inline-flex rounded-lg p-1 text-sm font-medium">
        <button
          :class="[
            'rounded-md px-4 py-1.5',
            tab === 'labels' ? 'bg-background shadow-sm' : 'text-muted-foreground',
          ]"
          @click="tab = 'labels'"
        >
          Labels
        </button>
        <button
          :class="[
            'rounded-md px-4 py-1.5',
            tab === 'quick' ? 'bg-background shadow-sm' : 'text-muted-foreground',
          ]"
          @click="tab = 'quick'"
        >
          Quick replies
        </button>
      </div>

      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <!-- Labels -->
      <div v-else-if="tab === 'labels'" class="space-y-6">
        <div class="bg-card flex flex-wrap items-end gap-3 rounded-2xl border p-5">
          <label class="block">
            <span class="text-sm font-medium">Color</span>
            <input
              v-model="labelForm.color"
              type="color"
              class="mt-1 block h-10 w-14 rounded-lg border"
            />
          </label>
          <label class="block flex-1">
            <span class="text-sm font-medium">Name</span>
            <input
              v-model="labelForm.name"
              placeholder="e.g. VIP"
              class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <button
            class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="savingLabel"
            @click="saveLabel"
          >
            {{ labelForm.id ? 'Update' : 'Add' }}
          </button>
          <button
            v-if="labelForm.id"
            class="hover:bg-muted rounded-lg border px-3 py-2 text-sm"
            @click="resetLabel"
          >
            Cancel
          </button>
        </div>

        <div class="bg-card rounded-2xl border">
          <div v-if="!labels.length" class="text-muted-foreground py-10 text-center text-sm">
            No labels yet.
          </div>
          <div v-else class="divide-y">
            <div v-for="label in labels" :key="label.id" class="flex items-center gap-3 px-5 py-3">
              <span class="size-4 rounded-full" :style="{ backgroundColor: label.color }" />
              <span class="flex-1 font-medium">{{ label.name }}</span>
              <button class="hover:bg-muted rounded-lg p-1.5" @click="editLabel(label)">
                <Icon icon="lucide:pencil" class="size-4" />
              </button>
              <button
                class="hover:bg-muted rounded-lg p-1.5 text-red-600"
                @click="removeLabel(label)"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick replies -->
      <div v-else class="space-y-6">
        <div class="bg-card space-y-3 rounded-2xl border p-5">
          <label class="block">
            <span class="text-sm font-medium">Shortcut (typed as /shortcut)</span>
            <input
              v-model="replyForm.shortcut"
              placeholder="greeting"
              class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Message</span>
            <textarea
              v-model="replyForm.body"
              rows="3"
              class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <div class="flex gap-2">
            <button
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              :disabled="savingReply"
              @click="saveReply"
            >
              {{ replyForm.id ? 'Update' : 'Add' }}
            </button>
            <button
              v-if="replyForm.id"
              class="hover:bg-muted rounded-lg border px-3 py-2 text-sm"
              @click="resetReply"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="bg-card rounded-2xl border">
          <div v-if="!replies.length" class="text-muted-foreground py-10 text-center text-sm">
            No quick replies yet.
          </div>
          <div v-else class="divide-y">
            <div v-for="reply in replies" :key="reply.id" class="flex items-start gap-3 px-5 py-3">
              <div class="min-w-0 flex-1">
                <div class="text-primary text-sm font-semibold">/{{ reply.shortcut }}</div>
                <div class="text-muted-foreground line-clamp-2 text-sm">{{ reply.body }}</div>
              </div>
              <button class="hover:bg-muted rounded-lg p-1.5" @click="editReply(reply)">
                <Icon icon="lucide:pencil" class="size-4" />
              </button>
              <button
                class="hover:bg-muted rounded-lg p-1.5 text-red-600"
                @click="removeReply(reply)"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
