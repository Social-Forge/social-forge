<script setup lang="ts">
import { Icon } from '@iconify/vue'

const faqs = [
  {
    q: 'Which channels can I connect?',
    a: 'WhatsApp (via WAHA), WhatsApp Business (Meta), Messenger, Instagram, Telegram, and a webchat widget you embed on your own website.',
  },
  {
    q: 'How do I connect WhatsApp?',
    a: 'Go to Settings → Channels, create a WhatsApp (WAHA) channel, click Connect, and scan the QR code with WhatsApp → Linked devices.',
  },
  {
    q: 'How does the AI auto-reply work?',
    a: 'Create an AI agent under Settings → AI Agents, set its instructions and (optionally) a knowledge base and working hours, then assign it to a channel. It replies automatically until a human takes over the conversation.',
  },
  {
    q: 'What are AI credits?',
    a: 'AI usage is metered in credits, normalized across providers so pricing is fair regardless of the model. Your balance and history are shown on the Billing page, where you can also top up.',
  },
  {
    q: 'How do I add the webchat widget to my site?',
    a: 'Create a webchat channel, open it, and copy the embed snippet. Paste it before the closing </body> tag on any page.',
  },
  {
    q: 'Can I invite my team?',
    a: 'Yes. Under Settings → Team & Divisions, add supervisors and agents, and organize them into divisions for routing and auto-assignment.',
  },
]

const open = ref<number | null>(0)
function toggle(i: number) {
  open.value = open.value === i ? null : i
}
</script>

<template>
  <MetaHead
    title="Help Center"
    description="Answers to common questions about setting up and using Social Forge."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Help Center</h1>
    <p class="text-muted-foreground mt-3">
      Quick answers to get you up and running. Still stuck?
      <a href="/contact" class="text-primary hover:underline">Contact us</a>.
    </p>

    <div class="mt-10 space-y-3">
      <div v-for="(faq, i) in faqs" :key="faq.q" class="bg-card rounded-xl border">
        <button
          class="flex w-full items-center gap-3 px-5 py-4 text-left font-medium"
          @click="toggle(i)"
        >
          <span class="flex-1">{{ faq.q }}</span>
          <Icon
            :icon="open === i ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="text-muted-foreground size-4 shrink-0"
          />
        </button>
        <p
          v-if="open === i"
          class="text-muted-foreground border-t px-5 py-4 text-sm leading-relaxed"
        >
          {{ faq.a }}
        </p>
      </div>
    </div>
  </MarketingShell>
</template>
