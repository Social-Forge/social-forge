<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useChatStore, type ChatFilter } from '~/stores/chat'
import { MessageCircleWarning, RefreshCcw } from '@lucide/vue'

defineEmits<{
  (e: 'menu'): void
  (e: 'refresh'): Promise<void>
}>()
const chat = useChatStore()

const filters: { key: ChatFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'mine', label: 'Mine' },
  { key: 'unassigned', label: 'Unassigned' },
]
</script>

<template>
  <div class="bg-background flex h-full flex-col">
    <div class="flex items-center gap-2 border-b p-3">
      <button class="text-muted-foreground hover:text-foreground md:hidden" @click="$emit('menu')">
        <Icon icon="lucide:menu" class="size-5" />
      </button>
      <h1 class="text-lg font-semibold">Chats</h1>
      <span
        v-if="chat.totalUnread"
        class="bg-primary text-primary-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
      >
        {{ chat.totalUnread }}
      </span>
    </div>

    <div class="p-2">
      <div class="relative">
        <Icon
          icon="lucide:search"
          class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <input
          v-model="chat.search"
          placeholder="Search conversations"
          class="bg-muted focus:ring-primary/30 w-full rounded-lg py-2 pr-3 pl-9 text-sm outline-none focus:ring-2"
        />
      </div>
    </div>

    <div class="flex gap-1 px-2 pb-2">
      <button
        v-for="f in filters"
        :key="f.key"
        :class="[
          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
          chat.filter === f.key
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/70',
        ]"
        @click="chat.filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="min-h-0 flex-1 divide-y overflow-y-auto">
      <div v-if="chat.loadingList" class="space-y-4">
        <Spinner />
        <div class="text-muted-foreground p-6 text-center text-sm">Loading conversations…</div>
      </div>
      <Empty
        v-else-if="!chat.filtered.length"
        class="from-muted/50 to-background h-full bg-linear-to-b from-30%"
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleWarning />
          </EmptyMedia>
          <EmptyTitle>No conversations found</EmptyTitle>
          <EmptyDescription>You have no conversations yet </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" @click="$emit('refresh')">
            <RefreshCcw />
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
      <ConversationItem
        v-for="c in chat.filtered"
        :key="c.id"
        :conversation="c"
        :active="c.id === chat.activeId"
        @open="chat.open"
      />
    </div>
  </div>
</template>
