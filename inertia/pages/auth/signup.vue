<script setup lang="ts">
import type { Data } from '@generated/data'
import { Form, Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { AlertCircleIcon } from '@lucide/vue'

const props = defineProps<{ turnstileSiteKey?: string | null }>()

const page = usePage<Data.SharedProps>()

const { t } = useTrans()
const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const typePassword = ref('password')
const typeConfirmPassword = ref('password')
const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })

// Load the Cloudflare Turnstile widget script only when a site key is provided.
onMounted(() => {
  if (!props.turnstileSiteKey) return
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
  script.async = true
  script.defer = true
  document.head.appendChild(script)
})
</script>

<template>
  <MetaHead :title="t('auth.button_signup')" :description="t('auth.signup_description')" />
  <Auth type="signup" :title="t('auth.button_signup')" :description="t('auth.signup_description')">
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing, errors }" route="new_account.store">
        <FieldGroup>
          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{{ t('alert.failed') }}</AlertTitle>
            <AlertDescription>
              {{ flash?.error }}
            </AlertDescription>
          </Alert>

          <Field>
            <FieldLabel for="tenantName">{{ t('field.business_name') }}</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:storefront-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="tenantName"
                type="text"
                name="tenantName"
                autocomplete="organization"
                class="bg-input-icon"
                placeholder="Acme Store"
                required
                :data-invalid="errors.tenantName ? 'true' : undefined"
              />
            </div>
            <FieldError v-if="errors.tenantName">{{ errors.tenantName }}</FieldError>
          </Field>

          <Field>
            <FieldLabel for="fullName">{{ t('field.full_name') }}</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:account-circle"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="fullName"
                type="text"
                name="fullName"
                autocomplete="name"
                class="bg-input-icon"
                placeholder="John Doe"
                required
                :data-invalid="errors.fullName ? 'true' : undefined"
              />
            </div>
            <FieldError v-if="errors.fullName">{{ errors.fullName }}</FieldError>
          </Field>

          <Field>
            <FieldLabel for="email">{{ t('field.email') }}</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:mail-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                class="bg-input-icon"
                placeholder="user@example.com"
                required
                :data-invalid="errors.email ? 'true' : undefined"
              />
            </div>
            <FieldError v-if="errors.email">{{ errors.email }}</FieldError>
          </Field>

          <Field>
            <FieldLabel for="password">{{ t('field.password') }}</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:lock-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="password"
                name="password"
                :type="typePassword"
                autocomplete="new-password"
                placeholder="Password"
                class="bg-input-icon pe-10"
                required
                :data-invalid="errors.password ? 'true' : undefined"
              />
              <button
                type="button"
                class="absolute top-1/2 -translate-y-1/2 right-4 text-sans"
                @click="typePassword = typePassword === 'password' ? 'text' : 'password'"
              >
                <Icon
                  :icon="
                    typePassword === 'password'
                      ? 'material-symbols:visibility-outline'
                      : 'material-symbols:visibility-off-outline'
                  "
                />
              </button>
            </div>
            <FieldError v-if="errors.password">{{ errors.password }}</FieldError>
          </Field>

          <Field>
            <FieldLabel for="confirmPassword">{{ t('field.confirm_password') }}</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:lock-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                :type="typeConfirmPassword"
                autocomplete="new-password"
                placeholder="Confirm password"
                class="bg-input-icon pe-10"
                required
                :data-invalid="errors.confirmPassword ? 'true' : undefined"
              />
              <button
                type="button"
                class="absolute top-1/2 -translate-y-1/2 right-4 text-sans"
                @click="
                  typeConfirmPassword = typeConfirmPassword === 'password' ? 'text' : 'password'
                "
              >
                <Icon
                  :icon="
                    typeConfirmPassword === 'password'
                      ? 'material-symbols:visibility-outline'
                      : 'material-symbols:visibility-off-outline'
                  "
                />
              </button>
            </div>
            <FieldError v-if="errors.confirmPassword">{{ errors.confirmPassword }}</FieldError>
          </Field>

          <Field v-if="turnstileSiteKey">
            <div class="cf-turnstile" :data-sitekey="turnstileSiteKey" />
            <FieldError v-if="errors.captcha">{{ errors.captcha }}</FieldError>
          </Field>

          <Field>
            <Button type="submit" size="lg" :disabled="processing" class="text-sm">
              <Spinner v-if="processing" />
              {{ processing ? t('auth.signing_up') : t('auth.button_signup') }}
            </Button>
          </Field>

          <FieldSeparator>{{ t('auth.or_continue_with') }}</FieldSeparator>
          <Field class="grid gap-4 sm:grid-cols-3">
            <!-- Full-page navigation (not Inertia) — OAuth redirects off-site. -->
            <a href="/oauth/google/redirect" class="w-full">
              <Button variant="outline" type="button" size="lg" class="text-sm w-full">
                <Icon icon="material-icon-theme:google" />
                Google
              </Button>
            </a>
            <a href="/oauth/github/redirect" class="w-full">
              <Button variant="outline" type="button" size="lg" class="text-sm w-full">
                <Icon icon="mdi:github" />
                GitHub
              </Button>
            </a>
            <a href="/oauth/facebook/redirect" class="w-full">
              <Button variant="outline" type="button" size="lg" class="text-sm w-full">
                <Icon icon="logos:facebook" />
                Facebook
              </Button>
            </a>
          </Field>
        </FieldGroup>
      </Form>
      <FieldDescription class="px-6 text-center text-xs">
        © {{ currentYear }} <span class="font-bold">Social Forge</span>. All rights reserved.
      </FieldDescription>
    </div>
  </Auth>
</template>
