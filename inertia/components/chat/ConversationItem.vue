<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Conversation } from '~/stores/chat'

const props = defineProps<{ conversation: Conversation; active?: boolean }>()
defineEmits<{ open: [id: string] }>()

const c = computed(() => props.conversation)
const name = computed(
  () => c.value.contact?.displayName || c.value.contact?.externalId || 'Unknown'
)
const preview = computed(() => c.value.messages?.[0]?.body || 'No messages yet')
const time = computed(() => {
  const t = c.value.lastMessageAt
  return t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
})

const CHANNEL_ICON: Record<string, string> = {
  whatsapp_waha: 'lucide:message-circle',
  whatsapp_meta: 'lucide:message-circle',
  messenger: 'lucide:messages-square',
  instagram: 'lucide:instagram',
  telegram: 'lucide:send',
}
const channelIcon = computed(
  () => CHANNEL_ICON[c.value.channel?.type ?? ''] || 'lucide:message-circle'
)
</script>

<template>
  <button
    :class="[
      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
      active ? 'bg-muted' : 'hover:bg-muted/60',
    ]"
    @click="$emit('open', c.id)"
  >
    <div class="relative">
      <ChatAvatar :name="name" :src="c.contact?.avatarUrl" />
      <span
        class="bg-background absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border"
      >
        <Icon :icon="channelIcon" class="size-2.5" />
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate font-medium">{{ name }}</span>
        <span class="text-muted-foreground shrink-0 text-[11px]">{{ time }}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted-foreground truncate text-sm">{{ preview }}</span>
        <span
          v-if="c.unreadCount"
          class="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        >
          {{ c.unreadCount > 99 ? '99+' : c.unreadCount }}
        </span>
        <span
          v-else-if="!c.assignedAgentId"
          class="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
        >
          new
        </span>
      </div>
    </div>
  </button>
</template>
