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
          Manage tool submissions
        </p>
      </div>
    </div>

    <!-- Nav Tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg w-fit"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <NuxtLink to="/admin"
        class="font-body text-[12px] font-medium px-4 py-1.5 rounded-md transition-all"
        :style="{
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
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
          background: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        }">
        Users
      </NuxtLink>
    </div>

    <!-- Status Filter Tabs -->
    <div class="flex items-center gap-2 mb-6">
      <div class="flex gap-1 p-1 rounded-lg"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        <button v-for="s in statusFilters" :key="s.value"
          class="font-body text-[12px] font-medium px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap"
          :style="{
            background: statusFilter === s.value ? 'var(--color-bg-surface)' : 'transparent',
            color: statusFilter === s.value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border: statusFilter === s.value ? '1px solid var(--color-border)' : '1px solid transparent',
          }"
          @click="statusFilter = s.value; page = 1; fetchAdminTools()">
          {{ s.label }}
          <span class="ml-1 font-mono" :style="{ color: 'var(--color-text-muted)' }">({{ s.count }})</span>
        </button>
      </div>
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
      <p class="font-body text-[28px] mb-3">📭</p>
      <h3 class="font-sans font-bold text-[16px]" :style="{ color: 'var(--color-text-primary)' }">
        No tools found
      </h3>
      <p class="font-body text-[12px] mt-1" :style="{ color: 'var(--color-text-muted)' }">
        No {{ statusFilter === 'pending' ? 'pending' : statusFilter === 'active' ? 'approved' : 'rejected' }} submissions.
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
              <h3 class="font-sans font-semibold text-[14px] tracking-[-0.2px]"
                :style="{ color: 'var(--color-text-primary)' }">
                {{ tool.name }}
              </h3>
              <span v-if="tool.status !== 'pending'"
                class="font-body text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-[0.05em]"
                :style="{
                  background: tool.status === 'active' ? 'var(--color-verified-bg)' : 'var(--color-featured-bg)',
                  color: tool.status === 'active' ? 'var(--color-verified-text)' : 'var(--color-featured-text)',
                  border: '1px solid ' + (tool.status === 'active' ? 'var(--color-verified-border)' : 'var(--color-featured-border)'),
                }">
                {{ tool.status === 'active' ? 'Approved' : 'Rejected' }}
              </span>
              <span class="font-body text-[12px] px-1.5 py-0.5 rounded-full"
                :style="{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }">
                {{ tool.category }}
              </span>
              <span class="font-body text-[12px] px-1.5 py-0.5 rounded-full"
                :style="{
                  background: pricingBg(tool.pricing),
                  color: pricingColor(tool.pricing),
                  border: '1px solid ' + pricingBorder(tool.pricing),
                }">
                {{ tool.pricing }}
              </span>
            </div>
            <a :href="tool.website" target="_blank" rel="noopener noreferrer"
              class="font-body text-[13px] mb-2 inline-block"
              :style="{ color: 'var(--color-text-link)' }">
              {{ tool.website }}
            </a>
            <p class="font-body text-[12px] leading-relaxed line-clamp-2"
              :style="{ color: 'var(--color-text-secondary)' }">
              {{ tool.meta_description }}
            </p>
            <div class="flex items-center gap-3 mt-2 font-body text-[12px]"
              :style="{ color: 'var(--color-text-muted)' }">
              <span v-if="tool.submitter_github">by @{{ tool.submitter_github }}</span>
              <span v-if="tool.submitter_site">
                · <a :href="tool.submitter_site" target="_blank" rel="noopener noreferrer"
                  :style="{ color: 'var(--color-text-link)' }">{{ tool.submitter_site }}</a>
              </span>
              <span>· submitted {{ formatDate(tool.submitted_at) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="btn-ghost !h-[30px] !text-[13px]"
              @click="openView(tool)">
              View
            </button>
            <template v-if="tool.status === 'pending'">
              <button class="btn-primary !h-[30px] !px-[14px] !text-[13px]"
                :disabled="acting === tool.id"
                @click="approve(tool)">
                {{ acting === tool.id && reviewStatus === 'active' ? 'Approving...' : 'Approve' }}
              </button>
              <button
                class="h-[30px] px-[14px] rounded-md font-body text-[13px] font-medium border cursor-pointer transition-all"
                :disabled="acting === tool.id"
                :style="{
                  background: 'transparent',
                  color: 'var(--color-danger)',
                  borderColor: 'var(--color-danger)',
                }"
                @click="openRejectModal(tool)">
                Reject
              </button>
            </template>
          </div>
        </div>

        <!-- Rejection Form -->
        <div v-if="rejectingTool?.id === tool.id" class="mt-4 pt-4"
          :style="{ borderTop: '1px solid var(--color-border)' }">
          <label class="block font-body text-[12px] uppercase tracking-[0.1em] mb-2"
            :style="{ color: 'var(--color-text-muted)' }">
            Rejection Reason
          </label>
          <div class="flex flex-wrap gap-2 mb-3">
            <button v-for="r in rejectReasons" :key="r.value"
              class="px-3 py-1 rounded-full font-body text-[13px] border cursor-pointer transition-all"
              :style="{
                background: rejectReason === r.value ? 'var(--color-accent-dim)' : 'transparent',
                color: rejectReason === r.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
                borderColor: rejectReason === r.value ? 'var(--color-accent-border)' : 'var(--color-border)',
              }"
              @click="rejectReason = r.value">
              {{ r.label }}
            </button>
          </div>
          <label class="block font-body text-[12px] uppercase tracking-[0.1em] mb-1.5"
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
            <button
              class="h-[30px] px-[14px] rounded-md font-body text-[13px] font-medium cursor-pointer transition-all"
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
            <button class="btn-ghost !h-[30px] !text-[13px]" @click="cancelReject">
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

  <!-- Detail Modal (teleported to body) -->
  <div v-if="viewingTool" class="fixed inset-0 z-[100] flex items-start justify-center pt-[5vh] pb-8"
    @click.self="closeView">
    <div class="absolute inset-0" :style="{ background: 'rgba(0,0,0,0.7)' }" />
    <div class="relative w-full max-w-[680px] max-h-[90vh] overflow-y-auto rounded-xl"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <!-- Header -->
      <div class="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
        :style="{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }">
        <h2 class="font-sans font-bold text-[16px]" :style="{ color: 'var(--color-text-primary)' }">
          {{ viewingTool.name }}
        </h2>
        <button class="btn-ghost !h-[28px] !px-[10px] !text-[14px]" @click="closeView">✕</button>
      </div>

      <div class="p-6 space-y-5 font-body text-[12px]">
        <!-- Media Preview -->
        <div v-if="viewingTool.logo || viewingTool.screenshots" class="flex gap-3">
          <div v-if="viewingTool.logo" class="flex-1">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-1.5" :style="{ color: 'var(--color-text-muted)' }">Logo</div>
            <img :src="viewingTool.logo" alt="Logo"
              class="w-full h-[140px] object-cover rounded-lg"
              :style="{ border: '1px solid var(--color-border)' }" />
          </div>
          <div v-if="viewingTool.screenshots" class="flex-1">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-1.5" :style="{ color: 'var(--color-text-muted)' }">Screenshots</div>
            <img :src="viewingTool.screenshots" alt="Screenshots"
              class="w-full h-[140px] object-cover rounded-lg"
              :style="{ border: '1px solid var(--color-border)' }" />
          </div>
        </div>

        <!-- Slug + Status -->
        <div class="flex items-center gap-3">
          <code class="px-2 py-0.5 rounded text-[11px]"
            :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }">
            {{ viewingTool.slug }}
          </code>
          <span class="px-2 py-0.5 rounded-full text-[11px] uppercase tracking-[0.05em]"
            :style="{
              background: 'var(--color-accent-dim)',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent-border)',
            }">
            {{ viewingTool.status }}
          </span>
        </div>

        <!-- Grid: Basic Info -->
        <div class="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Category</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.category }}</div>
          </div>
          <div v-if="viewingTool.sub_category">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Sub Category</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.sub_category }}</div>
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Pricing</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.pricing }}</div>
          </div>
          <div v-if="viewingTool.price_starting">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Starting Price</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">${{ viewingTool.price_starting }}</div>
          </div>
          <div v-if="viewingTool.price_detail">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Price Detail</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.price_detail }}</div>
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Free Trial</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.has_free_trial ? 'Yes' : 'No' }}</div>
          </div>
          <div v-if="viewingTool.platforms">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Platforms</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.platforms }}</div>
          </div>
          <div v-if="viewingTool.launched">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Launched</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.launched }}</div>
          </div>
          <div>
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Submitted</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(viewingTool.submitted_at) }}</div>
          </div>
          <div v-if="viewingTool.last_verified">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Last Verified</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(viewingTool.last_verified) }}</div>
          </div>
          <div v-if="viewingTool.updated_at">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Updated</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(viewingTool.updated_at) }}</div>
          </div>
          <div v-if="viewingTool.data_source">
            <div class="text-[11px] uppercase tracking-[0.08em] mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Data Source</div>
            <div class="text-[13px]" :style="{ color: 'var(--color-text-primary)' }">{{ viewingTool.data_source }}</div>
          </div>
        </div>

        <!-- Website -->
        <div>
          <div class="text-[11px] uppercase tracking-[0.08em] mb-1" :style="{ color: 'var(--color-text-muted)' }">Website</div>
          <a :href="viewingTool.website" target="_blank" rel="noopener noreferrer"
            class="text-[13px]" :style="{ color: 'var(--color-text-link)' }">
            {{ viewingTool.website }}
          </a>
        </div>

        <!-- Meta Description -->
        <div v-if="viewingTool.meta_description">
          <div class="text-[11px] uppercase tracking-[0.08em] mb-1" :style="{ color: 'var(--color-text-muted)' }">Description</div>
          <p class="text-[13px] leading-relaxed" :style="{ color: 'var(--color-text-primary)' }">
            {{ viewingTool.meta_description }}
          </p>
        </div>

        <!-- Body / Full Content -->
        <div v-if="viewingTool.body">
          <div class="text-[11px] uppercase tracking-[0.08em] mb-1" :style="{ color: 'var(--color-text-muted)' }">Full Content</div>
          <div class="p-4 rounded-lg text-[13px] leading-relaxed overflow-y-auto markdown-preview"
            :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', maxHeight: '360px' }"
            v-html="renderMarkdown(viewingTool.body)" />
        </div>

        <!-- Submitter -->
        <div v-if="viewingTool.submitter_github || viewingTool.submitter_site">
          <div class="text-[11px] uppercase tracking-[0.08em] mb-1.5" :style="{ color: 'var(--color-text-muted)' }">Submitter</div>
          <div class="flex items-center gap-3 text-[13px]">
            <span v-if="viewingTool.submitter_github" :style="{ color: 'var(--color-text-primary)' }">
              @{{ viewingTool.submitter_github }}
            </span>
            <a v-if="viewingTool.submitter_site" :href="viewingTool.submitter_site" target="_blank" rel="noopener noreferrer"
              :style="{ color: 'var(--color-text-link)' }">
              {{ viewingTool.submitter_site }}
            </a>
          </div>
        </div>

        <!-- Flags -->
        <div v-if="viewingTool.featured || viewingTool.verified || viewingTool.editor_pick" class="flex gap-2">
          <span v-if="viewingTool.featured" class="badge badge-featured">Featured</span>
          <span v-if="viewingTool.verified" class="badge badge-verified">Verified</span>
          <span v-if="viewingTool.editor_pick" class="badge badge-new">Editor Pick</span>
        </div>

        <!-- Analytics -->
        <div class="flex gap-6 text-[12px]" :style="{ color: 'var(--color-text-muted)' }">
          <span>{{ viewingTool.click_count || 0 }} clicks</span>
          <span>{{ viewingTool.view_count || 0 }} views</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-3"
        :style="{ background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border)' }">
        <button class="btn-ghost !h-[30px] !text-[13px]" @click="closeView">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { get, post } = useApi()
import { marked } from 'marked'
usePageSeo({
  title: 'Admin Panel',
  template: 'prefix',
  description: 'Admin panel for reviewing tool submissions.',
  noOg: true,
})

const { isLoggedIn } = useAuth()

interface PendingTool {
  id: number
  name: string
  slug: string
  website: string
  category: string
  sub_category: string
  pricing: string
  price_starting: number | null
  price_detail: string | null
  has_free_trial: number
  platforms: string
  status: string
  launched: string | null
  meta_description: string | null
  body: string | null
  logo: string | null
  screenshots: string | null
  featured: number
  verified: number
  editor_pick: number
  click_count: number
  view_count: number
  submitter_github: string | null
  submitter_site: string | null
  submitter_id: number | null
  submitted_at: string
  last_verified: string | null
  updated_at: string | null
  data_source: string | null
}

const tools      = ref<PendingTool[]>([])
const total      = ref(0)
const page       = ref(1)
const pageSize   = 20
const loading    = ref(true)
const forbidden  = ref(false)
const acting     = ref<number | null>(null)
const reviewStatus = ref('')

const statusFilter = ref('pending')

const statusFilters = ref([
  { value: 'pending',  label: 'Pending',  count: 0 },
  { value: 'active',   label: 'Approved', count: 0 },
  { value: 'rejected', label: 'Rejected', count: 0 },
])

const rejectingTool = ref<PendingTool | null>(null)
const rejectReason  = ref('')
const reviewerNote  = ref('')

const viewingTool = ref<PendingTool | null>(null)

function openView(tool: PendingTool) {
  viewingTool.value = tool
}

function closeView() {
  viewingTool.value = null
}

const totalPages = computed(() => Math.ceil(total.value / pageSize))

const rejectReasons = [
  { value: 'info_incomplete', label: 'Info Incomplete' },
  { value: 'not_qualified',   label: 'Not Qualified' },
  { value: 'duplicate',       label: 'Duplicate' },
  { value: 'other',           label: 'Other' },
]

function pricingBg(p: string)     { return `var(--color-pricing-${p}-bg)` }
function pricingColor(p: string)  { return `var(--color-pricing-${p}-text)` }
function pricingBorder(p: string) { return `var(--color-pricing-${p}-border)` }

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

async function fetchAdminTools() {
  loading.value  = true
  forbidden.value = false
  try {
    const data = await get<{ tools: PendingTool[]; total: number }>(
      `/api/admin/pending?status=${statusFilter.value}&page=${page.value}&pageSize=${pageSize}`
    )
    tools.value = data.tools || []
    total.value = data.total || 0
  } catch (e: any) {
    if (e?.status === 403 || e?.statusCode === 403) forbidden.value = true
  } finally {
    loading.value = false
  }
}

async function fetchCounts() {
  try {
    const data = await get<{ pending: number; active: number; rejected: number }>('/api/admin/pending?counts=true')
    if (data) {
      const counts = statusFilters.value
      counts[0].count = data.pending || 0
      counts[1].count = data.active || 0
      counts[2].count = data.rejected || 0
    }
  } catch {}
}

async function approve(tool: PendingTool) {
  acting.value = tool.id
  reviewStatus.value = 'active'
  try {
    await post('/api/admin/review', { tool_id: tool.id, status: 'active' })
    await fetchAdminTools()
    await fetchCounts()
  } catch {}
  finally {
    acting.value = null
    reviewStatus.value = ''
  }
}

function openRejectModal(tool: PendingTool) {
  rejectingTool.value = tool
  rejectReason.value  = ''
  reviewerNote.value  = ''
}

function cancelReject() {
  rejectingTool.value = null
  rejectReason.value  = ''
  reviewerNote.value  = ''
}

async function reject(tool: PendingTool) {
  if (!rejectReason.value) return
  acting.value = tool.id
  reviewStatus.value = 'rejected'
  try {
    await post('/api/admin/review', {
      tool_id:       tool.id,
      status:        'rejected',
      reject_reason: rejectReason.value,
      reviewer_note: reviewerNote.value || undefined,
    })
    await fetchAdminTools()
    await fetchCounts()
    cancelReject()
  } catch {}
  finally {
    acting.value = null
    reviewStatus.value = ''
  }
}

onMounted(() => {
  setTimeout(() => {
    if (isLoggedIn.value) {
      fetchAdminTools()
      fetchCounts()
    }
  }, 3000)
})
</script>

<style scoped>
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4 {
  font-family: var(--font-sans);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 16px;
  margin-bottom: 8px;
}
.markdown-preview h1 { font-size: 17px; }
.markdown-preview h2 { font-size: 15px; letter-spacing: -0.3px; }
.markdown-preview h3 { font-size: 14px; }
.markdown-preview p  { margin-bottom: 8px; line-height: 1.7; }
.markdown-preview ul,
.markdown-preview ol { margin-left: 18px; margin-bottom: 8px; }
.markdown-preview li { margin-bottom: 3px; line-height: 1.6; }
.markdown-preview a  { color: var(--color-text-link); }
.markdown-preview code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 1px 5px;
  color: var(--color-accent);
}
.markdown-preview pre {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  overflow-x: auto;
  margin-bottom: 12px;
}
.markdown-preview pre code {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text-primary);
}
.markdown-preview strong { color: var(--color-text-primary); }
.markdown-preview hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 12px 0;
}
.markdown-preview blockquote {
  border-left: 2px solid var(--color-accent);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--color-text-secondary);
}
</style>