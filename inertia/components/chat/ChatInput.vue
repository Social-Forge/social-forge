<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()
const text = ref('')
const showEmoji = ref(false)
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
    submit()
  }
}
</script>

<template>
  <div class="bg-background border-t p-2">
    <div v-if="showEmoji" class="bg-card mb-2 flex flex-wrap gap-1 rounded-lg border p-2">
      <button
        v-for="e in emojis"
        :key="e"
        class="text-xl transition hover:scale-125"
        @click="text += e"
      >
        {{ e }}
      </button>
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
