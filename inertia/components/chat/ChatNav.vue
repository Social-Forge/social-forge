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
    <div class="mb-2 flex size-9 items-center justify-center rounded-lg">
      <img src="/logo.png" alt="Social Forge" class="size-8" />
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
      <Icon :icon="item.icon" class="size-4" />
    </Link>
    <div class="mt-auto space-y-2">
      <ThemeToggle />
      <div class="flex items-center justify-center">
        <LanguageSwitcher />
      </div>
      <button
        class="text-muted-foreground hover:bg-muted flex size-11 items-center justify-center rounded-xl"
        title="Logout"
        @click="logout"
      >
        <Icon icon="lucide:log-out" class="size-5" />
      </button>
    </div>
  </nav>
</template>
