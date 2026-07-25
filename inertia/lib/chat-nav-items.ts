export interface ChatNavItem {
  title: string
  url: string
  icon: string
}

export const chatNavItems: ChatNavItem[] = [
  { title: 'Chats', url: '/app/chats', icon: 'lucide:message-circle-more' },
  { title: 'Contacts', url: '/app/contacts', icon: 'lucide:contact-round' },
  { title: 'Campaign', url: '/app/campaigns', icon: 'lucide:megaphone' },
  { title: 'Analytics', url: '/app/analytics', icon: 'lucide:chart-line' },
  { title: 'Channels', url: '/app/channels', icon: 'lucide:antenna' },
  { title: 'Settings', url: '/app/settings', icon: 'lucide:settings' },
]
