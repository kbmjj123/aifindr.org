<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-sans font-extrabold text-[22px] tracking-tight" style="color: var(--color-text-primary)">
        Posts
      </h1>
      <button class="btn-primary h-8 text-[11px] px-3" @click="createPost">
        + New Post
      </button>
    </div>

    <!-- Search + filter -->
    <div class="flex items-center gap-3 mb-5">
      <input v-model="search" type="text" placeholder="Search by title or slug..."
        class="input h-9 text-[12px] flex-1 max-w-80" @input="debouncedLoad" />
      <div class="flex gap-1">
        <button v-for="s in statuses" :key="s.value"
          class="filter-tab h-7 text-[10px] px-3"
          :class="{ active: filterStatus === s.value }"
          @click="filterStatus = s.value; loadPosts()">
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-md"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="posts.length === 0" class="empty-state">
      <h3>No posts yet</h3>
      <p>Create your first blog post to get started.</p>
    </div>

    <!-- Post list -->
    <div v-else class="space-y-1">
      <div v-for="post in posts" :key="post.id"
        class="flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }"
        @click="editPost(post.id)">
        <div class="flex-1 min-w-0">
          <div class="font-sans font-semibold text-[13px] truncate" style="color: var(--color-text-primary)">
            {{ post.title || 'Untitled' }}
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-body text-[10px]" style="color: var(--color-text-muted)">/{{ post.slug }}</span>
            <span class="font-body text-[10px]" :style="{
              color: post.locale === 'zh' ? 'var(--color-new-text)' : 'var(--color-accent)'
            }">{{ post.locale === 'zh' ? '中文' : 'EN' }}</span>
          </div>
        </div>
        <span class="badge h-5 text-[9px] px-2"
          :class="post.status === 'published' ? 'badge-verified' : 'badge-featured'"
          :style="post.status === 'draft' ? {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          } : {}">
          {{ post.status }}
        </span>
        <span class="font-body text-[10px]" style="color: var(--color-text-muted)">
          {{ formatDate(post.updated_at || post.created_at) }}
        </span>
        <button class="btn-ghost h-7 text-[10px] px-2" @click.stop="deletePost(post.id)">
          ✕
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize" class="flex items-center justify-center gap-2 pt-4">
        <button class="page-btn text-[11px]" :disabled="page <= 1" @click="page--; loadPosts()">‹</button>
        <span class="font-body text-[11px]" style="color: var(--color-text-muted)">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn text-[11px]" :disabled="page >= totalPages" @click="page++; loadPosts()">›</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const search = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = 20
const posts = ref<any[]>([])
const total = ref(0)
const loading = ref(true)

const statuses = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function formatDate(ts: number | string) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadPosts() }, 300)
}

async function loadPosts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (search.value) params.set('q', search.value)
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize))
    const res = await $fetch(`/api/admin/posts?${params}`)
    posts.value = (res as any).posts || []
    total.value = (res as any).total || 0
  } catch { /* toast? */ }
  finally { loading.value = false }
}

async function createPost() {
  const res = await $fetch('/api/admin/posts', {
    method: 'POST',
    body: {
      slug: `post-${Date.now()}`,
      status: 'draft',
      translations: { en: { title: 'New Post' } },
    },
  }).catch(() => null)
  if (res) navigateTo(`/admin/posts/${(res as any).id}`)
}

function editPost(id: number) {
  navigateTo(`/admin/posts/${id}`)
}

async function deletePost(id: number) {
  if (!confirm('Delete this post? This cannot be undone.')) return
  await $fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
  loadPosts()
}

onMounted(loadPosts)
</script>
