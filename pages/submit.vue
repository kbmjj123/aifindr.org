<template>
  <div>
    <h1 class="text-3xl font-bold mb-2" style="color: var(--color-text-primary)">Submit Your AI Tool</h1>
    <p class="text-base mb-8" style="color: var(--color-text-secondary)">
      Get 3 free dofollow backlinks for your tool. Open source, no account needed.
    </p>

    <!-- Dual tabs -->
    <div class="flex gap-1 mb-6 p-1 rounded-lg" :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
      <button v-for="tab in tabs" :key="tab.key"
        class="flex-1 h-9 rounded-md text-sm font-medium transition-all duration-150"
        :class="activeTab === tab.key ? 'active-tab' : ''"
        :style="activeTab === tab.key
          ? { background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }
          : { color: 'var(--color-text-secondary)' }"
        @click="activeTab = tab.key">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Dual column: GitHub PR tab -->
    <div v-if="activeTab === 'github'" class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 min-w-0 p-6 rounded-xl"
        :style="{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }">
        <div class="space-y-6">
          <div v-for="(step, i) in githubSteps" :key="i" class="flex gap-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              :style="{ background: 'var(--color-accent)', color: 'white' }">
              {{ i + 1 }}
            </div>
            <div>
              <h3 class="font-semibold mb-1" style="color: var(--color-text-primary)">{{ step.title }}</h3>
              <p class="text-sm" style="color: var(--color-text-secondary)">{{ step.description }}</p>
            </div>
          </div>

          <!-- Template preview -->
          <div class="p-4 rounded-lg text-sm font-mono"
            :style="{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }">
            <pre class="text-xs leading-relaxed" style="color: var(--color-text-secondary)">
---
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

## Description

Write a detailed description of your tool here...</pre>
          </div>

          <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
            class="btn-primary inline-flex items-center gap-2">
            Fork &amp; Submit on GitHub →
          </a>
        </div>
      </div>
      <div class="w-full lg:w-[300px] shrink-0">
        <BacklinkIncentive />
      </div>
    </div>

    <!-- Dual column: Online Form tab -->
    <div v-else class="flex flex-col lg:flex-row gap-8">
      <div class="flex-1 min-w-0">
        <SubmitForm />
      </div>
      <div class="w-full lg:w-[300px] shrink-0">
        <BacklinkIncentive />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

useHead({
  title: 'Submit Your AI Tool – aifindr.org',
})
</script>
