<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

interface Contact {
  id: string
  displayName: string | null
  externalId: string
  isBlocked: boolean
  attributes: { email?: string; phone?: string; notes?: string } | null
  channel?: { name?: string; type?: string }
  createdAt: string
}

const loading = ref(true)
const contacts = ref<Contact[]>([])
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const blocked = ref('')
const editing = ref<Contact | null>(null)
const form = reactive({ displayName: '', email: '', phone: '', notes: '' })
const saving = ref(false)

async function load() {
  loading.value = true
  const params = new URLSearchParams({ page: String(page.value) })
  if (search.value) params.set('q', search.value)
  if (blocked.value) params.set('blocked', blocked.value)
  const res = await api
    .get<{ data: Contact[]; meta: { lastPage: number } }>(`/app/contacts/list?${params}`)
    .catch(() => null)
  contacts.value = res?.data ?? []
  lastPage.value = res?.meta?.lastPage ?? 1
  loading.value = false
}

function applyFilter() {
  page.value = 1
  load()
}

function openEdit(contact: Contact) {
  editing.value = contact
  form.displayName = contact.displayName ?? ''
  form.email = contact.attributes?.email ?? ''
  form.phone = contact.attributes?.phone ?? ''
  form.notes = contact.attributes?.notes ?? ''
}

async function save() {
  if (!editing.value) return
  saving.value = true
  try {
    await api.put(`/app/contacts/${editing.value.id}`, {
      displayName: form.displayName,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
    })
    editing.value = null
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleBlock(contact: Contact) {
  const action = contact.isBlocked ? 'unblock' : 'block'
  await api.post(`/app/contacts/${contact.id}/${action}`)
  contact.isBlocked = !contact.isBlocked
}

async function remove(contact: Contact) {
  if (!confirm(`Delete contact "${contact.displayName ?? contact.externalId}"?`)) return
  await api.del(`/app/contacts/${contact.id}`)
  await load()
}

function goto(delta: number) {
  const next = page.value + delta
  if (next < 1 || next > lastPage.value) return
  page.value = next
  load()
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/app/chats" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">Contacts</h1>
        <div class="ml-auto flex items-center gap-2">
          <a
            href="/app/contacts/export"
            class="hover:bg-muted flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium"
          >
            <Icon icon="lucide:download" class="size-4" /> Export CSV
          </a>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-8">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <div class="relative flex-1">
          <Icon
            icon="lucide:search"
            class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            v-model="search"
            placeholder="Search name or number…"
            class="bg-muted w-full rounded-lg py-2 pr-3 pl-9 text-sm outline-none"
            @keyup.enter="applyFilter"
          />
        </div>
        <select
          v-model="blocked"
          class="bg-background rounded-lg border px-3 py-2 text-sm"
          @change="applyFilter"
        >
          <option value="">All</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
      </div>

      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <div v-else class="bg-card overflow-hidden rounded-2xl border">
        <div v-if="!contacts.length" class="text-muted-foreground py-12 text-center text-sm">
          No contacts found.
        </div>
        <div v-else class="divide-y">
          <div
            v-for="contact in contacts"
            :key="contact.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div
              class="bg-muted flex size-9 items-center justify-center rounded-full text-sm font-semibold"
            >
              {{ (contact.displayName ?? contact.externalId).slice(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-medium">{{ contact.displayName ?? 'Unknown' }}</span>
                <span
                  v-if="contact.isBlocked"
                  class="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400"
                >
                  Blocked
                </span>
              </div>
              <div class="text-muted-foreground truncate text-xs">
                {{ contact.externalId }} · {{ contact.channel?.name ?? contact.channel?.type }}
              </div>
            </div>
            <button class="hover:bg-muted rounded-lg p-1.5" title="Edit" @click="openEdit(contact)">
              <Icon icon="lucide:pencil" class="size-4" />
            </button>
            <button
              class="hover:bg-muted rounded-lg p-1.5"
              :title="contact.isBlocked ? 'Unblock' : 'Block'"
              @click="toggleBlock(contact)"
            >
              <Icon :icon="contact.isBlocked ? 'lucide:check' : 'lucide:ban'" class="size-4" />
            </button>
            <button
              class="hover:bg-muted rounded-lg p-1.5 text-red-600"
              title="Delete"
              @click="remove(contact)"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="lastPage > 1" class="mt-4 flex items-center justify-center gap-4 text-sm">
        <button
          class="hover:bg-muted rounded-lg border px-3 py-1.5 disabled:opacity-40"
          :disabled="page <= 1"
          @click="goto(-1)"
        >
          Prev
        </button>
        <span class="text-muted-foreground">Page {{ page }} / {{ lastPage }}</span>
        <button
          class="hover:bg-muted rounded-lg border px-3 py-1.5 disabled:opacity-40"
          :disabled="page >= lastPage"
          @click="goto(1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Edit dialog -->
    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="editing = null"
    >
      <div class="bg-card w-full max-w-md space-y-4 rounded-2xl border p-6">
        <h2 class="text-lg font-semibold">Edit contact</h2>
        <label class="block">
          <span class="text-sm font-medium">Name</span>
          <input
            v-model="form.displayName"
            class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Email</span>
          <input
            v-model="form.email"
            type="email"
            class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Phone</span>
          <input
            v-model="form.phone"
            class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">Notes</span>
          <textarea
            v-model="form.notes"
            rows="3"
            class="bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <div class="flex justify-end gap-2">
          <button
            class="hover:bg-muted rounded-lg border px-4 py-2 text-sm"
            @click="editing = null"
          >
            Cancel
          </button>
          <button
            class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
