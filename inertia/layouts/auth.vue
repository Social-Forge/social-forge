<script setup lang="ts">
import { Link } from '@adonisjs/inertia/vue'

const props = defineProps<{
  type: 'login' | 'signup' | 'forgot' | 'confirm' | 'verify' | 'otp' | 'reset'
  title?: string
  description?: string
}>()

const { t } = useTrans()
</script>

<template>
  <div
    class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative"
  >
    <div class="absolute top-6 left-6 right-6 hidden lg:flex items-center justify-between px-6">
      <Link href="/" class="flex items-center">
        <img src="/logo-small.png" alt="Logo" class="w-auto h-8 object-cover" />
      </Link>
      <div v-if="type === 'login' || type === 'signup'" class="flex items-center gap-2">
        <div class="text-sm font-sans">
          {{ type === 'login' ? t('auth.dont_have_account') : t('auth.already_have_account') }}
        </div>
        <Link v-if="type === 'login'" href="/signup">
          <Button type="button" class="text-sm font-sans px-6" size="lg">
            {{ t('auth.button_signup') }}
          </Button>
        </Link>
        <Link v-else-if="type === 'signup'" href="/login">
          <Button type="button" class="text-sm font-sans px-6" size="lg">
            {{ t('auth.button_login') }}
          </Button>
        </Link>
      </div>
      <div v-else class="flex items-center gap-2">
        <Link href="/login">
          <Button type="button" variant="outline" class="text-sm font-sans px-6" size="lg">
            {{ t('auth.button_login') }}
          </Button>
        </Link>
        <Link href="/signup">
          <Button type="button" variant="default" class="text-sm font-sans px-6" size="lg">
            {{ t('auth.button_signup') }}
          </Button>
        </Link>
      </div>
    </div>
    <div class="w-full max-w-md space-y-4">
      <Link href="/" class="flex lg:hidden items-center justify-center">
        <img src="/logo-small.png" alt="Logo" class="w-auto h-8 object-cover" />
      </Link>
      <div class="space-y-2 text-center font-sans">
        <h2 v-if="title" class="text-3xl font-bold">{{ title }}</h2>
        <p v-if="description" class="text-sm font-sans">{{ description }}</p>
      </div>
      <slot />
    </div>
    <div class="fixed bottom-16 right-6 space-y-2">
      <LanguageSwitcher />
    </div>
    <div class="fixed bottom-6 right-6 space-y-2">
      <ThemeToggle />
    </div>
  </div>
</template>
