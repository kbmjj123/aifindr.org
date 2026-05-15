<template>
  <div>
    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-6" style="color: var(--color-text-primary)">
      Admin — Pending Tools
    </h1>

    <!-- Auth -->
    <div v-if="!authed" class="max-w-[400px] mb-8">
      <div class="p-5 rounded-lg"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
        <label class="font-body text-[12px] font-medium mb-2 block" style="color: var(--color-text-primary)">
          Admin Key
        </label>
        <div class="flex gap-2">
          <BaseInput v-model="adminKey" placeholder="Enter admin key..." @keyup.enter="auth" />
          <button class="btn-primary !h-[38px]" @click="auth">Login</button>
        </div>
        <p v-if="authError" class="font-body text-[11px] mt-2" style="color: var(--color-danger)">{{ authError }}</p>
      </div>
    </div>

    <!-- Pending tools list -->
    <template v-else>
      <div class="flex items-center gap-3 mb-4">
        <button class="btn-secondary !h-8 !text-[11px]" @click="loadTools">🔄 Refresh</button>
        <span class="font-body text-[12px]" :style="{ color: 'var(--color-text-secondary)' }">{{ tools.length }} pending</span>
        <span v-if="loading" class="font-body text-[12px]" style="color: var(--color-text-muted)">Loading...</span>
      </div>

      <div class="space-y-3">
        <div v-for="t in tools" :key="t.id" class="p-4 rounded-lg"
          :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-sans font-semibold text-[14px]" style="color: var(--color-text-primary)">
                  {{ t.name }}
                </h3>
                <span :class="['tag', `tag-${t.pricing}`]">{{ t.pricing }}</span>
                <span class="tag">{{ t.category }}</span>
              </div>
              <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">
                {{ t.meta_description }}
              </p>
              <div class="flex flex-wrap gap-3 font-body text-[11px]"
                :style="{ color: 'var(--color-text-secondary)' }">
                <a :href="t.website" target="_blank" rel="noopener noreferrer"
                  :style="{ color: 'var(--color-text-link)' }">🌐 {{ t.website }}</a>
                <span v-if="t.submitter_github">👤 {{ t.submitter_github }}</span>
                <span v-if="t.submitter_site">🔗 {{ t.submitter_site }}</span>
                <span>📅 {{ t.submitted_at }}</span>
              </div>
              <div v-if="t.body" class="mt-3 p-3 rounded font-body text-[11px] leading-relaxed"
                :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', maxHeight: '120px', overflow: 'hidden' }">
                {{ t.body }}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button class="btn-primary !h-8 !text-[11px] !px-3 !py-0"
                :disabled="processing === t.id"
                @click="approve(t.id)">✅ Approve</button>
              <button class="btn-secondary !h-8 !text-[11px] !px-3 !py-0"
                :disabled="processing === t.id"
                @click="reject(t.id)">❌ Reject</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const adminKey = ref('')
const authed = ref(false)
const authError = ref('')
const tools = ref<any[]>([])
const loading = ref(false)
const processing = ref<number | null>(null)

function authHeaders() {
  return { Authorization: `Bearer ${adminKey.value}` }
}

function auth() {
  authError.value = ''
  // Test auth by fetching tools
  $fetch('/api/admin/tools?status=pending', {
    headers: authHeaders(),
  }).then(data => {
    authed.value = true
    tools.value = (data as any[]) || []
  }).catch(() => {
    authError.value = 'Invalid admin key'
  })
}

async function loadTools() {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/tools?status=pending', {
      headers: authHeaders(),
    })
    tools.value = (data as any[]) || []
  } catch {
    tools.value = []
  } finally {
    loading.value = false
  }
}

async function approve(id: number) {
  processing.value = id
  try {
    await $fetch(`/api/admin/tools/${id}/approve`, {
      method: 'POST',
      headers: authHeaders(),
    })
    loadTools()
  } finally {
    processing.value = null
  }
}

async function reject(id: number) {
  processing.value = id
  try {
    await $fetch(`/api/admin/tools/${id}/reject`, {
      method: 'POST',
      headers: authHeaders(),
    })
    loadTools()
  } finally {
    processing.value = null
  }
}
</script>
