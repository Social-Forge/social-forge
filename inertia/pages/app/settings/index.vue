<script setup lang="ts">
import { Icon } from '@iconify/vue'

const items = [
  {
    icon: 'lucide:credit-card',
    title: 'Billing & Subscription',
    desc: 'Plan, AI credits, invoices',
    href: '/app/billing',
  },
  {
    icon: 'lucide:messages-square',
    title: 'Chats',
    desc: 'Conversation inbox',
    href: '/app/chats',
  },
  { icon: 'lucide:users', title: 'Contacts', desc: 'Manage your contacts', href: '/app/contacts' },
]
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <a href="/app/chats" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </a>
        <h1 class="font-semibold">Settings</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="grid gap-4 sm:grid-cols-2">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          class="bg-card hover:border-primary/50 flex items-start gap-4 rounded-2xl border p-5 transition-colors"
        >
          <div
            class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl"
          >
            <Icon :icon="item.icon" class="size-5" />
          </div>
          <div>
            <div class="font-semibold">{{ item.title }}</div>
            <div class="text-muted-foreground text-sm">{{ item.desc }}</div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
