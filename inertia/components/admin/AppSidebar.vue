<script setup lang="ts">
import { type SidebarProps } from '@/components/ui/sidebar'
import { Link } from '@adonisjs/inertia/vue'
import { usePage } from '@inertiajs/vue3'
import { cn } from '~/lib/utils'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const page = usePage()

const menuItem = {
  navMain: [
    {
      title: 'Chats',
      url: '/app/chats',
      icon: 'lucide:message-circle-more',
      isActive: true,
    },
    {
      title: 'Chatbot Automation',
      url: '/app/chatbot-ai',
      icon: 'lucide:bot',
      isActive: false,
    },
    {
      title: 'Contact',
      url: '/app/contacts',
      icon: 'lucide:circle-user-round',
      isActive: false,
    },
    {
      title: 'Campaign',
      url: '/app/campaigns',
      icon: 'ph:megaphone-bold',
      isActive: false,
    },
    {
      title: 'Analytics',
      url: '/app/analytics',
      icon: 'lucide:chart-line',
      isActive: false,
    },
  ],
  navSetting: [
    {
      title: 'Integration',
      url: '/app/integrations',
      icon: 'oui:nav-integrations',
      isActive: false,
    },
    {
      title: 'Settings',
      url: '/app/settings',
      icon: 'material-symbols:settings',
      isActive: false,
    },
  ],
}
</script>

<template>
  <Sidebar class="overflow-hidden *:data-[sidebar=sidebar]:flex-row" v-bind="props">
    <Sidebar collapsible="none" class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">Social Forge</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in menuItem.navMain" :key="item.title">
                <SidebarMenuButton
                  :tooltip="item.title"
                  :is-active="page.url.startsWith(item.url)"
                  :class="
                    cn('px-2.5 md:px-2', {
                      'bg-primary text-white rounded-full': page.url.startsWith(item.url),
                    })
                  "
                >
                  <Link :href="item.url">
                    <Icon :icon="item.icon" />
                    <span>{{ item.title }}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </Sidebar>
</template>
