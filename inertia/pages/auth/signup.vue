<script setup lang="ts">
import type { Data } from '@generated/data'
import { Head, usePage } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { AlertCircleIcon } from '@lucide/vue'
import { useFlashStore } from '~/stores/flash'

const page = usePage<Data.SharedProps>()

const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const typePassword = ref('password')
const typeConfirmPassword = ref('password')
const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })
</script>

<template>
  <Head title="Signup" robot="index, follow" />
  <Auth type="signup" title="Signup" description="Enter your details below and start connecting.">
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing, errors }" route="new_account.store">
        <FieldGroup>
          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Signup failed!</AlertTitle>
            <AlertDescription>
              {{ flash?.error }}
            </AlertDescription>
          </Alert>

          <Field>
            <FieldLabel for="fullName">Full name</FieldLabel>
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
            <FieldLabel for="password">Password</FieldLabel>
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
            <FieldLabel for="confirmPassword">Confirm password</FieldLabel>
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

          <Field>
            <Button type="submit" size="lg" :disabled="processing" class="text-sm">
              <Spinner v-if="processing" />
              {{ processing ? 'Signing up...' : 'Sign up' }}
            </Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>
          <Field class="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button" size="lg" class="text-sm">
              <Icon icon="material-icon-theme:google" />
              Sign up with Google
            </Button>
            <Button variant="outline" type="button" size="lg" class="text-sm">
              <Icon icon="mdi:github" />
              Sign up with GitHub
            </Button>
          </Field>
        </FieldGroup>
      </Form>
      <FieldDescription class="px-6 text-center text-xs">
        © {{ currentYear }} <span class="font-bold">Social Forge</span>. All rights reserved.
      </FieldDescription>
    </div>
  </Auth>
</template>
