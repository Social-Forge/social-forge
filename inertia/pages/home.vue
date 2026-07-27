<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { usePage } from '@inertiajs/vue3'
import { Link } from '@adonisjs/inertia/vue'

const { t } = useTrans()
const page = usePage<any>()
const isAuthed = computed(() => Boolean(page.props?.user))

const features = [
  { icon: 'lucide:inbox', title: 'feature_omnichannel_title', desc: 'feature_omnichannel_desc' },
  { icon: 'lucide:bot', title: 'feature_ai_title', desc: 'feature_ai_desc' },
  { icon: 'lucide:zap', title: 'feature_realtime_title', desc: 'feature_realtime_desc' },
  { icon: 'lucide:users', title: 'feature_team_title', desc: 'feature_team_desc' },
  { icon: 'lucide:message-circle', title: 'feature_webchat_title', desc: 'feature_webchat_desc' },
  { icon: 'lucide:credit-card', title: 'feature_billing_title', desc: 'feature_billing_desc' },
]

const freePerks = ['1 webchat + 1 social channel', '1 AI agent · 200 AI credits', '3 team members']
const proPerks = [
  'WhatsApp + all social channels',
  '5 AI agents · 10,000 AI credits',
  '25 team members · knowledge base',
]

const footerLinks = {
  footer_product: [
    { key: 'link_docs', href: '/docs' },
    { key: 'link_roadmap', href: '/roadmap' },
    { key: 'link_help', href: '/help' },
  ],
  footer_company: [
    { key: 'link_about', href: '/about' },
    { key: 'link_blog', href: '/blog' },
    { key: 'link_career', href: '/career' },
    { key: 'link_contact', href: '/contact' },
  ],
  footer_legal: [
    { key: 'link_privacy', href: '/privacy' },
    { key: 'link_terms', href: '/terms' },
  ],
}
</script>

<template>
  <MetaHead />

  <div class="bg-background text-foreground min-h-screen">
    <!-- Header -->
    <header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" class="flex items-center gap-2 font-semibold">
          <img src="/logo.png" alt="Social Forge" class="size-7" />
          <span>Social Forge</span>
        </Link>
        <nav class="text-muted-foreground ml-6 hidden gap-6 text-sm md:flex">
          <a href="#features" class="hover:text-foreground">{{ t('landing.nav_features') }}</a>
          <a href="#pricing" class="hover:text-foreground">{{ t('landing.nav_pricing') }}</a>
          <Link href="/docs" class="hover:text-foreground">{{ t('landing.nav_docs') }}</Link>
        </nav>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            v-if="isAuthed"
            href="/app/chats"
            class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            {{ t('landing.open_app') }}
          </Link>
          <template v-else>
            <Link href="/login" class="hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium">
              {{ t('auth.button_login') }}
            </Link>
            <Link
              href="/signup"
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              {{ t('auth.button_signup') }}
            </Link>
          </template>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="bg-linear-to-br from-primary/20 via-primary/10 to-primary/35">
      <div class="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
        <span
          class="bg-primary/80 dark:bg-primary/60 text-white mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
        >
          <Icon icon="lucide:sparkles" class="size-3.5" /> {{ t('landing.hero_badge') }}
        </span>
        <h1 class="text-4xl font-bold tracking-tight text-balance md:text-6xl">
          {{ t('landing.hero_title') }}
        </h1>
        <p class="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty">
          {{ t('landing.hero_subtitle') }}
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            class="bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-semibold shadow-sm"
          >
            {{ t('landing.hero_cta') }}
          </Link>
          <a
            href="#pricing"
            class="hover:bg-muted rounded-lg border px-6 py-3 text-sm font-semibold"
          >
            {{ t('landing.hero_secondary') }}
          </a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="border-t py-20">
      <div class="mx-auto max-w-6xl px-4">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold">{{ t('landing.features_title') }}</h2>
          <p class="text-muted-foreground mt-3">{{ t('landing.features_subtitle') }}</p>
        </div>
        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="f in features" :key="f.title" class="bg-card rounded-2xl border p-6">
            <div
              class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl"
            >
              <Icon :icon="f.icon" class="size-5" />
            </div>
            <h3 class="mt-4 font-semibold">{{ t(`landing.${f.title}`) }}</h3>
            <p class="text-muted-foreground mt-2 text-sm">{{ t(`landing.${f.desc}`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="border-t py-20">
      <div class="mx-auto max-w-5xl px-4">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold">{{ t('landing.pricing_title') }}</h2>
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
            <Link
              href="/signup"
              class="hover:bg-muted mt-8 block rounded-lg border py-2.5 text-center text-sm font-semibold"
            >
              {{ t('landing.get_started') }}
            </Link>
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
            <Link
              href="/signup"
              class="bg-primary text-primary-foreground mt-8 block rounded-lg py-2.5 text-center text-sm font-semibold"
            >
              {{ t('landing.choose_pro') }}
            </Link>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t py-20">
      <div
        class="bg-primary text-primary-foreground mx-auto max-w-5xl rounded-3xl px-8 py-14 text-center"
      >
        <h2 class="text-3xl font-bold">{{ t('landing.cta_title') }}</h2>
        <p class="mt-3 opacity-90">{{ t('landing.cta_desc') }}</p>
        <Link
          href="/signup"
          class="text-primary mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold shadow-sm"
        >
          {{ t('landing.hero_cta') }}
        </Link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t py-12">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div class="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="Social Forge" class="size-6" />
            <span>Social Forge</span>
          </div>
          <p class="text-muted-foreground mt-3 max-w-xs text-sm">
            {{ t('landing.footer_tagline') }}
          </p>
        </div>
        <div v-for="(links, group) in footerLinks" :key="group">
          <h4 class="text-sm font-semibold">{{ t(`landing.${group}`) }}</h4>
          <ul class="mt-3 space-y-2 text-sm">
            <li v-for="link in links" :key="link.href">
              <Link :href="link.href" class="text-muted-foreground hover:text-foreground">
                {{ t(`landing.${link.key}`) }}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div class="text-muted-foreground mx-auto mt-10 max-w-6xl px-4 text-xs">
        © {{ new Date().getFullYear() }} Social Forge. {{ t('landing.rights') }}
      </div>
    </footer>
  </div>
</template>
