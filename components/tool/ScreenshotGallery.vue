<template>
  <div>
    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div v-for="(url, i) in urls" :key="i"
        class="relative rounded-lg overflow-hidden cursor-pointer group"
        :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }"
        @click="open(i)">
        <img :src="url" :alt="`${alt} ${i + 1}`"
          class="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          :style="{ aspectRatio: '16/9' }" />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
      </div>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <div v-if="activeIndex !== null"
        class="fixed inset-0 z-[300] flex items-center justify-center"
        @click.self="close">
        <!-- Backdrop -->
        <div class="absolute inset-0" :style="{ background: 'rgba(0,0,0,0.85)' }" />

        <!-- Close button -->
        <button class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10 cursor-pointer"
          style="color: #fff; background: rgba(255,255,255,0.1)" @click="close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <!-- Counter -->
        <div class="absolute top-4 left-4 font-body text-[13px] z-10"
          style="color: rgba(255,255,255,0.6)">
          {{ activeIndex + 1 }} / {{ urls.length }}
        </div>

        <!-- Prev -->
        <button v-if="urls.length > 1"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full z-10 cursor-pointer"
          style="color: #fff; background: rgba(255,255,255,0.1)" @click="prev">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <!-- Image -->
        <img :src="urls[activeIndex]" :alt="`${alt} ${activeIndex + 1}`"
          class="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />

        <!-- Next -->
        <button v-if="urls.length > 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full z-10 cursor-pointer"
          style="color: #fff; background: rgba(255,255,255,0.1)" @click="next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  urls: string[]
  alt?: string
}>()

const activeIndex = ref<number | null>(null)

function open(i: number) { activeIndex.value = i }
function close() { activeIndex.value = null }
function prev() {
  if (activeIndex.value === null) return
  activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : props.urls.length - 1
}
function next() {
  if (activeIndex.value === null) return
  activeIndex.value = activeIndex.value < props.urls.length - 1 ? activeIndex.value + 1 : 0
}

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  if (activeIndex.value === null) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

if (import.meta.client) {
  document.addEventListener('keydown', onKeydown)
}
</script>
