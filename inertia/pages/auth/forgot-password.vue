<script setup lang="ts">
import type { Data } from '@generated/data'
import { Head, usePage } from '@inertiajs/vue3'
import { Form, Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { AlertCircleIcon, CheckCircle2Icon } from '@lucide/vue'
import { useFlashStore } from '~/stores/flash'

const page = usePage<Data.SharedProps>()

const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })
</script>

<template>
  <MetaHead title="Forgot Password" description="Enter your password." />
  <Auth
    type="forgot"
    title="Forgot Password"
    description="Enter your email to reset your password."
  >
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing, errors }" :action="{ url: '/forgot-password', method: 'post' }">
        <FieldGroup>
          <Alert v-if="flash?.success" class="bg-primary/20 text-primary">
            <CheckCircle2Icon />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              {{ flash?.success }}
            </AlertDescription>
          </Alert>

          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Failed!</AlertTitle>
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
            <Button type="submit" size="lg" :disabled="processing" class="text-sm">
              <Spinner v-if="processing" />
              {{ processing ? 'Sending...' : 'Send Reset Link' }}
            </Button>
          </Field>

          <Field>
            <Link href="/login" class="w-full">
              <Button
                type="button"
                variant="outline"
                size="lg"
                :disabled="processing"
                class="text-sm w-full"
              >
                Back to Login
              </Button>
            </Link>
          </Field>
        </FieldGroup>
      </Form>
      <FieldDescription class="px-6 text-center text-xs">
        © {{ currentYear }} <span class="font-bold">Social Forge</span>. All rights reserved.
      </FieldDescription>
    </div>
  </Auth>
</template>
