<template>
  <footer class="lg:pl-[220px] py-8 px-6 text-center"
    :style="{ borderTop: '1px solid var(--color-border)' }">
    <div class="max-w-[1400px] mx-auto">
      <p class="font-body text-xs" style="color: var(--color-text-muted)">
        <NuxtLink to="/" style="color: var(--color-text-secondary)">aifindr.org</NuxtLink>
        &nbsp;&mdash;&nbsp;Open-source AI tool directory.
        <br class="sm:hidden" />
        <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer"
          style="color: var(--color-text-secondary)">GitHub</a>
        &nbsp;&middot;&nbsp;Built with Nuxt &amp; Cloudflare
      </p>
    </div>
  </footer>
</template>
