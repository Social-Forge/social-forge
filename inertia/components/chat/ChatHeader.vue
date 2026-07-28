<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '~/stores/chat'
import { ArrowLeft, Search, Video, Phone, MoreVertical, Users } from '@lucide/vue'

const chat = useChatStore()

const c = computed(() => chat.active)
console.log(c.value)
const name = computed(() => c.value?.contact?.displayName || c.value?.contact?.externalId || '')

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
</script>

<template>
  <div v-if="c" class="bg-background flex items-center gap-2 border-b p-2.5">
    <button class="p-1 md:hidden" @click="chat.activeId = null">
      <Icon icon="lucide:arrow-left" class="size-5" />
    </button>
    <ChatAvatar :name="name" :src="c.contact?.avatarUrl" size="size-9 text-xs" />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <div class="truncate font-medium">{{ name }}</div>
        <div v-if="c.channel?.type!">
          <Icon :icon="CHANNEL_TYPES.find((v) => v.value === c?.channel?.type)?.icon as string" />
        </div>
      </div>
      <div class="text-muted-foreground text-xs">
        <span class="capitalize">{{ c.channel?.type?.replace(/_/g, ' ') }}</span>
        · <span class="capitalize">{{ c.status }}</span>
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        class="hidden h-9 w-9 rounded-full text-(--chat-text-muted) sm:inline-flex"
      >
        <Video class="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="hidden h-9 w-9 rounded-full text-(--chat-text-muted) sm:inline-flex"
      >
        <Phone class="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" class="h-9 w-9 rounded-full text-(--chat-text-muted)">
        <Search class="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger class="text-muted-foreground hover:text-foreground p-2">
          <Icon icon="lucide:ellipsis-vertical" class="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="chat.act(c.id, 'assign')">
            <Icon icon="lucide:user-check" class="mr-2 size-4" /> Assign to me
          </DropdownMenuItem>
          <DropdownMenuItem @click="chat.act(c.id, 'unassign')">
            <Icon icon="lucide:user-x" class="mr-2 size-4" /> Unassign
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="chat.act(c.id, 'complete')">
            <Icon icon="lucide:check-check" class="mr-2 size-4" /> Mark completed
          </DropdownMenuItem>
          <DropdownMenuItem @click="chat.act(c.id, 'reopen')">
            <Icon icon="lucide:rotate-ccw" class="mr-2 size-4" /> Reopen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
