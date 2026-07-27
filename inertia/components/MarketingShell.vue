<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

const { t } = useTrans()
const page = usePage<any>()
const isAuthed = computed(() => Boolean(page.props?.user))

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
  <div class="bg-background text-foreground min-h-screen">
    <!-- Header -->
    <header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <img src="/logo.png" alt="Social Forge" class="size-7" />
          <span>Social Forge</span>
        </a>
        <nav class="text-muted-foreground ml-6 hidden gap-6 text-sm md:flex">
          <a href="/#features" class="hover:text-foreground">{{ t('landing.nav_features') }}</a>
          <a href="/#pricing" class="hover:text-foreground">{{ t('landing.nav_pricing') }}</a>
          <a href="/docs" class="hover:text-foreground">{{ t('landing.nav_docs') }}</a>
        </nav>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <a
            v-if="isAuthed"
            href="/app/chats"
            class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            {{ t('landing.open_app') }}
          </a>
          <template v-else>
            <a href="/login" class="hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium">
              {{ t('auth.button_login') }}
            </a>
            <a
              href="/signup"
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              {{ t('auth.button_signup') }}
            </a>
          </template>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="mx-auto max-w-3xl px-4 py-14">
      <slot />
    </main>

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
              <a :href="link.href" class="text-muted-foreground hover:text-foreground">
                {{ t(`landing.${link.key}`) }}
              </a>
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
