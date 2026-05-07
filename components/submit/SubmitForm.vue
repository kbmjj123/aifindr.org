<template>
  <div class="p-6 rounded-xl"
    :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Tool Name -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Tool Name <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.name" placeholder="e.g. Midjourney" />
      </div>

      <!-- Website -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Website URL <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.website" placeholder="https://midjourney.com" />
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Category <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseSelect v-model="form.category" :options="categoryOptions" />
      </div>

      <!-- Pricing -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Pricing Type <span style="color: var(--color-danger)">*</span>
        </label>
        <div class="flex gap-3">
          <label v-for="p in pricingOptions" :key="p.value"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer"
            :style="{
              background: form.pricing === p.value ? 'rgba(79,70,229,0.1)' : 'var(--color-bg-input)',
              border: '1px solid ' + (form.pricing === p.value ? 'var(--color-accent)' : 'var(--color-border)'),
            }">
            <input type="radio" :value="p.value" v-model="form.pricing" class="sr-only" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- One-line Description -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          One-line Description <span style="color: var(--color-danger)">*</span>
        </label>
        <BaseInput v-model="form.description" placeholder="Briefly describe your tool" maxlength="80" />
        <p class="text-xs mt-1 text-right" style="color: var(--color-text-muted)">{{ form.description.length }}/80</p>
      </div>

      <!-- Detailed Description -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Detailed Description <span style="color: var(--color-danger)">*</span>
        </label>
        <textarea v-model="form.detailDescription"
          class="input h-32 resize-y pt-3"
          placeholder="Describe what your tool does in detail (minimum 100 words)..."
          style="height: 120px; resize: vertical; padding: 12px" />
      </div>

      <!-- Platforms -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Platforms
        </label>
        <div class="flex flex-wrap gap-3">
          <label v-for="p in platformOptions" :key="p.value"
            class="flex items-center gap-1.5 text-sm cursor-pointer" style="color: var(--color-text-secondary)">
            <input type="checkbox" :value="p.value" v-model="form.platforms"
              class="rounded" :style="{ accentColor: 'var(--color-accent)' }" />
            {{ p.label }}
          </label>
        </div>
      </div>

      <!-- Submitter fields (for backlinks) -->
      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          Your Website <span class="text-xs" style="color: var(--color-text-muted)">(optional — gets a dofollow backlink)</span>
        </label>
        <BaseInput v-model="form.submitterSite" placeholder="https://your-site.com" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text-primary)">
          GitHub Username <span class="text-xs" style="color: var(--color-text-muted)">(optional)</span>
        </label>
        <BaseInput v-model="form.submitterGithub" placeholder="your-github-username" />
      </div>

      <!-- Turnstile placeholder -->
      <div class="flex items-center justify-center h-20 rounded-lg"
        :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }">
        <span class="text-sm" style="color: var(--color-text-muted)">Turnstile CAPTCHA will render here</span>
      </div>

      <button type="submit" class="btn-primary w-full flex items-center justify-center gap-2 h-11 text-base">
        Submit for Review
      </button>

      <p class="text-xs text-center" style="color: var(--color-text-muted)">
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

function handleSubmit() {
  // Placeholder — will integrate with Worker API
  console.log('Form submitted:', form)
}
</script>
