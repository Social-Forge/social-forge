<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Link } from '@adonisjs/inertia/vue'
import { router, usePage } from '@inertiajs/vue3'
import { chatNavItems } from '~/lib/chat-nav-items'

const page = usePage<any>()

function isActive(url: string) {
  return page.url.startsWith(url)
}

function logout() {
  router.post('/logout')
}
</script>

<template>
  <nav class="bg-sidebar flex h-full w-16 shrink-0 flex-col items-center gap-1 border-r py-3">
    <div
      class="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-lg font-bold"
    >
      SF
    </div>
    <Link
      v-for="item in chatNavItems"
      :key="item.url"
      :href="item.url"
      :title="item.title"
      :class="[
        'flex size-11 items-center justify-center rounded-xl transition-colors',
        isActive(item.url)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted',
      ]"
    >
      <Icon :icon="item.icon" class="size-5" />
    </Link>
    <button
      class="text-muted-foreground hover:bg-muted mt-auto flex size-11 items-center justify-center rounded-xl"
      title="Logout"
      @click="logout"
    >
      <Icon icon="lucide:log-out" class="size-5" />
    </button>
  </nav>
</template>
