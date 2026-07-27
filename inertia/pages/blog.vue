<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <MetaHead
    title="Blog"
    description="Insights on omnichannel customer service, AI, and CRM from the Social Forge team."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Blog</h1>
    <p class="text-muted-foreground mt-3">
      Insights on omnichannel customer service, AI, and building better customer relationships.
    </p>

    <div class="bg-card mt-10 flex flex-col items-center rounded-2xl border py-16 text-center">
      <Icon icon="lucide:pen-line" class="text-primary size-10" />
      <h2 class="mt-4 text-lg font-semibold">Articles coming soon</h2>
      <p class="text-muted-foreground mt-2 max-w-sm text-sm">
        We're writing our first posts. In the meantime, explore the product or reach out with
        questions.
      </p>
      <div class="mt-6 flex gap-3">
        <a href="/docs" class="hover:bg-muted rounded-lg border px-4 py-2 text-sm font-semibold">
          Read the docs
        </a>
        <a
          href="/signup"
          class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Try Social Forge
        </a>
      </div>
    </div>
  </MarketingShell>
</template>
