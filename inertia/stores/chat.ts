import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '~/composables/useApi'

export interface ChatContact {
  id: string
  displayName: string | null
  avatarUrl: string | null
  externalId: string
}
export interface ChatChannel {
  id: string
  type: string
  name: string
}
export interface ChatMessage {
  id: string
  conversationId: string
  direction: 'in' | 'out'
  senderType: string
  contentType: string
  body: string | null
  media: any
  status: string
  createdAt: string
  providerMessageId?: string | null
}
export interface Conversation {
  id: string
  contactId: string
  channelId: string
  assignedAgentId: string | null
  status: string
  unreadCount: number
  isPinned?: boolean
  lastMessageAt: string | null
  contact?: ChatContact
  channel?: ChatChannel
  messages?: ChatMessage[]
}

export type ChatFilter = 'all' | 'unassigned' | 'mine' | 'unread'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loadingList = ref(false)
  const loadingRoom = ref(false)
  const sending = ref(false)
  const search = ref('')
  const filter = ref<ChatFilter>('all')
  const currentUserId = ref<string | null>(null)

  const active = computed(() => conversations.value.find((c) => c.id === activeId.value) ?? null)

  const totalUnread = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  )

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase()
    return conversations.value
      .filter((c) => {
        if (filter.value === 'unassigned' && c.assignedAgentId) return false
        if (filter.value === 'mine' && c.assignedAgentId !== currentUserId.value) return false
        if (filter.value === 'unread' && !c.unreadCount) return false
        if (!term) return true
        const name = (c.contact?.displayName || c.contact?.externalId || '').toLowerCase()
        const last = (c.messages?.[0]?.body || '').toLowerCase()
        return name.includes(term) || last.includes(term)
      })
      .sort((a, b) => {
        if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1
        return (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')
      })
  })

  function find(id: string) {
    return conversations.value.find((c) => c.id === id)
  }

  async function loadConversations() {
    loadingList.value = true
    try {
      conversations.value = await api.get<Conversation[]>('/app/conversations')
    } finally {
      loadingList.value = false
    }
  }

  async function open(id: string) {
    activeId.value = id
    loadingRoom.value = true
    try {
      messages.value = await api.get<ChatMessage[]>(`/app/conversations/${id}/messages`)
    } finally {
      loadingRoom.value = false
    }
    void markRead(id)
  }

  async function markRead(id: string) {
    const c = find(id)
    if (c && c.unreadCount > 0) {
      c.unreadCount = 0
      await api.post(`/app/conversations/${id}/read`).catch(() => {})
    }
  }

  async function send(body: string) {
    const id = activeId.value
    if (!id || !body.trim()) return
    sending.value = true
    try {
      const message = await api.post<ChatMessage>(`/app/conversations/${id}/messages`, {
        body: body.trim(),
      })
      upsertMessage(message)
      bumpConversation(id, message)
    } finally {
      sending.value = false
    }
  }

  async function act(id: string, action: 'assign' | 'unassign' | 'complete' | 'reopen') {
    const updated = await api.post<Conversation>(`/app/conversations/${id}/${action}`)
    upsertConversation(updated)
  }

  // --- realtime handlers ---
  function upsertMessage(message: ChatMessage) {
    if (message.conversationId !== activeId.value) return
    const idx = messages.value.findIndex((m) => m.id === message.id)
    if (idx >= 0) messages.value[idx] = message
    else messages.value.push(message)
  }

  function updateMessageStatus(id: string, status: string) {
    const m = messages.value.find((x) => x.id === id)
    if (m) m.status = status
  }

  function bumpConversation(id: string, message: ChatMessage) {
    const c = find(id)
    if (!c) return
    c.lastMessageAt = message.createdAt
    c.messages = [message]
    if (message.direction === 'in' && id !== activeId.value)
      c.unreadCount = (c.unreadCount || 0) + 1
  }

  function upsertConversation(conv: Conversation) {
    const idx = conversations.value.findIndex((c) => c.id === conv.id)
    if (idx >= 0) conversations.value[idx] = { ...conversations.value[idx], ...conv }
    else conversations.value.unshift(conv)
  }

  function onRealtimeInbox(data: any) {
    if (data?.type === 'conversation.updated' && data.conversation) {
      upsertConversation(data.conversation)
    }
  }

  function onRealtimeConversation(data: any) {
    if (data?.type === 'message.new' && data.message) {
      upsertMessage(data.message)
      bumpConversation(data.message.conversationId, data.message)
    } else if (data?.type === 'message.status' && data.id) {
      updateMessageStatus(data.id, data.status)
    }
  }

  return {
    conversations,
    activeId,
    messages,
    loadingList,
    loadingRoom,
    sending,
    search,
    filter,
    currentUserId,
    active,
    totalUnread,
    filtered,
    loadConversations,
    open,
    markRead,
    send,
    act,
    onRealtimeInbox,
    onRealtimeConversation,
  }
})
