<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { Link } from '@adonisjs/inertia/vue'
import { usePage } from '@inertiajs/vue3'
import { useMediaQuery } from '@vueuse/core'
import { useChatStore } from '~/stores/chat'
import { useRealtime } from '~/composables/useRealtime'
import { chatNavItems } from '~/lib/chat-nav-items'

const page = usePage<any>()
const chat = useChatStore()
const rt = useRealtime()

const isMobile = useMediaQuery('(max-width: 767px)')
const mobileNavOpen = ref(false)

const tenantId = computed(() => page.props.tenantId as string | null)
const showList = computed(() => !isMobile.value || !chat.activeId)
const showRoom = computed(() => !isMobile.value || !!chat.activeId)

function convChannel(id: string) {
  return `chat:tenant.${tenantId.value}.conversation.${id}`
}

onMounted(async () => {
  chat.currentUserId = page.props.user?.id ?? null
  await chat.loadConversations()
  if (tenantId.value) {
    rt.subscribe(`chat:tenant.${tenantId.value}.inbox`, chat.onRealtimeInbox)
  }
})

// Subscribe to the active conversation's channel; drop the previous one.
watch(
  () => chat.activeId,
  (id, prev) => {
    if (!tenantId.value) return
    if (prev) rt.unsubscribe(convChannel(prev))
    if (id) rt.subscribe(convChannel(id), chat.onRealtimeConversation)
  }
)

onBeforeUnmount(() => rt.disconnect())
</script>

<template>
  <div class="bg-background text-foreground flex h-svh w-full overflow-hidden">
    <ChatNav class="hidden md:flex" />

    <div v-show="showList" class="h-full w-full shrink-0 md:w-90 md:border-r">
      <ConversationList @menu="mobileNavOpen = true" @refresh="chat.loadConversations" />
    </div>

    <div v-show="showRoom" class="h-full min-w-0 flex-1">
      <ChatRoom v-if="chat.activeId" />
      <ChatEmpty v-else class="hidden md:block" />
    </div>

    <Sheet v-model:open="mobileNavOpen">
      <SheetContent side="left" class="w-64 p-0">
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        <div class="flex items-center gap-2 border-b p-4">
          <div class="flex size-9 items-center justify-center rounded-lg">
            <img src="/logo.png" alt="Social Forge" class="size-8" />
          </div>
          <span class="font-semibold">Social Forge</span>
        </div>
        <nav class="flex flex-col p-2">
          <Link
            v-for="it in chatNavItems"
            :key="it.url"
            :href="it.url"
            class="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
            @click="mobileNavOpen = false"
          >
            <Icon :icon="it.icon" class="size-5" /> {{ it.title }}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  </div>
</template>
<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
