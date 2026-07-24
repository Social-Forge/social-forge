<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from '@lucide/vue'
import { useGlobalAlert } from '@/composables/useAlert'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const { isOpen, currentAlert, currentConfig, handleConfirm, handleCancel, handleOpenChange } =
  useGlobalAlert()

const ICON_MAP = {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} as const

const IconComponent = computed(() => {
  if (!currentConfig.value) return null
  return ICON_MAP[currentConfig.value.icon as keyof typeof ICON_MAP] ?? AlertCircle
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent
      overlay-class="z-[10000]"
      :show-close-button="false"
      :class="
        cn(
          'z-10001 max-w-sm border-2 transition-colors duration-200',
          currentConfig?.containerClass ?? 'border-border'
        )
      "
    >
      <!-- Close button -->
      <button
        v-if="currentAlert && !currentAlert.persistent"
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        @click="handleCancel"
      >
        <X class="h-4 w-4 text-muted-foreground" />
        <span class="sr-only">Close</span>
      </button>

      <!-- Header -->
      <DialogHeader class="items-center text-center sm:items-start sm:text-left">
        <!-- Icon -->
        <div
          v-if="IconComponent"
          :class="
            cn(
              'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm sm:mx-0',
              currentConfig?.containerClass ?? 'border border-border'
            )
          "
        >
          <component
            :is="IconComponent"
            :class="cn('h-7 w-7', currentConfig?.iconClass ?? 'text-muted-foreground')"
          />
        </div>

        <!-- Title & Description -->
        <DialogTitle class="leading-tight">
          {{ currentAlert?.title ?? '' }}
        </DialogTitle>
        <DialogDescription v-if="currentAlert?.description" class="text-center sm:text-left">
          {{ currentAlert.description }}
        </DialogDescription>
      </DialogHeader>

      <!-- Footer -->
      <DialogFooter class="flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <button
          v-if="currentAlert && !currentAlert.persistent"
          type="button"
          :class="
            cn(
              buttonVariants({ variant: 'outline' }),
              'mt-2 cursor-pointer active:scale-95 sm:mt-0',
              currentAlert.cancelClass
            )
          "
          @click="handleCancel"
        >
          {{ currentAlert.cancelLabel }}
        </button>

        <!-- Custom confirm button with dynamic variant -->
        <button
          v-if="currentAlert"
          type="button"
          :class="
            cn(
              buttonVariants({
                variant:
                  currentConfig?.confirmVariant === 'destructive' ? 'destructive' : 'default',
              }),
              'cursor-pointer active:scale-95',
              currentAlert.confirmClass
            )
          "
          @click="handleConfirm"
        >
          {{ currentAlert.confirmLabel }}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
