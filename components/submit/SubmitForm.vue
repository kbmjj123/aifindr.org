<template>
  <div class="p-6 rounded-xl"
    :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
    <form class="space-y-5" @submit.prevent="handleSubmit">
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

      <!-- One-line Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          One-line Description <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.description" placeholder="Briefly describe your tool" maxlength="80" />
        <p class="font-body text-[11px] mt-1 text-right" style="color: var(--color-text-muted)">{{ form.description.length }}/80</p>
      </div>

      <!-- Detailed Description -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Detailed Description <span style="color: var(--color-danger)">*</span>
        </label>
        <textarea v-model="form.detailDescription"
          class="textarea"
          placeholder="Describe what your tool does in detail (minimum 100 words)..." />
      </div>

      <!-- Platforms -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Platforms
        </label>
        <div class="flex flex-wrap gap-3">
          <label v-for="p in platformOptions" :key="p.value"
            class="flex items-center gap-1.5 font-body text-[12px] cursor-pointer" style="color: var(--color-text-secondary)">
            <input type="checkbox" :value="p.value" v-model="form.platforms"
              class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Submitter fields -->
      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          Your Website <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional — gets a dofollow backlink)</span>
        </label>
        <BaseInput v-model="form.submitterSite" placeholder="https://your-site.com" />
      </div>

      <div>
        <label class="font-body text-[12px] font-medium mb-1.5 block" style="color: var(--color-text-primary)">
          GitHub Username <span class="font-body text-[11px]" style="color: var(--color-text-muted)">(optional)</span>
        </label>
        <BaseInput v-model="form.submitterGithub" placeholder="your-github-username" />
      </div>

      <!-- Turnstile -->
      <div class="flex items-center justify-center h-20 rounded-md"
        :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }">
        <span class="font-body text-[12px]" style="color: var(--color-text-muted)">Turnstile CAPTCHA will render here</span>
      </div>

      <button type="submit" class="btn-primary w-full flex items-center justify-center gap-2 !h-[40px] !text-[13px]">
        Submit for Review
      </button>

      <p class="font-body text-[11px] text-center" style="color: var(--color-text-muted)">
        Submitted tools will be reviewed by our team before publishing.
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types/tool'

const form = reactive({
  name: '',
  website: '',
  category: '',
  pricing: 'free',
  description: '',
  detailDescription: '',
  platforms: [] as string[],
  submitterSite: '',
  submitterGithub: '',
})

const categoryOptions = computed(() => [
  { value: '', label: 'Select a category...', disabled: true },
  ...CATEGORIES.map(c => ({ value: c.slug, label: `${c.emoji} ${c.name}` })),
])

const pricingOptions = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
]

const platformOptions = [
  { value: 'web', label: 'Web' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'api', label: 'API' },
]

const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''

  try {
    const res = await $fetch('/api/submit', {
      method: 'POST',
      body: {
        name: form.name,
        website: form.website,
        category: form.category,
        pricing: form.pricing,
        description: form.description,
        detailDescription: form.detailDescription,
        platforms: form.platforms,
        submitter_site: form.submitterSite || undefined,
        submitter_github: form.submitterGithub || undefined,
        turnstileToken: '1x00000000000000000000',
      },
    })
    submitSuccess.value = true
    navigateTo(`/tools/${form.category}/${res.slug}`)
  } catch (e: any) {
    submitError.value = e?.data?.error || 'Submission failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
