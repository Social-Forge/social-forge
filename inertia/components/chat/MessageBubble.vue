<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { ChatMessage } from '~/stores/chat'

const props = defineProps<{ message: ChatMessage }>()

const isOut = computed(() => props.message.direction === 'out')

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
)

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
const linkified = computed(() =>
  escapeHtml(props.message.body || '').replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="underline break-all">$1</a>'
  )
)

const mediaUrl = computed(() => props.message.media?.url as string | undefined)

const statusIcon = computed(() => {
  switch (props.message.status) {
    case 'read':
    case 'delivered':
      return 'lucide:check-check'
    case 'sent':
      return 'lucide:check'
    case 'failed':
      return 'lucide:circle-alert'
    default:
      return 'lucide:clock-3'
  }
})
</script>

<template>
  <div :class="['flex', isOut ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'relative max-w-[78%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm',
        isOut ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card rounded-bl-sm border',
      ]"
    >
      <img
        v-if="message.contentType === 'image' && mediaUrl"
        :src="mediaUrl"
        class="mb-1 max-h-64 rounded-md object-cover"
        alt=""
      />
      <video
        v-else-if="message.contentType === 'video' && mediaUrl"
        :src="mediaUrl"
        controls
        class="mb-1 max-h-64 rounded-md"
      />
      <audio
        v-else-if="message.contentType === 'audio' && mediaUrl"
        :src="mediaUrl"
        controls
        class="mb-1 w-56"
      />
      <a
        v-else-if="message.contentType === 'document' && mediaUrl"
        :href="mediaUrl"
        target="_blank"
        rel="noopener"
        class="mb-1 flex items-center gap-2 underline"
      >
        <Icon icon="lucide:file-text" class="size-4" />
        {{ message.media?.filename || 'Document' }}
      </a>

      <!-- eslint-disable-next-line vue/no-v-html -- body is HTML-escaped in `linkified` -->
      <p v-if="message.body" class="break-words whitespace-pre-wrap" v-html="linkified" />

      <div
        :class="[
          'mt-0.5 flex items-center justify-end gap-1 text-[10px]',
          isOut ? 'text-primary-foreground/70' : 'text-muted-foreground',
        ]"
      >
        <span>{{ time }}</span>
        <Icon
          v-if="isOut"
          :icon="statusIcon"
          :class="['size-3.5', message.status === 'read' ? 'text-sky-300' : '']"
        />
      </div>
    </div>
  </div>
</template>
