<template>
  <footer class="lg:ml-60 py-8 px-4 text-center text-xs"
    :style="{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }">
    <div class="max-w-[1160px] mx-auto">
      <p class="mb-2">
        <NuxtLink to="/" class="hover:underline" style="color: var(--color-text-secondary)">aifindr.org</NuxtLink>
        — Open-source AI tool directory.
      </p>
      <p>
        <a href="https://github.com/aifindr-org/aifindr.org" target="_blank" rel="noopener noreferrer" class="hover:underline" style="color: var(--color-text-secondary)">
          GitHub
        </a>
        &middot; Built with Nuxt &amp; Cloudflare
      </p>
    </div>
  </footer>
</template>
