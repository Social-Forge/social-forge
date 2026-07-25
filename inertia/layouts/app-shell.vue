<script setup lang="ts">
import { watch } from 'vue'
import { toast, Toaster } from 'vue-sonner'
import type { Data } from '@generated/data'

const props = defineProps<{
  title?: string
  description?: string
}>()

const page = usePage<Data.SharedProps>()
const flashStore = useFlashStore()

const flash = computed(() => page.props?.flash)

watch(flash, (value) => flashStore.setFlash(value), { immediate: true })

watch(
  () => page.url,
  () => toast.dismiss()
)

watch(
  () => flashStore.flash,
  (flashMessages) => {
    if (flashMessages?.error) {
      toast.error(flashMessages.error)
    }
    if (flashMessages?.success) {
      toast.success(flashMessages.success)
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <Toaster position="top-center" rich-colors />
  <SidebarProvider
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <header class="bg-sidebar sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#">
                {{ props.title }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ props.description }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
