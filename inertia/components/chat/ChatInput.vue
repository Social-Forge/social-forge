<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '~/stores/chat'
import { api } from '~/composables/useApi'

interface QuickReply {
  id: string
  shortcut: string
  contentType: string
  body: string | null
}

interface Emoji {
  annotation?: string
  emoji?: string
  group?: number
  hexcode: string
  order?: number
  shortcodes?: string[]
  skins?: Emoji[]
  tags?: string[]
  unicode: string
  version?: number
}

const chat = useChatStore()
const text = ref('')
const showEmoji = ref(false)
const selectedEmoji = ref('')
const emojis = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '😘',
  '👍',
  '🙏',
  '🎉',
  '❤️',
  '🔥',
  '✅',
  '😅',
  '😭',
  '🥰',
  '👋',
  '💯',
  '🙌',
  '😎',
]

// --- quick replies ("/" picker) -------------------------------------------
const quickReplies = ref<QuickReply[]>([])
onMounted(async () => {
  quickReplies.value = await api.get<QuickReply[]>('/app/quick-replies').catch(() => [])
})

// Show the picker while the composer holds a single "/shortcut" token.
const quickReplyMatches = computed<QuickReply[]>(() => {
  const value = text.value
  if (!value.startsWith('/') || value.includes(' ') || value.includes('\n')) return []
  const term = value.slice(1).toLowerCase()
  return quickReplies.value.filter((q) => q.shortcut.toLowerCase().startsWith(term)).slice(0, 6)
})
const showQuickReplies = computed(() => quickReplyMatches.value.length > 0)

function applyQuickReply(reply: QuickReply) {
  text.value = reply.body ?? ''
}

async function submit() {
  const value = text.value
  if (!value.trim() || chat.sending) return
  text.value = ''
  showEmoji.value = false
  await chat.send(value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    // Enter while the picker is open expands the top match instead of sending.
    if (showQuickReplies.value) {
      applyQuickReply(quickReplyMatches.value[0])
      return
    }
    submit()
  }
}

const onEmojiClick = (emoji: Emoji) => {
  const emojiChar = emoji.emoji || emoji.unicode
  text.value += emojiChar
}
</script>

<template>
  <div class="bg-background border-t px-2 py-4">
    <div
      v-if="showQuickReplies"
      class="bg-card mb-2 max-h-56 overflow-y-auto rounded-lg border p-1 shadow-sm"
    >
      <button
        v-for="reply in quickReplyMatches"
        :key="reply.id"
        class="hover:bg-muted flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left"
        @click="applyQuickReply(reply)"
      >
        <span class="text-primary text-xs font-semibold">/{{ reply.shortcut }}</span>
        <span class="text-muted-foreground line-clamp-1 text-sm">{{ reply.body }}</span>
      </button>
    </div>
    <div v-if="showEmoji" class="bg-card mb-2 rounded-lg border p-2">
      <div class="flex justify-end w-full">
        <Button variant="outline" size="icon-xs" @click="showEmoji = false">
          <Icon icon="lucide:x" />
        </Button>
      </div>
      <EmojiPicker v-model="selectedEmoji" class="shrink-0" @select="onEmojiClick" />
    </div>
    <div class="flex items-end gap-1.5">
      <button
        class="text-muted-foreground hover:text-foreground p-2"
        title="Emoji"
        @click="showEmoji = !showEmoji"
      >
        <Icon icon="lucide:smile" class="size-5" />
      </button>
      <button class="text-muted-foreground hover:text-foreground p-2" title="Attach">
        <Icon icon="lucide:paperclip" class="size-5" />
      </button>
      <textarea
        v-model="text"
        rows="1"
        placeholder="Type a message  ( / for quick replies )"
        class="bg-muted max-h-32 flex-1 resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
        @keydown="onKeydown"
      />
      <button
        :disabled="chat.sending || !text.trim()"
        class="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40"
        @click="submit"
      >
        <Icon
          :icon="chat.sending ? 'lucide:loader-circle' : 'lucide:send-horizontal'"
          :class="['size-5', chat.sending && 'animate-spin']"
        />
      </button>
    </div>
  </div>
</template>
