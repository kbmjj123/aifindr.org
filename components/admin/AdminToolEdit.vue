<template>
  <div class="p-6 rounded-xl"
    :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="h-10 rounded-lg skeleton" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="font-body text-[13px]" style="color: var(--color-danger)">{{ error }}</p>
    </div>

    <!-- Form -->
    <form v-else class="space-y-5" @submit.prevent="handleSave">

      <!-- Admin status bar -->
      <div class="flex items-center justify-between p-3 rounded-lg"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
        <div class="flex items-center gap-3">
          <span class="font-body text-[11px] uppercase tracking-[0.08em]"
            :style="{ color: 'var(--color-text-muted)' }">Slug:</span>
          <code class="font-body text-[12px] px-2 py-0.5 rounded"
            :style="{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }">
            {{ toolSlug }}
          </code>
        </div>
        <div class="flex items-center gap-2">
          <label
            class="font-body text-[11px] px-2 py-1 rounded-full cursor-pointer select-none transition-all"
            :style="{
              background: formFeatured ? 'var(--color-featured-bg)' : 'transparent',
              color: formFeatured ? 'var(--color-featured-text)' : 'var(--color-text-muted)',
              border: '1px solid ' + (formFeatured ? 'var(--color-featured-border)' : 'var(--color-border)'),
            }">
            <input type="checkbox" v-model="formFeatured" class="sr-only" />
            ★ Featured
          </label>
          <label
            class="font-body text-[11px] px-2 py-1 rounded-full cursor-pointer select-none transition-all"
            :style="{
              background: formVerified ? 'var(--color-verified-bg)' : 'transparent',
              color: formVerified ? 'var(--color-verified-text)' : 'var(--color-text-muted)',
              border: '1px solid ' + (formVerified ? 'var(--color-verified-border)' : 'var(--color-border)'),
            }">
            <input type="checkbox" v-model="formVerified" class="sr-only" />
            ✓ Verified
          </label>
          <label
            class="font-body text-[11px] px-2 py-1 rounded-full cursor-pointer select-none transition-all"
            :style="{
              background: formEditorPick ? 'var(--color-pricing-freemium-bg)' : 'transparent',
              color: formEditorPick ? 'var(--color-pricing-freemium-text)' : 'var(--color-text-muted)',
              border: '1px solid ' + (formEditorPick ? 'var(--color-pricing-freemium-border)' : 'var(--color-border)'),
            }">
            <input type="checkbox" v-model="formEditorPick" class="sr-only" />
            ✏ Editor Pick
          </label>
        </div>
      </div>

      <!-- Divider -->
      <hr :style="{ borderColor: 'var(--color-border)' }" />

      <!-- Tool Name -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Tool Name <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.name" placeholder="e.g. Midjourney" />
      </div>

      <!-- Website -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Website URL <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.website" placeholder="https://midjourney.com" />
      </div>

      <!-- Category -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Category <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseSelect v-model="form.category" :options="categoryOptions" />
      </div>

      <!-- Sub Category -->
      <div v-if="form.category && subCategoryOptions.length > 0">
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Sub Category
        </label>
        <BaseSelect v-model="form.subCategory" :options="subCategoryOptions" />
      </div>

      <!-- Pricing -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Pricing Type <span style="color: var(--color-danger)">*</span>
        </label>
        <div class="flex gap-2">
          <label v-for="p in pricingOptions" :key="p.value"
            class="flex-1 flex items-center justify-center gap-1.5 h-[34px] rounded-md text-[12px] font-body cursor-pointer"
            :style="{
              background: form.pricing === p.value ? 'var(--color-accent-dim)' : 'var(--color-bg-input)',
              border: '1px solid ' + (form.pricing === p.value ? 'var(--color-accent)' : 'var(--color-border)'),
              color: form.pricing === p.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }">
            <input type="radio" :value="p.value" v-model="form.pricing" class="sr-only" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Price Tiers (freemium / paid) -->
      <div v-if="form.pricing !== 'free'">
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Pricing Tiers
        </label>
        <div class="space-y-2">
          <div v-for="(tier, i) in form.priceTiers" :key="i"
            class="p-3 rounded-lg"
            :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
            <div class="flex items-center gap-2 mb-2">
              <BaseInput v-model="tier.name" placeholder="Tier name (e.g. Pro)" class="!h-[32px] !text-[12px]" />
              <div class="flex items-center gap-1 shrink-0">
                <span class="font-body text-[11px]" style="color: var(--color-text-muted)">$</span>
                <BaseInput :model-value="String(tier.price)" @update:model-value="tier.price = Number($event)" type="number" min="0" placeholder="0"
                  class="!h-[32px] !w-[70px] !text-[12px]" />
              </div>
              <BaseSelect v-model="tier.period" :options="periodOptions" class="!h-[32px] !text-[12px] !w-auto" />
              <button type="button" class="w-6 h-6 flex items-center justify-center rounded-md shrink-0 cursor-pointer"
                :style="{ color: 'var(--color-danger)' }" @click="form.priceTiers.splice(i, 1)">✕</button>
            </div>
            <BaseInput v-model="tier.featuresStr" placeholder="Features (comma separated)"
              class="!h-[32px] !text-[12px]" />
          </div>
        </div>
        <button type="button"
          class="mt-2 h-[30px] px-3 rounded-md font-body text-[11px] cursor-pointer transition-all"
          :style="{ background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', color: 'var(--color-text-secondary)' }"
          @click="addTier">
          + Add Tier
        </button>
      </div>

      <!-- Has Free Trial (paid) -->
      <div v-if="form.pricing === 'paid'">
        <label class="flex items-center gap-2 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
          <input type="checkbox" v-model="form.hasFreeTrial" class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
          Offers a free trial
        </label>
      </div>

      <!-- Short Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Short Description <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.shortDescription" placeholder="e.g. AI Image Generator for Professionals" maxlength="80" />
        <p class="font-body text-[11px] mt-1" style="color: var(--color-text-muted)">
          Used in the page title, e.g. "Tool Name — {{ form.shortDescription || 'short description' }}"
        </p>
        <p class="font-body text-[11px] mt-1 text-right" style="color: var(--color-text-muted)">
          {{ form.shortDescription.length }}/80
        </p>
      </div>

      <!-- Meta Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Meta Description
        </label>
        <BaseInput v-model="form.description" placeholder="One-line description for SEO" maxlength="160" />
        <p class="font-body text-[11px] mt-1 text-right" style="color: var(--color-text-muted)">
          {{ form.description.length }}/160
        </p>
      </div>

      <!-- Detailed Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Detailed Description <span style="color: var(--color-danger)">*</span>
        </label>
        <MarkdownEditor v-model="form.detailDescription" />
      </div>

      <!-- Platforms -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Platforms
        </label>
        <div class="flex flex-wrap gap-3">
          <label v-for="p in platformOptions" :key="p.value"
            class="flex items-center gap-1.5 font-body text-[12px] cursor-pointer"
            style="color: var(--color-text-secondary)">
            <input type="checkbox" :value="p.value" v-model="form.platforms"
              class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Launched -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Launch Year
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </label>
        <BaseInput v-model="form.launched" placeholder="e.g. 2023" maxlength="4" />
      </div>

      <!-- Tags -->
      <div class="space-y-4">
        <p class="font-body text-[12px] font-medium" style="color: var(--color-text-primary)">Tags</p>

        <!-- Feature Tags -->
        <div>
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">Features</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in FEATURE_TAGS" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.featureTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.featureTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.featureTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
              }">
              <input type="checkbox" :value="t.value" v-model="form.featureTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>

        <!-- Audience Tags -->
        <div>
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">
            Audience <span style="color: var(--color-text-muted)">(up to 3)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in AUDIENCE_TAGS" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.audienceTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.audienceTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.audienceTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
                opacity: !form.audienceTags.includes(t.value) && form.audienceTags.length >= 3 ? '0.4' : '1',
                pointerEvents: !form.audienceTags.includes(t.value) && form.audienceTags.length >= 3 ? 'none' : 'auto',
              }">
              <input type="checkbox" :value="t.value" v-model="form.audienceTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>

        <!-- Use Case Tags -->
        <div v-if="form.category && useCaseTagOptions.length > 0">
          <p class="font-body text-[11px] mb-2" style="color: var(--color-text-muted)">
            Use Cases <span style="color: var(--color-text-muted)">(up to 3)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <label v-for="t in useCaseTagOptions" :key="t.value"
              class="flex items-center gap-1 font-body text-[11px] cursor-pointer px-2 py-1 rounded-full"
              :style="{
                color: form.useCaseTags.includes(t.value) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: form.useCaseTags.includes(t.value) ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
                border: '1px solid ' + (form.useCaseTags.includes(t.value) ? 'var(--color-accent-border)' : 'var(--color-border)'),
                opacity: !form.useCaseTags.includes(t.value) && form.useCaseTags.length >= 3 ? '0.4' : '1',
                pointerEvents: !form.useCaseTags.includes(t.value) && form.useCaseTags.length >= 3 ? 'none' : 'auto',
              }">
              <input type="checkbox" :value="t.value" v-model="form.useCaseTags" class="hidden" />
              {{ t.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Media -->
      <div class="pt-4 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <p class="font-body text-[12px] font-medium mb-4" style="color: var(--color-text-primary)">
          Media <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </p>

        <div class="mb-4">
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Tool Icon
          </label>
          <ImageUploadSlot v-model="form.coverImage" aspect="square" />
        </div>

        <div class="mb-4">
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Screenshots <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(up to 3)</span>
          </label>
          <div class="space-y-2">
            <ImageUploadSlot v-for="(_, i) in form.screenshots" :key="i"
              v-model="form.screenshots[i]" aspect="screenshot" />
          </div>
        </div>

        <div>
          <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
            Demo Video URL
          </label>
          <BaseInput v-model="form.demoVideo" placeholder="https://youtube.com/watch?v=..." />
        </div>
      </div>

      <!-- Submitter Info -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Submitter Website
          <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(dofollow backlink)</span>
        </label>
        <BaseInput v-model="form.submitterSite" placeholder="https://your-site.com" />
      </div>

      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Submitter GitHub
        </label>
        <BaseInput v-model="form.submitterGithub" placeholder="github-username" />
      </div>

      <!-- Notify checkbox -->
      <div class="flex items-center gap-2 pt-2">
        <input type="checkbox" id="notifyToggle" v-model="notifySubmitter"
          class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
        <label for="notifyToggle" class="font-body text-[11px] cursor-pointer" style="color: var(--color-text-secondary)">
          Send notification email to submitter (if email available)
        </label>
      </div>

      <!-- Status dropdown -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Status
        </label>
        <select v-model="formStatus"
          class="input !h-[36px] !text-[12px]"
          :style="{ color: statusColor }">
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="beta">Beta</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      <!-- Actions -->
      <hr :style="{ borderColor: 'var(--color-border)' }" />

      <div class="flex items-center gap-3">
        <button type="submit"
          class="btn-primary flex-1 flex items-center justify-center gap-2 !h-[40px] !text-[13px]"
          :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <button type="button"
          class="btn-secondary !h-[40px] !px-[20px] !text-[13px]"
          @click="$emit('close')">
          Cancel
        </button>
      </div>

      <p v-if="saveError" class="font-body text-[11px] text-center" style="color: var(--color-danger)">
        {{ saveError }}
      </p>
      <p v-else class="font-body text-[11px] text-center" style="color: var(--color-text-muted)">
        Changes are saved immediately. The live page will be updated on next ISR cache expiry (~24h).
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { ApiToolData } from '~/composables/useToolForm'

const props = defineProps<{
  toolId: number
}>()

defineEmits<{
  close: []
  saved: [id: number]
}>()

const { get, post } = useApi()
const { show: showToast } = useToast()

const {
  form,
  FEATURE_TAGS,
  AUDIENCE_TAGS,
  categoryOptions,
  subCategoryOptions,
  useCaseTagOptions,
  pricingOptions,
  periodOptions,
  platformOptions,
  addTier,
  loadFromTool,
  toAdminPayload,
} = useToolForm()

// ── admin-only state ─────────────────────────────────────────
const formFeatured    = ref(false)
const formVerified    = ref(false)
const formEditorPick  = ref(false)
const formStatus      = ref('active')
const notifySubmitter = ref(false)

const toolSlug = ref('')

// ── ui state ─────────────────────────────────────────────────
const loading  = ref(true)
const error    = ref('')
const saving   = ref(false)
const saveError = ref('')

const statusColor = computed(() => {
  const colors: Record<string, string> = {
    active: 'var(--color-verified-text)',
    pending: 'var(--color-featured-text)',
    beta: 'var(--color-pricing-freemium-text)',
    discontinued: 'var(--color-danger)',
  }
  return colors[formStatus.value] || 'var(--color-text-primary)'
})

// ── load tool data ──────────────────────────────────────────
async function loadTool() {
  loading.value = true
  error.value = ''
  try {
    const tool = await get<ApiToolData>(`/api/admin/tools/${props.toolId}`)
    if (!tool) {
      error.value = 'Tool not found'
      return
    }
    loadFromTool(tool)
    toolSlug.value = tool.slug || ''
    formFeatured.value   = tool.featured === 1
    formVerified.value   = tool.verified === 1
    formEditorPick.value = tool.editor_pick === 1
    formStatus.value     = tool.status || 'active'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load tool'
  } finally {
    loading.value = false
  }
}

// ── save ─────────────────────────────────────────────────────
async function handleSave() {
  if (saving.value) return
  saveError.value = ''
  saving.value = true

  try {
    const payload = toAdminPayload({
      featured:    formFeatured.value,
      verified:    formVerified.value,
      editor_pick: formEditorPick.value,
      status:      formStatus.value,
    })

    await post(`/api/admin/tools/${props.toolId}`, payload)

    showToast('Tool updated successfully', 'success')
    // trigger search engine re-notification
    if (notifySubmitter.value) {
      // call review endpoint to send notification (updates updated_at only)
      await post('/api/admin/review', {
        tool_id: props.toolId,
        status: formStatus.value,
      }).catch(() => {}) // silent — notification is best-effort
    }
  } catch (e: any) {
    saveError.value = e?.data?.statusMessage || e?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

onMounted(loadTool)
</script>
