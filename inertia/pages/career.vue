<script setup lang="ts">
import { Icon } from '@iconify/vue'

const openings = [
  {
    role: 'Senior Full-Stack Engineer',
    type: 'Remote · Full-time',
    stack: 'AdonisJS · Vue · Postgres',
  },
  { role: 'Product Designer', type: 'Remote · Full-time', stack: 'UI/UX · Design systems' },
  { role: 'Customer Success Lead', type: 'Jakarta · Full-time', stack: 'SaaS · Onboarding' },
]
</script>

<template>
  <MetaHead
    title="Careers"
    description="Join Social Forge and help teams talk to their customers better."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Careers</h1>
    <p class="text-muted-foreground mt-3">
      We're a small, focused team building the customer conversation layer for modern businesses. If
      you care about reliability, craft, and shipping, we'd love to meet you.
    </p>

    <h2 class="mt-10 text-lg font-semibold">Open roles</h2>
    <div class="mt-4 space-y-3">
      <div
        v-for="job in openings"
        :key="job.role"
        class="bg-card flex items-center gap-4 rounded-2xl border p-5"
      >
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ job.role }}</div>
          <div class="text-muted-foreground text-sm">{{ job.type }} · {{ job.stack }}</div>
        </div>
        <a
          href="mailto:careers@socialforge.app"
          class="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Apply <Icon icon="lucide:arrow-right" class="size-4" />
        </a>
      </div>
    </div>

    <p class="text-muted-foreground mt-8 text-sm">
      Don't see your role? Send your CV to
      <a href="mailto:careers@socialforge.app" class="text-primary hover:underline"
        >careers@socialforge.app</a
      >.
    </p>
  </MarketingShell>
</template>
