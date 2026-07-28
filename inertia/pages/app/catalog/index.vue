<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'
import {
  uploadFile,
  deleteFile,
  validateMinioUrl,
  type UploadedMedia,
} from '~/composables/useUpload'
import { toast } from 'vue-sonner'

interface Label {
  id: string
  name: string
  color: string
}
interface MediaItem {
  key: string
  type: 'image' | 'video' | 'document'
  name?: string | null
  size?: number | null
  url?: string | null
}
interface QuickReply {
  id: string
  shortcut: string
  contentType: string
  body: string | null
  mediaItems: MediaItem[]
}

type ReplyType = 'text' | 'image' | 'video' | 'document' | 'hybrid'

const tab = ref<'labels' | 'quick'>('labels')
const loading = ref(true)
const labels = ref<Label[]>([])
const replies = ref<QuickReply[]>([])

const labelForm = reactive({ id: '', name: '', color: '#4f46e5' })
const savingLabel = ref(false)

const replyForm = reactive({
  id: '',
  shortcut: '',
  contentType: 'text' as ReplyType,
  body: '',
  mediaItems: [] as MediaItem[],
})
const savingReply = ref(false)
const uploading = ref(false)
const replyError = ref('')
const isDeleting = ref(false)

const acceptFor = computed(() => {
  switch (replyForm.contentType) {
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
const allowsMedia = computed(() => replyForm.contentType !== 'text')
const allowsBody = computed(
  () => replyForm.contentType === 'text' || replyForm.contentType === 'hybrid'
)
const maxFiles = computed(() => (replyForm.contentType === 'hybrid' ? 1 : 5))

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
  replyForm.contentType = (reply.contentType as ReplyType) ?? 'text'
  replyForm.body = reply.body ?? ''
  replyForm.mediaItems = reply.mediaItems ? [...reply.mediaItems] : []
  replyError.value = ''
}
function resetReply() {
  if (replyForm.id && replyForm.mediaItems.length > 0) {
    cleanupOrphanedMedia()
  }
  replyForm.id = ''
  replyForm.shortcut = ''
  replyForm.contentType = 'text'
  replyForm.body = ''
  replyForm.mediaItems = []
  replyError.value = ''
}
function onTypeChange() {
  // Media kind changed → drop incompatible files.
  if (replyForm.contentType === 'text') replyForm.mediaItems = []
  else if (replyForm.contentType !== 'hybrid') {
    replyForm.mediaItems = replyForm.mediaItems.filter((m) => m.type === replyForm.contentType)
  }
  if (replyForm.mediaItems.length > maxFiles.value) {
    replyForm.mediaItems = replyForm.mediaItems.slice(0, maxFiles.value)
  }
}
async function onReplyFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  replyError.value = ''
  uploading.value = true
  try {
    for (const file of files) {
      if (replyForm.mediaItems.length >= maxFiles.value) break
      const up: UploadedMedia = await uploadFile(file)
      if (replyForm.contentType !== 'hybrid' && up.type !== replyForm.contentType) {
        replyError.value = `"${up.name}" is not a ${replyForm.contentType} file.`
        continue
      }
      replyForm.mediaItems.push({
        key: up.key,
        type: up.type,
        name: up.name,
        size: up.size,
        url: up.url,
      })
    }
  } catch (err) {
    replyError.value = (err as Error).message
  } finally {
    uploading.value = false
  }
}
async function removeReplyMedia(index: number) {
  replyForm.mediaItems.splice(index, 1)
  await handleRemoveMedia(index)
}
async function saveReply() {
  replyError.value = ''
  if (!replyForm.shortcut.trim()) return
  if (allowsBody.value && replyForm.contentType !== 'image' && !replyForm.body.trim()) {
    if (replyForm.contentType === 'text' || replyForm.contentType === 'hybrid') {
      replyError.value = 'A message body is required for this type.'
      return
    }
  }
  if (allowsMedia.value && !replyForm.mediaItems.length) {
    replyError.value = 'Add at least one media file.'
    return
  }
  savingReply.value = true
  try {
    const body = {
      shortcut: replyForm.shortcut,
      contentType: replyForm.contentType,
      body: allowsBody.value ? replyForm.body : null,
      mediaItems: replyForm.mediaItems.map((m) => ({
        key: m.key,
        type: m.type,
        name: m.name,
        size: m.size,
      })),
    }
    if (replyForm.id) await api.put(`/app/quick-replies/${replyForm.id}`, body)
    else await api.post('/app/quick-replies', body)
    resetReply()
    await load()
  } catch (err) {
    replyError.value = (err as Error).message
  } finally {
    savingReply.value = false
  }
}
async function removeReply(reply: QuickReply) {
  if (!confirm(`Delete quick reply "/${reply.shortcut}"?`)) return
  try {
    await api.del(`/app/quick-replies/${reply.id}`)

    if (reply.mediaItems?.length) {
      await Promise.all(
        reply.mediaItems.map((item) =>
          deleteFile(item.key).catch((err) => {
            console.warn(`Failed to delete media ${item.key}:`, err)
          })
        )
      )
    }

    await load()
    toast.success('Quick reply deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete quick reply')
  }
}

function typeIcon(type: string): string {
  return type === 'video'
    ? 'lucide:video'
    : type === 'document'
      ? 'lucide:file-text'
      : type === 'hybrid'
        ? 'lucide:layers'
        : type === 'image'
          ? 'lucide:image'
          : 'lucide:message-square'
}

async function handleRemoveMedia(index: number) {
  const mediaItem = replyForm.mediaItems[index]
  if (!mediaItem) return

  const fileKey = mediaItem.key

  replyForm.mediaItems.splice(index, 1)

  try {
    if (fileKey) {
      const result = await deleteFile(fileKey)
      toast.success(`File deleted: ${result.message}`)
    }
  } catch (error: any) {
    replyForm.mediaItems.splice(index, 0, mediaItem)
    replyError.value = error.message || 'Failed to delete file'
    toast.error(error.message || 'Failed to delete file')
  }
}

async function cleanupOrphanedMedia() {
  const itemsToDelete = replyForm.mediaItems.filter((item) => item.key)

  if (itemsToDelete.length === 0) return

  try {
    await Promise.all(
      itemsToDelete.map((item) =>
        deleteFile(item.key).catch((err) => {
          console.warn(`Failed to delete ${item.key}:`, err)
        })
      )
    )
  } catch (error) {
    console.error('Cleanup error:', error)
  }
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
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">Shortcut (typed as /shortcut)</span>
              <input
                v-model="replyForm.shortcut"
                placeholder="greeting"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">Type</span>
              <select
                v-model="replyForm.contentType"
                class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                @change="onTypeChange"
              >
                <option value="text">Text only</option>
                <option value="hybrid">Text + media (hybrid)</option>
                <option value="image">Image(s)</option>
                <option value="video">Video(s)</option>
                <option value="document">Document(s)</option>
              </select>
            </label>
          </div>

          <label v-if="allowsBody" class="block">
            <span class="text-sm font-medium">
              Message {{ replyForm.contentType === 'hybrid' ? '(caption)' : '' }}
            </span>
            <textarea
              v-model="replyForm.body"
              rows="3"
              class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div v-if="allowsMedia" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">
                Media
                <span class="text-muted-foreground font-normal">
                  ({{ replyForm.contentType === 'hybrid' ? '1 file' : 'up to 5 files' }}, 1–5 MB)
                </span>
              </span>
              <span class="text-muted-foreground text-xs"
                >{{ replyForm.mediaItems.length }}/{{ maxFiles }}</span
              >
            </div>

            <label
              v-if="replyForm.mediaItems.length < maxFiles"
              for="uploadMediaReply"
              class="bg-muted text-muted-foreground font-semibold text-sm rounded-md w-full h-48 flex flex-col items-center justify-center cursor-pointer border-2 border-muted border-dashed mx-auto mt-6 focus-within:ring-2 focus-within:ring-primary dark:bg-neutral-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-10 mb-4 fill-gray-400"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path
                  d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
                  data-original="#000000"
                />
                <path
                  d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
                  data-original="#000000"
                />
              </svg>
              Upload file

              <input
                id="uploadMediaReply"
                type="file"
                class="sr-only"
                :accept="acceptFor"
                :multiple="replyForm.contentType !== 'hybrid'"
                @change="onReplyFiles"
              />
              <p class="text-xs font-normal text-muted-foreground text-center mt-2">
                <span class="uppercase">{{ acceptFor }}</span> are Allowed.
              </p>
            </label>
            <div v-if="replyForm.mediaItems.length" class="flex flex-wrap gap-2">
              <div
                v-for="(m, i) in replyForm.mediaItems"
                :key="m.key"
                class="bg-muted relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border"
              >
                <img
                  v-if="m.type === 'image' && m.url"
                  :src="m.url"
                  :alt="m.name ?? ''"
                  class="size-full object-cover"
                />
                <Icon v-else :icon="typeIcon(m.type)" class="text-muted-foreground size-7" />
                <button
                  class="bg-background/90 absolute right-1 top-1 rounded p-0.5 text-red-600 shadow"
                  @click="handleRemoveMedia(i)"
                >
                  <Icon icon="lucide:x" class="size-3.5" />
                </button>
              </div>
            </div>
            <p v-if="uploading" class="text-muted-foreground text-xs">Uploading…</p>
          </div>

          <p v-if="replyError" class="text-sm text-red-600">{{ replyError }}</p>

          <div class="flex gap-2">
            <button
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              :disabled="savingReply || uploading"
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
              <Icon
                :icon="typeIcon(reply.contentType)"
                class="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <div class="text-primary text-sm font-semibold">/{{ reply.shortcut }}</div>
                <div v-if="reply.body" class="text-muted-foreground line-clamp-2 text-sm">
                  {{ reply.body }}
                </div>
                <div v-if="reply.mediaItems?.length" class="text-muted-foreground mt-1 text-xs">
                  {{ reply.mediaItems.length }} {{ reply.contentType }} file(s)
                </div>
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
