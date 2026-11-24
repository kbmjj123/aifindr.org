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
      Get 3 permanent dofollow backlinks for your tool — on GitHub Pages, your tool page, and your contributor page.
    </p>

    <div class="flex flex-col lg:flex-row gap-8">
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
const route = useRoute()

usePageSeo({
  title: 'Submit Your AI Tool – Get Free Backlinks',
  template: 'prefix',
  description: 'Get 3 permanent dofollow backlinks when you submit your AI tool to aifindr.org — on GitHub Pages, your tool page and your contributor page.',
})
</script>
