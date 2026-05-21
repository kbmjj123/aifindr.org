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
        <div class="space-y-6">
          <div v-for="(step, i) in githubSteps" :key="i" class="flex gap-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-sans font-bold text-[13px] shrink-0"
              :style="{ background: 'var(--color-accent)', color: '#000' }">
              {{ i + 1 }}
            </div>
            <div>
              <h3 class="font-sans font-semibold text-[13px] mb-1" style="color: var(--color-text-primary)">
                {{ step.title }}
              </h3>
              <p class="font-body text-[12px]" style="color: var(--color-text-secondary)">
                {{ step.description }}
              </p>
            </div>
          </div>

          <!-- Template preview -->
          <div class="p-4 rounded-md font-body text-[12px] leading-relaxed"
            :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }">
            <pre class="text-[11px]">---
name: "Your Tool Name"
slug: "your-tool-slug"
website: "https://your-tool.com"
category: "image"
tags: ["tag1", "tag2"]
pricing: "free"
platforms: ["web"]
submitter_site: "https://your-site.com"
submitter_github: "your-username"
---

## What is [Your Tool]?

Write a detailed description of your tool here (Markdown supported).

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Pricing

Brief description of your pricing model.</pre>          </div>

          <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
            class="btn-primary inline-flex items-center gap-2">
            Fork &amp; Submit on GitHub →
          </a>
        </div>
      </div>
      <div class="w-full lg:w-[280px] shrink-0">
        <BacklinkIncentive />
      </div>
    </div>

    <!-- Online Form tab -->
    <div v-else class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 min-w-0">
        <SubmitForm />
      </div>
      <div class="w-full lg:w-[280px] shrink-0">
        <BacklinkIncentive />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const activeTab = ref('form')

const tabs = [
  { key: 'github', label: 'GitHub PR', icon: '⎇' },
  { key: 'form', label: 'Online Form', icon: '📝' },
]

const githubSteps = [
  { title: 'Fork the Repository', description: 'Fork the aifindr.org GitHub repository to your account.' },
  { title: 'Create a Markdown File', description: 'Create a new .md file in content/tools/[category]/ directory with the frontmatter template below.' },
  { title: 'Submit a Pull Request', description: 'Open a PR with your new tool file. We\'ll review and merge it within 48 hours.' },
  { title: 'Get Your Backlinks', description: 'Once merged, you\'ll receive 3 dofollow backlinks automatically.' },
]

usePageSeo({
  title: 'Submit Your AI Tool – Get Free Backlinks',
  template: 'prefix',
  description: 'Get 3 free dofollow backlinks when you submit your AI tool to aifindr.org. Open source, no account needed.',
})
</script>
