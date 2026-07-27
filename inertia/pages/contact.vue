<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <MetaHead
    title="Contact"
    description="Get in touch with the Social Forge team — sales, support, and partnerships."
  />
  <MarketingShell>
    <h1 class="text-3xl font-bold tracking-tight">Contact us</h1>
    <p class="text-muted-foreground mt-3">
      We're here to help you unify your customer conversations. Reach out any time.
    </p>

    <div class="mt-10 grid gap-4 sm:grid-cols-2">
      <a
        href="mailto:hello@socialforge.app"
        class="bg-card hover:border-primary/50 flex items-start gap-4 rounded-2xl border p-5 transition-colors"
      >
        <Icon icon="lucide:mail" class="text-primary size-6 shrink-0" />
        <div>
          <div class="font-semibold">General &amp; sales</div>
          <div class="text-muted-foreground text-sm">hello@socialforge.app</div>
        </div>
      </a>
      <a
        href="mailto:support@socialforge.app"
        class="bg-card hover:border-primary/50 flex items-start gap-4 rounded-2xl border p-5 transition-colors"
      >
        <Icon icon="lucide:life-buoy" class="text-primary size-6 shrink-0" />
        <div>
          <div class="font-semibold">Support</div>
          <div class="text-muted-foreground text-sm">support@socialforge.app</div>
        </div>
      </a>
      <div class="bg-card flex items-start gap-4 rounded-2xl border p-5">
        <Icon icon="lucide:map-pin" class="text-primary size-6 shrink-0" />
        <div>
          <div class="font-semibold">Office</div>
          <div class="text-muted-foreground text-sm">Jakarta, Indonesia</div>
        </div>
      </div>
      <a
        href="/help"
        class="bg-card hover:border-primary/50 flex items-start gap-4 rounded-2xl border p-5 transition-colors"
      >
        <Icon icon="lucide:book-open" class="text-primary size-6 shrink-0" />
        <div>
          <div class="font-semibold">Help Center</div>
          <div class="text-muted-foreground text-sm">Browse guides and FAQs</div>
        </div>
      </a>
    </div>
  </MarketingShell>
</template>
