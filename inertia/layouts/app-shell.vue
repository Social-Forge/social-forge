<script setup lang="ts">
import type { Data } from '@generated/data'
import { usePage } from '@inertiajs/vue3'

const props = defineProps<{
  title?: string
  subTitle?: string
  description?: string
}>()

const page = usePage<Data.SharedProps>()
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <header class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#">
                {{ page.props.title }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ page.props.subTitle }}</BreadcrumbPage>
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
