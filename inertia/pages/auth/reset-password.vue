<script setup lang="ts">
import type { Data } from '@generated/data'
import { Head, usePage } from '@inertiajs/vue3'
import { Form } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { AlertCircleIcon } from '@lucide/vue'
import { useFlashStore } from '~/stores/flash'

defineProps<{ token: string; email: string }>()

const page = usePage<Data.SharedProps>()

const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const typePassword = ref('password')
const typeConfirmPassword = ref('password')
const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })
</script>

<template>
  <MetaHead
    title="Reset password"
    description="Enter your new password below and start connecting."
    robot="noindex, nofollow"
  />
  <Auth
    type="reset"
    title="Reset password"
    description="Enter your new password below and start connecting."
  >
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing, errors }" :action="{ url: '/reset-password', method: 'post' }">
        <FieldGroup>
          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Failed!</AlertTitle>
            <AlertDescription>
              {{ flash?.error }}
            </AlertDescription>
          </Alert>

          <Field>
            <FieldLabel for="password">New password</FieldLabel>
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
            <FieldLabel for="passwordConfirmation">Confirm new password</FieldLabel>
            <div class="relative">
              <Icon
                icon="material-symbols:lock-outline"
                class="absolute top-1/2 -translate-y-1/2 left-4 text-sans"
              />
              <Input
                id="passwordConfirmation"
                name="passwordConfirmation"
                :type="typeConfirmPassword"
                autocomplete="new-password"
                placeholder="Confirm password"
                class="bg-input-icon pe-10"
                required
                :data-invalid="errors.passwordConfirmation ? 'true' : undefined"
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
            <FieldError v-if="errors.passwordConfirmation"
              >{{ errors.passwordConfirmation }}
            </FieldError>
          </Field>

          <Field>
            <Button type="submit" size="lg" :disabled="processing" class="text-sm">
              <Spinner v-if="processing" />
              {{ processing ? 'Resetting...' : 'Reset password' }}
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
