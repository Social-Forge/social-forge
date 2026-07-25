<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()
const scroller = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  const el = scroller.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(() => chat.messages.length, scrollToBottom)
watch(() => chat.activeId, scrollToBottom)
</script>

<template>
  <div class="flex h-full flex-col bg-[#efeae2] dark:bg-neutral-900">
    <ChatHeader />
    <div ref="scroller" class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3 md:px-6">
      <div v-if="chat.loadingRoom" class="text-muted-foreground py-6 text-center text-sm">
        Loading messages…
      </div>
      <div
        v-else-if="!chat.messages.length"
        class="text-muted-foreground py-10 text-center text-sm"
      >
        No messages yet — say hello 👋
      </div>
      <MessageBubble v-for="m in chat.messages" :key="m.id" :message="m" />
    </div>
    <ChatInput />
  </div>
</template>
