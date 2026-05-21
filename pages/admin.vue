<template>
  <div class="admin-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-sans font-extrabold text-[22px] tracking-[-0.5px]"
          :style="{ color: 'var(--color-text-primary)' }">
          Admin Panel
        </h1>
        <p class="font-body text-[12px] mt-1"
          :style="{ color: 'var(--color-text-muted)' }">
          Review pending tool submissions
        </p>
      </div>
      <span class="font-body text-[11px] px-2.5 py-1 rounded-full"
        :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' }">
        {{ total }} pending
      </span>
    </div>

    <!-- Error / Unauthorized -->
    <div v-if="forbidden" class="text-center py-16">
      <p class="font-body text-[14px]" :style="{ color: 'var(--color-text-secondary)' }">
        Admin access required. Sign in with an authorized GitHub account.
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 rounded-lg skeleton" />
    </div>

    <!-- Empty State -->
    <div v-else-if="tools.length === 0" class="text-center py-16">
      <p class="font-body text-[28px] mb-3">✅</p>
      <h3 class="font-sans font-bold text-[16px]" :style="{ color: 'var(--color-text-primary)' }">
        All caught up!
      </h3>
      <p class="font-body text-[12px] mt-1" :style="{ color: 'var(--color-text-muted)' }">
        No pending submissions to review.
      </p>
    </div>

    <!-- Tool Review List -->
    <div v-else class="space-y-3">
      <div v-for="tool in tools" :key="tool.id" class="p-5 rounded-lg"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">

        <div class="flex items-start justify-between gap-4">
          <!-- Tool Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-sans font-semibold text-[14px] tracking-[-0.2px]" :style="{ color: 'var(--color-text-primary)' }">
                {{ tool.name }}
              </h3>
              <span class="font-body text-[10px] px-1.5 py-0.5 rounded-full"
                :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }">
                {{ tool.category }}
              </span>
              <span class="font-body text-[10px] px-1.5 py-0.5 rounded-full"
                :style="{ background: pricingBg(tool.pricing), color: pricingColor(tool.pricing), border: '1px solid ' + pricingBorder(tool.pricing) }">
                {{ tool.pricing }}
              </span>
            </div>
            <a :href="tool.website" target="_blank" rel="noopener noreferrer"
              class="font-body text-[11px] mb-2 inline-block"
              :style="{ color: 'var(--color-text-link)' }">
              {{ tool.website }}
            </a>
            <p class="font-body text-[12px] leading-relaxed line-clamp-2"
              :style="{ color: 'var(--color-text-secondary)' }">
              {{ tool.meta_description }}
            </p>
            <div class="flex items-center gap-3 mt-2 font-body text-[10px]"
              :style="{ color: 'var(--color-text-muted)' }">
              <span v-if="tool.submitter_github">
                by @{{ tool.submitter_github }}
              </span>
              <span v-if="tool.submitter_site">
                · <a :href="tool.submitter_site" target="_blank" rel="noopener noreferrer"
                  :style="{ color: 'var(--color-text-link)' }">{{ tool.submitter_site }}</a>
              </span>
              <span>· submitted {{ formatDate(tool.submitted_at) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="btn-primary !h-[30px] !px-[14px] !text-[11px]"
              :disabled="acting === tool.id"
              @click="approve(tool)">
              {{ acting === tool.id && reviewStatus === 'active' ? 'Approving...' : 'Approve' }}
            </button>
            <button class="h-[30px] px-[14px] rounded-md font-body text-[11px] font-medium border cursor-pointer transition-all"
              :disabled="acting === tool.id"
              :style="{
                background: 'transparent',
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
              }"
              @click="openRejectModal(tool)">
              Reject
            </button>
          </div>
        </div>

        <!-- Rejection Form (inline, shown when rejecting) -->
        <div v-if="rejectingTool?.id === tool.id" class="mt-4 pt-4"
          :style="{ borderTop: '1px solid var(--color-border)' }">
          <label class="block font-body text-[10px] uppercase tracking-[0.1em] mb-2"
            :style="{ color: 'var(--color-text-muted)' }">
            Rejection Reason
          </label>
          <div class="flex flex-wrap gap-2 mb-3">
            <button v-for="r in rejectReasons" :key="r.value"
              class="px-3 py-1 rounded-full font-body text-[11px] border cursor-pointer transition-all"
              :style="{
                background: rejectReason === r.value ? 'var(--color-accent-dim)' : 'transparent',
                color: rejectReason === r.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderColor: rejectReason === r.value ? 'var(--color-accent-border)' : 'var(--color-border)',
              }"
              @click="rejectReason = r.value">
              {{ r.label }}
            </button>
          </div>
          <label class="block font-body text-[10px] uppercase tracking-[0.1em] mb-1.5"
            :style="{ color: 'var(--color-text-muted)' }">
            Reviewer Note (optional)
          </label>
          <textarea v-model="reviewerNote" rows="2"
            class="w-full rounded-md p-2.5 font-body text-[12px] resize-none"
            :style="{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }"
            placeholder="Add a note to the submitter..." />
          <div class="flex gap-2 mt-3">
            <button class="h-[30px] px-[14px] rounded-md font-body text-[11px] font-medium cursor-pointer transition-all"
              :disabled="acting === tool.id || !rejectReason"
              :style="{
                background: 'var(--color-danger)',
                color: '#fff',
                border: 'none',
                opacity: rejectReason ? 1 : 0.4,
              }"
              @click="reject(tool)">
              {{ acting === tool.id ? 'Rejecting...' : 'Confirm Reject' }}
            </button>
            <button class="btn-ghost !h-[30px] !text-[11px]"
              @click="cancelReject">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-6">
        <button v-for="p in totalPages" :key="p" class="page-btn"
          :class="{ active: p === page }"
          @click="page = p; fetchPending()">
          {{ p }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
usePageSeo({
  title: 'Admin Panel',
  template: 'prefix',
  description: 'Admin panel for reviewing tool submissions.',
})

const { isLoggedIn, token } = useAuth()

interface PendingTool {
  id: number
  name: string
  slug: string
  website: string
  category: string
  pricing: string
  meta_description: string | null
  submitter_github: string | null
  submitter_site: string | null
  submitted_at: string
  status: string
}

const tools = ref<PendingTool[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(true)
const forbidden = ref(false)
const acting = ref<number | null>(null)
const reviewStatus = ref('')

// Rejection state
const rejectingTool = ref<PendingTool | null>(null)
const rejectReason = ref('')
const reviewerNote = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize))

const rejectReasons = [
  { value: 'info_incomplete', label: 'Info Incomplete' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'other', label: 'Other' },
]

function pricingBg(p: string) {
  return `var(--color-pricing-${p}-bg)`
}
function pricingColor(p: string) {
  return `var(--color-pricing-${p}-text)`
}
function pricingBorder(p: string) {
  return `var(--color-pricing-${p}-border)`
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

async function fetchPending() {
  loading.value = true
  forbidden.value = false
  try {
    const data = await $fetch<{ tools: PendingTool[]; total: number }>(
      `/api/admin/pending?page=${page.value}&pageSize=${pageSize}`
    )
    tools.value = data.tools || []
    total.value = data.total || 0
  } catch (e: any) {
    if (e?.status === 403 || e?.statusCode === 403) {
      forbidden.value = true
    }
  } finally {
    loading.value = false
  }
}

async function approve(tool: PendingTool) {
  acting.value = tool.id
  reviewStatus.value = 'active'
  try {
    await $fetch('/api/admin/review', {
      method: 'POST',
      body: { tool_id: tool.id, status: 'active' },
    })
    tools.value = tools.value.filter(t => t.id !== tool.id)
    total.value--
  } catch {
    // Error handled silently
  } finally {
    acting.value = null
    reviewStatus.value = ''
  }
}

function openRejectModal(tool: PendingTool) {
  rejectingTool.value = tool
  rejectReason.value = ''
  reviewerNote.value = ''
}

function cancelReject() {
  rejectingTool.value = null
  rejectReason.value = ''
  reviewerNote.value = ''
}

async function reject(tool: PendingTool) {
  if (!rejectReason.value) return
  acting.value = tool.id
  reviewStatus.value = 'rejected'
  try {
    await $fetch('/api/admin/review', {
      method: 'POST',
      body: {
        tool_id: tool.id,
        status: 'rejected',
        reject_reason: rejectReason.value,
        reviewer_note: reviewerNote.value || undefined,
      },
    })
    tools.value = tools.value.filter(t => t.id !== tool.id)
    total.value--
    cancelReject()
  } catch {
    // Error handled silently
  } finally {
    acting.value = null
    reviewStatus.value = ''
  }
}

if (import.meta.client && isLoggedIn.value) {
  fetchPending()
}
</script>
