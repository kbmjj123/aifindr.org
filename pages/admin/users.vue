<template>
  <div class="admin-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]"
          :style="{ color: 'var(--color-text-primary)' }">
          Admin Panel
        </h1>
        <p class="font-body text-[12px] mt-1"
          :style="{ color: 'var(--color-text-muted)' }">
          Manage registered users
        </p>
      </div>
      <span class="font-body text-[13px] px-2.5 py-1 rounded-full"
        :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' }">
        {{ total }} users
      </span>
    </div>

    <!-- Nav Tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <NuxtLink to="/admin"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Review Submissions
      </NuxtLink>
      <NuxtLink to="/admin/intake"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Tool Intake
      </NuxtLink>
      <NuxtLink to="/admin/users"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }">
        Users
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="flex gap-2 max-w-md">
        <input v-model="searchQuery" placeholder="Search by username or email..."
          class="input !h-[36px] !text-[13px] flex-1"
          @keyup.enter="page = 1; fetchUsers()" />
        <button class="btn-secondary !h-[36px] !text-[13px] px-3" @click="page = 1; fetchUsers()">
          Search
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 rounded-lg skeleton" />
    </div>

    <!-- Error -->
    <div v-else-if="forbidden" class="text-center py-16">
      <p class="font-body text-[14px]" :style="{ color: 'var(--color-text-secondary)' }">
        Admin access required. Sign in with an authorized GitHub account.
      </p>
    </div>

    <!-- Empty -->
    <div v-else-if="users.length === 0" class="text-center py-16">
      <p class="font-body text-[28px] mb-3">👥</p>
      <h3 class="font-sans font-bold text-[16px]" :style="{ color: 'var(--color-text-primary)' }">
        No users found
      </h3>
    </div>

    <!-- Users Table -->
    <div v-else class="rounded-xl overflow-hidden"
      :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
      <table class="w-full font-body text-[12px]">
        <thead>
          <tr :style="{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }">
            <th class="text-left font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">User</th>
            <th class="text-left font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">GitHub ID</th>
            <th class="text-left font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">Email</th>
            <th class="text-center font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">Tools</th>
            <th class="text-center font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">Notify</th>
            <th class="text-left font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">Joined</th>
            <th class="text-left font-medium px-4 py-3" :style="{ color: 'var(--color-text-muted)' }">Last Login</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in users" :key="u.id"
            :style="{ borderBottom: i < users.length - 1 ? '1px solid var(--color-border)' : 'none' }">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img v-if="u.avatar_url" :src="u.avatar_url"
                  class="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  :style="{ border: '1px solid var(--color-border)' }" />
                <div v-else class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  :style="{ background: 'var(--color-bg-elevated)' }">
                  <span class="font-body text-[10px]" :style="{ color: 'var(--color-text-muted)' }">?</span>
                </div>
                <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ u.username }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-[11px]" :style="{ color: 'var(--color-text-secondary)' }">
              {{ u.github_id }}
            </td>
            <td class="px-4 py-3" :style="{ color: 'var(--color-text-secondary)' }">
              <div>{{ u.email || '—' }}</div>
              <div v-if="u.contact_email && u.contact_email !== u.email" class="text-[11px] mt-0.5"
                :style="{ color: 'var(--color-text-muted)' }">
                contact: {{ u.contact_email }}
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="font-mono text-[13px]" :style="{ color: 'var(--color-accent)' }">
                {{ u.tool_count || 0 }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <span v-if="u.email_notify" class="text-[11px]" :style="{ color: 'var(--color-success)' }">✓</span>
              <span v-else class="text-[11px]" :style="{ color: 'var(--color-text-muted)' }">—</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap" :style="{ color: 'var(--color-text-secondary)' }">
              {{ formatDate(u.created_at) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap" :style="{ color: 'var(--color-text-secondary)' }">
              {{ u.last_login_at ? formatDate(u.last_login_at) : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-6">
      <button v-for="p in totalPages" :key="p" class="page-btn"
        :class="{ active: p === page }"
        @click="page = p; fetchUsers()">
        {{ p }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get } = useApi()
const { isLoggedIn } = useAuth()

usePageSeo({
  title: 'Users — Admin',
  template: 'prefix',
  description: 'Admin user management.',
})

interface AdminUser {
  id: number
  github_id: number
  username: string
  email: string | null
  avatar_url: string | null
  contact_email: string | null
  email_verified: number
  email_notify: number
  last_login_at: string | null
  unsubscribed_at: string | null
  created_at: string
  updated_at: string | null
  tool_count: number
}

const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(true)
const forbidden = ref(false)
const searchQuery = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

async function fetchUsers() {
  loading.value = true
  forbidden.value = false
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    if (searchQuery.value.trim()) params.set('q', searchQuery.value.trim())
    const data = await get<{ users: AdminUser[]; total: number }>(`/api/admin/users?${params}`)
    users.value = data.users || []
    total.value = data.total || 0
  } catch (e: any) {
    if (e?.status === 403 || e?.statusCode === 403) forbidden.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    if (isLoggedIn.value) fetchUsers()
  }, 500)
})
</script>
