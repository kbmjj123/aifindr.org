<template>
  <div class="link-exchange group" v-if="links.length">
    <div class="flex items-center gap-2.5 max-w-full">
      <span class="link-ex-label">🔗 Friend Links</span>
      <div
        class="flex-1 overflow-hidden"
        :style="{ maskImage: 'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)' }"
      >
        <div class="link-ex-track flex items-center gap-2">
          <template v-for="(link, i) in loopedLinks" :key="`${i}-${link.name}`">
            <span v-if="i > 0" class="link-ex-dot">·</span>
            <a
              v-if="link.type === 'image'"
              :href="link.url"
              target="_blank"
              rel="noopener"
              class="link-ex-badge"
            >
              <img
                :src="link.imageUrl"
                :width="link.imageWidth ?? 200"
                :height="link.imageHeight ?? 40"
                :alt="link.alt ?? link.name"
                loading="lazy"
              />
            </a>
            <a
              v-else
              :href="link.url"
              target="_blank"
              rel="noopener"
              class="link-ex-item"
            >{{ link.name }}</a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { exchangeLinks, type ExchangeLink } from '~/data/exchange-links'

const links = exchangeLinks

// Duplicate for seamless marquee loop
const loopedLinks = computed(() => [...links, ...links])
</script>

<style scoped>
.link-exchange {
  --_speed: 80s;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.link-ex-label {
  font-size: 10px;
  font-family: var(--font-body);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  flex-shrink: 0;
}

.link-ex-track {
  width: fit-content;
  animation: link-scroll var(--_speed) linear infinite;
}

.group:hover .link-ex-track {
  animation-play-state: paused;
}

.link-ex-dot {
  font-size: 10px;
  color: var(--color-text-muted);
  opacity: 0.4;
  flex-shrink: 0;
}

.link-ex-item {
  font-size: 11px;
  font-family: var(--font-body);
  color: var(--color-text-muted);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.link-ex-item:hover {
  color: var(--color-text-link);
}

.link-ex-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.15s ease;
  line-height: 0;
}

.link-ex-badge:hover {
  opacity: 1;
}

.link-ex-badge img {
  height: 28px;
  width: auto;
}

@keyframes link-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
