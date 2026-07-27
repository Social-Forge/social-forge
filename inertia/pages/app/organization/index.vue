<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Link } from '@adonisjs/inertia/vue'
import { Icon } from '@iconify/vue'
import { api } from '~/composables/useApi'

interface Division {
  id: string
  name: string
}
interface Member {
  id: string
  fullName: string | null
  email: string
  status: string
  role?: { name?: string }
}

const loading = ref(true)
const divisions = ref<Division[]>([])
const members = ref<Member[]>([])

const divisionName = ref('')
const savingDivision = ref(false)

const memberForm = reactive({ fullName: '', email: '', password: '', role: 'agent' })
const savingMember = ref(false)
const memberError = ref('')

async function load() {
  loading.value = true
  const [d, m] = await Promise.all([
    api.get<Division[]>('/app/divisions').catch(() => []),
    api.get<Member[]>('/app/team').catch(() => []),
  ])
  divisions.value = d ?? []
  members.value = m ?? []
  loading.value = false
}

async function addDivision() {
  if (!divisionName.value.trim()) return
  savingDivision.value = true
  try {
    await api.post('/app/divisions', { name: divisionName.value })
    divisionName.value = ''
    await load()
  } finally {
    savingDivision.value = false
  }
}
async function removeDivision(division: Division) {
  if (!confirm(`Delete division "${division.name}"?`)) return
  await api.del(`/app/divisions/${division.id}`)
  await load()
}

async function addMember() {
  memberError.value = ''
  if (!memberForm.email.trim() || memberForm.password.length < 8) {
    memberError.value = 'Email required and password must be at least 8 characters.'
    return
  }
  savingMember.value = true
  try {
    await api.post('/app/team', {
      fullName: memberForm.fullName || null,
      email: memberForm.email,
      password: memberForm.password,
      role: memberForm.role,
    })
    memberForm.fullName = ''
    memberForm.email = ''
    memberForm.password = ''
    memberForm.role = 'agent'
    await load()
  } catch (e: any) {
    memberError.value = e?.body?.message ?? 'Failed to add member.'
  } finally {
    savingMember.value = false
  }
}
async function removeMember(member: Member) {
  if (!confirm(`Remove "${member.fullName ?? member.email}"?`)) return
  await api.del(`/app/team/${member.id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="bg-background text-foreground min-h-screen">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <Link href="/app/settings" class="text-muted-foreground hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="size-5" />
        </Link>
        <h1 class="font-semibold">Team & Divisions</h1>
        <div class="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div v-if="loading" class="text-muted-foreground py-16 text-center text-sm">Loading…</div>

      <template v-else>
        <!-- Team -->
        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Team members</h2>
          <div class="bg-card grid gap-3 rounded-2xl border p-5 sm:grid-cols-2">
            <input
              v-model="memberForm.fullName"
              placeholder="Full name"
              class="bg-background rounded-lg border px-3 py-2 text-sm"
            />
            <input
              v-model="memberForm.email"
              type="email"
              placeholder="Email"
              class="bg-background rounded-lg border px-3 py-2 text-sm"
            />
            <input
              v-model="memberForm.password"
              type="password"
              placeholder="Password (min 8)"
              class="bg-background rounded-lg border px-3 py-2 text-sm"
            />
            <select
              v-model="memberForm.role"
              class="bg-background rounded-lg border px-3 py-2 text-sm"
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <div class="sm:col-span-2 flex items-center gap-3">
              <button
                class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                :disabled="savingMember"
                @click="addMember"
              >
                Add member
              </button>
              <span v-if="memberError" class="text-sm text-red-600">{{ memberError }}</span>
            </div>
          </div>
          <div class="bg-card rounded-2xl border">
            <div v-if="!members.length" class="text-muted-foreground py-8 text-center text-sm">
              No team members yet.
            </div>
            <div v-else class="divide-y">
              <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center gap-3 px-5 py-3"
              >
                <div class="min-w-0 flex-1">
                  <div class="font-medium">{{ member.fullName ?? member.email }}</div>
                  <div class="text-muted-foreground text-xs">{{ member.email }}</div>
                </div>
                <span class="bg-muted rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                  {{ member.role?.name ?? '—' }}
                </span>
                <button
                  class="hover:bg-muted rounded-lg p-1.5 text-red-600"
                  @click="removeMember(member)"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Divisions -->
        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Divisions</h2>
          <div class="bg-card flex gap-2 rounded-2xl border p-5">
            <input
              v-model="divisionName"
              placeholder="Division name"
              class="bg-background flex-1 rounded-lg border px-3 py-2 text-sm"
              @keyup.enter="addDivision"
            />
            <button
              class="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              :disabled="savingDivision"
              @click="addDivision"
            >
              Add
            </button>
          </div>
          <div class="bg-card rounded-2xl border">
            <div v-if="!divisions.length" class="text-muted-foreground py-8 text-center text-sm">
              No divisions yet.
            </div>
            <div v-else class="divide-y">
              <div
                v-for="division in divisions"
                :key="division.id"
                class="flex items-center gap-3 px-5 py-3"
              >
                <Icon icon="lucide:users-round" class="text-muted-foreground size-4" />
                <span class="flex-1 font-medium">{{ division.name }}</span>
                <button
                  class="hover:bg-muted rounded-lg p-1.5 text-red-600"
                  @click="removeDivision(division)"
                >
                  <Icon icon="lucide:trash-2" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
