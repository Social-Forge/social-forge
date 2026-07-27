<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useTrans()

const freePerks = ['1 webchat + 1 social channel', '1 AI agent · 200 AI credits', '3 team members']
const proPerks = [
  'WhatsApp + all social channels',
  '5 AI agents · 10,000 AI credits',
  '25 team members · knowledge base',
]
</script>

<template>
  <MetaHead
    title="Pricing"
    description="Simple, transparent pricing — start free and upgrade when you grow."
  />
  <MarketingShell>
    <div class="text-center">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('landing.pricing_title') }}</h1>
      <p class="text-muted-foreground mt-3">{{ t('landing.pricing_subtitle') }}</p>
    </div>

    <div class="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
      <!-- Free -->
      <div class="bg-card rounded-2xl border p-8">
        <h3 class="text-lg font-semibold">Free</h3>
        <p class="text-muted-foreground mt-1 text-sm">{{ t('landing.plan_free_desc') }}</p>
        <div class="mt-4 text-4xl font-bold">Rp0</div>
        <ul class="mt-6 space-y-3 text-sm">
          <li v-for="perk in freePerks" :key="perk" class="flex items-start gap-2">
            <Icon icon="lucide:check" class="text-primary mt-0.5 size-4 shrink-0" />
            <span>{{ perk }}</span>
          </li>
        </ul>
        <a
          href="/signup"
          class="hover:bg-muted mt-8 block rounded-lg border py-2.5 text-center text-sm font-semibold"
        >
          {{ t('landing.get_started') }}
        </a>
      </div>
      <!-- Pro -->
      <div class="border-primary bg-card relative rounded-2xl border-2 p-8 shadow-lg">
        <span
          class="bg-primary text-primary-foreground absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold"
        >
          {{ t('landing.most_popular') }}
        </span>
        <h3 class="text-lg font-semibold">Pro</h3>
        <p class="text-muted-foreground mt-1 text-sm">{{ t('landing.plan_pro_desc') }}</p>
        <div class="mt-4 text-4xl font-bold">
          Rp149.000<span class="text-muted-foreground text-base font-normal">{{
            t('landing.per_month')
          }}</span>
        </div>
        <ul class="mt-6 space-y-3 text-sm">
          <li v-for="perk in proPerks" :key="perk" class="flex items-start gap-2">
            <Icon icon="lucide:check" class="text-primary mt-0.5 size-4 shrink-0" />
            <span>{{ perk }}</span>
          </li>
        </ul>
        <a
          href="/signup"
          class="bg-primary text-primary-foreground mt-8 block rounded-lg py-2.5 text-center text-sm font-semibold"
        >
          {{ t('landing.choose_pro') }}
        </a>
      </div>
    </div>
  </MarketingShell>
</template>
