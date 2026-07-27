<script setup lang="ts">
import { Icon } from '@iconify/vue'

const items = [
  {
    status: 'done',
    title: 'Omnichannel inbox',
    desc: 'WhatsApp, Meta, Telegram & webchat unified in real time.',
  },
  {
    status: 'done',
    title: 'AI auto-reply + knowledge base',
    desc: 'Grounded replies with fair credit metering.',
  },
  {
    status: 'done',
    title: 'Team, roles & divisions',
    desc: 'Auto-assign, handoff, and role-based access.',
  },
  {
    status: 'done',
    title: 'Embeddable webchat widget',
    desc: 'One script tag to add live chat to any site.',
  },
  {
    status: 'done',
    title: 'Billing & subscriptions',
    desc: 'Plans, add-ons, and instant AI credit top-ups.',
  },
  {
    status: 'progress',
    title: 'Analytics & campaigns',
    desc: 'Conversation insights and broadcast campaigns.',
  },
  {
    status: 'planned',
    title: 'Mobile app',
    desc: 'A chat-first companion app with push notifications.',
  },
  {
    status: 'planned',
    title: 'More payment gateways',
    desc: 'Midtrans and PayPal alongside Xendit.',
  },
]

const meta: Record<string, { icon: string; label: string; cls: string }> = {
  done: { icon: 'lucide:check-circle-2', label: 'Shipped', cls: 'text-green-600' },
  progress: { icon: 'lucide:loader', label: 'In progress', cls: 'text-amber-600' },
  planned: { icon: 'lucide:circle-dashed', label: 'Planned', cls: 'text-muted-foreground' },
}
</script>

<template>
  <MetaHead
    title="Roadmap"
    description="What we've shipped and what's coming next at Social Forge."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Roadmap</h1>
    <p class="text-muted-foreground mt-3">Where Social Forge is today, and where it's headed.</p>

    <div class="mt-10 space-y-3">
      <div
        v-for="item in items"
        :key="item.title"
        class="bg-card flex items-start gap-4 rounded-2xl border p-5"
      >
        <Icon
          :icon="meta[item.status].icon"
          :class="['mt-0.5 size-5 shrink-0', meta[item.status].cls]"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ item.title }}</span>
            <span :class="['text-xs font-medium', meta[item.status].cls]">{{
              meta[item.status].label
            }}</span>
          </div>
          <p class="text-muted-foreground mt-1 text-sm">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </MarketingShell>
</template>
