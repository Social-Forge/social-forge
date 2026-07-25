<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()
const c = computed(() => chat.active)
const name = computed(() => c.value?.contact?.displayName || c.value?.contact?.externalId || '')
</script>

<template>
  <div v-if="c" class="bg-background flex items-center gap-2 border-b p-2.5">
    <button class="p-1 md:hidden" @click="chat.activeId = null">
      <Icon icon="lucide:arrow-left" class="size-5" />
    </button>
    <ChatAvatar :name="name" :src="c.contact?.avatarUrl" size="size-9 text-xs" />
    <div class="min-w-0 flex-1">
      <div class="truncate font-medium">{{ name }}</div>
      <div class="text-muted-foreground text-xs">
        <span class="capitalize">{{ c.channel?.type?.replace(/_/g, ' ') }}</span>
        · <span class="capitalize">{{ c.status }}</span>
      </div>
    </div>
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
</template>
