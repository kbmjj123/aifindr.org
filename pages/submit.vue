<template>
  <div class="max-w-[720px] mx-auto">
    <!-- Success banner -->
    <div v-if="route.query.success" class="mb-6 p-4 rounded-lg font-body text-[13px]"
      :style="{ background: 'var(--color-verified-bg)', border: '1px solid var(--color-verified-border)', color: 'var(--color-verified-text)' }">
      ✅ Tool submitted successfully! Our team will review it within 3–7 business days. You'll get your backlinks once approved.
    </div>

    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Submit Your AI Tool
    </h1>
    <p class="font-body text-[13px] mb-8" style="color: var(--color-text-secondary)">
      Get 3 free dofollow backlinks for your tool. Open source, no account needed.
    </p>

    <!-- Dual tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-md"
      :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <button v-for="tab in tabs" :key="tab.key"
        class="filter-tab flex-1 justify-center"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- GitHub PR tab -->
    <div v-if="activeTab === 'github'" class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 min-w-0 p-6 rounded-lg"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">

        <!-- Steps -->
        <div class="flex items-center justify-between gap-1 mb-6">
          <div v-for="(step, i) in githubSteps" :key="i" class="flex items-center gap-1.5 flex-1 min-w-0">
            <div class="w-6 h-6 rounded-full flex items-center justify-center font-sans font-bold text-[10px] shrink-0"
              :style="{ background: 'var(--color-accent)', color: '#000' }}">
              {{ i + 1 }}
            </div>
            <span class="font-body text-[11px] truncate" :style="{ color: 'var(--color-text-primary)' }">
              {{ step.short }}
            </span>
            <span v-if="i < githubSteps.length - 1" class="hidden sm:block flex-1 h-px mx-1" :style="{ background: 'var(--color-border)' }"></span>
          </div>
        </div>

        <!-- Template -->
        <div class="p-3 rounded-md font-body text-[12px] leading-relaxed overflow-x-auto"
          :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }">
          <pre class="text-[12px]">{{ templateMd }}</pre>
        </div>

        <a href="https://github.com/kbmjj123/aifindr.org" target="_blank" rel="noopener noreferrer"
          class="btn-primary inline-flex items-center gap-2 mt-6">
          Fork &amp; Submit on GitHub →
        </a>
      </div>
      <div class="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-[76px] lg:self-start">
        <BacklinkIncentive />
      </div>
    </div>

    <!-- Online Form tab -->
    <div v-else class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 min-w-0">
        <SubmitForm />
      </div>
      <div class="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-[76px] lg:self-start">
        <BacklinkIncentive />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import templateMd from '~/data/submit-template.md?raw'

const route = useRoute()
const activeTab = ref('form')

const tabs = [
  { key: 'github', label: 'GitHub PR', icon: '⎇' },
  { key: 'form', label: 'Online Form', icon: '📝' },
]

const githubSteps = [
  { short: 'Fork' },
  { short: 'Create File' },
  { short: 'Submit PR' },
  { short: 'Get Links' },
]

usePageSeo({
  title: 'Submit Your AI Tool – Get Free Backlinks',
  template: 'prefix',
  description: 'Get 3 free dofollow backlinks when you submit your AI tool to aifindr.org. Open source, no account needed.',
})
</script>
