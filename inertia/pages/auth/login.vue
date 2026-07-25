<script setup lang="ts">
import type { Data } from '@generated/data'
import { Form, Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { AlertCircleIcon } from '@lucide/vue'

const page = usePage<Data.SharedProps>()

const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const typePassword = ref('password')
const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })
</script>

<template>
  <MetaHead title="Login" description="Enter your account and start connecting." />
  <Auth type="login" title="Login" description="Enter your account and start connecting.">
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing, errors }" route="session.store">
        <FieldGroup>
          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Login failed!</AlertTitle>
            <AlertDescription>
              {{ flash?.error }}
            </AlertDescription>
          </Alert>

          <Field>
            <FieldLabel for="email">Email</FieldLabel>
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
            <div class="flex items-center">
              <FieldLabel for="password"> Password </FieldLabel>
              <Link
                href="/forgot-password"
                class="ml-auto text-xs underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div class="relative">
              <Icon
                icon="material-symbols:lock-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="password"
                name="password"
                :type="typePassword"
                autocomplete="current-password"
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
            <Button type="submit" size="lg" :disabled="processing" class="text-sm">
              <Spinner v-if="processing" />
              {{ processing ? 'Logging in...' : 'Login' }}
            </Button>
          </Field>

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
