import { ref, shallowRef, computed } from 'vue'

export type AlertType = 'error' | 'success' | 'warning' | 'info'

export interface AlertOptions {
  /** Judul dialog */
  title: string
  /** Isi pesan */
  description?: string
  /** Label tombol konfirmasi (default: "Confirm") */
  confirmLabel?: string
  /** Label tombol cancel (default: "Cancel") */
  cancelLabel?: string
  /** Class tambahan untuk tombol confirm */
  confirmClass?: string
  /** Class tambahan untuk tombol cancel */
  cancelClass?: string
  /** Apakah dialog closable via backdrop/ESC (default: true) */
  persistent?: boolean
  /** Callback saat confirm ditekan */
  onConfirm?: () => void | Promise<void>
  /** Callback saat cancel / close */
  onCancel?: () => void
}

const ALERT_CONFIG: Record<
  AlertType,
  {
    icon: string
    iconClass: string
    containerClass: string
    confirmVariant: 'destructive' | 'default'
  }
> = {
  error: {
    icon: 'AlertCircle',
    iconClass: 'text-destructive',
    containerClass: 'border-destructive/30 bg-destructive/5',
    confirmVariant: 'destructive',
  },
  success: {
    icon: 'CheckCircle2',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    containerClass: 'border-emerald-500/30 bg-emerald-500/5',
    confirmVariant: 'default',
  },
  warning: {
    icon: 'AlertTriangle',
    iconClass: 'text-yellow-500 dark:text-yellow-400',
    containerClass: 'border-yellow-500/30 bg-yellow-500/5',
    confirmVariant: 'default',
  },
  info: {
    icon: 'Info',
    iconClass: 'text-blue-500 dark:text-blue-400',
    containerClass: 'border-blue-500/30 bg-blue-500/5',
    confirmVariant: 'default',
  },
}

interface AlertInstance {
  id: string
  type: AlertType
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  confirmClass: string
  cancelClass: string
  persistent: boolean
  resolve: (value: boolean) => void
}

const alertQueue = shallowRef<AlertInstance[]>([])
const isOpen = ref(false)

function generateId() {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function openNext() {
  if (alertQueue.value.length > 0) {
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function close(resolveValue: boolean) {
  const current = alertQueue.value[0]
  if (current) {
    alertQueue.value = alertQueue.value.slice(1)
    current.resolve(resolveValue)
  }
  openNext()
}

export function useAlert() {
  /**
   * Current active alert (first in queue)
   */
  const currentAlert = computed<AlertInstance | null>(() => alertQueue.value[0] ?? null)

  /**
   * Current alert type config
   */
  const currentConfig = computed(() => {
    if (!currentAlert.value) return null
    return ALERT_CONFIG[currentAlert.value.type]
  })

  /**
   * Open a styled alert dialog.
   * Returns a Promise<boolean> — true = confirmed, false = cancelled
   */
  const alert = (
    type: AlertType,
    title: string,
    options: Omit<AlertOptions, 'title'> & { description?: string } = {}
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = generateId()
      const instance: AlertInstance = {
        id,
        type,
        title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        confirmClass: options.confirmClass ?? '',
        cancelClass: options.cancelClass ?? '',
        persistent: options.persistent ?? false,
        resolve,
      }

      alertQueue.value = [...alertQueue.value, instance]

      // Auto-open only if this is the first (and queue was empty)
      if (alertQueue.value.length === 1) {
        isOpen.value = true
      }
    })
  }

  // ─── Shorthand Methods ──────────────────────────────────────────────────────

  const confirm = (
    title: string,
    description?: string,
    options?: Omit<AlertOptions, 'title' | 'description'> & { description?: never }
  ): Promise<boolean> => alert('info', title, { ...options, description })

  const success = (title: string, description?: string): Promise<boolean> =>
    alert('success', title, { description })

  const error = (title: string, description?: string): Promise<boolean> =>
    alert('error', title, { description })

  const warning = (title: string, description?: string): Promise<boolean> =>
    alert('warning', title, { description })

  // ─── Internal Handlers (called by GlobalAlertDialog.vue) ────────────────────

  const handleConfirm = () => {
    close(true)
  }

  const handleCancel = () => {
    close(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && currentAlert.value && !currentAlert.value.persistent) {
      // Closed via backdrop / ESC
      handleCancel()
    }
  }

  return {
    // State
    isOpen,
    currentAlert,
    currentConfig,

    // Raw alert
    alert,

    // Shorthands
    confirm,
    success,
    error,
    warning,

    // Internal (used by GlobalAlertDialog)
    handleConfirm,
    handleCancel,
    handleOpenChange,
  }
}

export const useGlobalAlert = useAlert
