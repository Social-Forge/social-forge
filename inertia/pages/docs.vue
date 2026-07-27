<script setup lang="ts">
const steps = [
  {
    n: '1',
    h: 'Create your workspace',
    p: 'Sign up to create a workspace. You start on the free plan with a trial — no credit card required.',
  },
  {
    n: '2',
    h: 'Connect a channel',
    p: 'In Settings → Channels, add a channel. Scan the QR for WhatsApp (WAHA), paste tokens for Meta/Telegram, or embed the webchat widget on your site.',
  },
  {
    n: '3',
    h: 'Set up your AI agent',
    p: 'In Settings → AI Agents, create an agent with a system prompt, optional knowledge base for grounded answers, and working hours. Assign it to a channel to enable auto-reply.',
  },
  {
    n: '4',
    h: 'Invite your team',
    p: 'Add supervisors and agents under Settings → Team & Divisions. Conversations can be auto-assigned or manually handed off.',
  },
  {
    n: '5',
    h: 'Start chatting',
    p: 'Open the inbox to see every conversation in real time. Use labels to organize, "/" for quick replies, and the header actions to assign or resolve.',
  },
]

const topics = [
  { h: 'Channels', p: 'WhatsApp, Meta, Telegram, and embeddable webchat.' },
  { h: 'AI & knowledge base', p: 'Auto-reply, RAG grounding, and credit metering.' },
  { h: 'Team & routing', p: 'Roles, divisions, assignment, and handoff.' },
  { h: 'Billing', p: 'Plans, add-ons, invoices, and AI credit top-ups.' },
]
</script>

<template>
  <MetaHead
    title="Documentation"
    description="Get started with Social Forge — connect channels, set up AI, and invite your team."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Documentation</h1>
    <p class="text-muted-foreground mt-3">Everything you need to go from sign-up to first reply.</p>

    <h2 class="mt-10 text-lg font-semibold">Getting started</h2>
    <div class="mt-4 space-y-4">
      <div v-for="step in steps" :key="step.n" class="flex gap-4">
        <div
          class="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        >
          {{ step.n }}
        </div>
        <div>
          <div class="font-semibold">{{ step.h }}</div>
          <p class="text-muted-foreground mt-1 text-sm leading-relaxed">{{ step.p }}</p>
        </div>
      </div>
    </div>

    <h2 class="mt-12 text-lg font-semibold">Explore topics</h2>
    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <div v-for="topic in topics" :key="topic.h" class="bg-card rounded-2xl border p-5">
        <div class="font-semibold">{{ topic.h }}</div>
        <p class="text-muted-foreground mt-1 text-sm">{{ topic.p }}</p>
      </div>
    </div>
  </MarketingShell>
</template>
