<script setup lang="ts">
import type { Data } from '@generated/data'
import { Form } from '@adonisjs/inertia/vue'
import { AlertCircleIcon, CheckCircle2Icon } from '@lucide/vue'

const page = usePage<Data.SharedProps>()

const { t } = useTrans()
const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

const currentYear = ref(new Date().getFullYear())

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })
</script>

<template>
  <MetaHead
    :title="t('auth.verify_email')"
    :description="t('auth.verify_email_description')"
    robot="noindex, nofollow"
  />
  <Auth
    type="verify"
    :title="t('auth.verify_email')"
    :description="t('auth.verify_email_description')"
  >
    <div class="flex flex-col gap-6">
      <Form v-slot="{ processing }" :action="{ url: '/verify-email/resend', method: 'post' }">
        <FieldGroup>
          <Alert v-if="flash?.success" class="bg-primary/20 text-primary">
            <CheckCircle2Icon />
            <AlertTitle>{{ t('alert.success') }}</AlertTitle>
            <AlertDescription>
              {{ flash?.success }}
            </AlertDescription>
          </Alert>

          <Alert v-if="flash?.error" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{{ t('alert.failed') }}</AlertTitle>
            <AlertDescription>
              {{ flash?.error }}
            </AlertDescription>
          </Alert>

          <Field>
            <Button
              variant="outline"
              size="lg"
              class="w-full text-sm"
              type="submit"
              :disabled="processing"
            >
              <Spinner v-if="processing" />
              {{ processing ? t('auth.sending') : t('auth.resend_verification_email') }}
            </Button>
          </Field>
        </FieldGroup>
      </Form>

      <Form route="session.destroy">
        <FieldGroup>
          <Field>
            <Button type="submit" variant="outline" size="lg" class="w-full text-sm">
              {{ t('auth.log_out_and_use_another_account') }}
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
