<template>
  <footer class="lg:pl-[220px] py-8 px-6"
    :style="{ borderTop: '1px solid var(--color-border)' }">
    <div class="max-w-[1400px] mx-auto">
      <LinkExchange />
      <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mb-3">
        <NuxtLink to="/privacy" class="font-body text-[11px]" style="color: var(--color-text-muted);">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="font-body text-[11px]" style="color: var(--color-text-muted);">Terms</NuxtLink>
        <NuxtLink to="/submit" class="font-body text-[11px]" style="color: var(--color-text-muted);">Submit</NuxtLink>
        <a href="https://github.com/kbmjj123/aifindr.org" target="_blank" rel="noopener noreferrer"
          class="font-body text-[11px]" style="color: var(--color-text-muted);">GitHub</a>
      </div>
      <p class="font-body text-xs text-center" style="color: var(--color-text-muted)">
        <NuxtLink to="/" style="color: var(--color-text-secondary)">aifindr.org</NuxtLink>
        &nbsp;&mdash;&nbsp;Open-source AI tool directory.
        <br class="sm:hidden" />
        Built with Nuxt &amp; Cloudflare
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import LinkExchange from './LinkExchange.vue'
</script>
