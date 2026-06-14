<template>
  <div class="relative group/shell">
    <!-- Horizontal scroll container -->
    <div ref="scrollEl"
      class="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-lg"
      :style="{ scrollbarWidth: 'none', msOverflowStyle: 'none' }"
      @scroll="updateArrows">
      <div v-for="(url, i) in urls" :key="i"
        class="flex-none w-full snap-center rounded-lg overflow-hidden cursor-pointer"
        :style="{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', aspectRatio: '16/9' }"
        @click="open(i)">
        <img :src="url" :alt="`${alt} ${i + 1}`" class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- Left arrow -->
    <button v-if="showPrev"
      class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover/shell:opacity-100 transition-opacity cursor-pointer z-10"
      style="color: #fff; background: rgba(0,0,0,0.55)"
      @click="scrollBy(-1)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>

    <!-- Right arrow -->
    <button v-if="showNext"
      class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover/shell:opacity-100 transition-opacity cursor-pointer z-10"
      style="color: #fff; background: rgba(0,0,0,0.55)"
      @click="scrollBy(1)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>

    <!-- Dots indicator -->
    <div v-if="urls.length > 1" class="flex items-center justify-center gap-1.5 mt-2">
      <button v-for="(_, i) in urls" :key="i"
        class="w-1.5 h-1.5 rounded-full transition-all cursor-pointer"
        :style="{
          background: i === currentPage ? 'var(--color-accent)' : 'var(--color-border)',
          width: i === currentPage ? '6px' : '5px',
        }"
        @click="scrollTo(i)" />
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <div v-if="activeIndex !== null"
        class="fixed inset-0 z-[300] flex items-center justify-center"
        @click.self="close">
        <div class="absolute inset-0" :style="{ background: 'rgba(0,0,0,0.85)' }" />

        <button class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10 cursor-pointer"
          style="color: #fff; background: rgba(255,255,255,0.1)" @click="close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div class="absolute top-4 left-4 font-body text-[13px] z-10"
          style="color: rgba(255,255,255,0.6)">
          {{ activeIndex + 1 }} / {{ urls.length }}
        </div>

        <button v-if="urls.length > 1"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full z-10 cursor-pointer"
          style="color: #fff; background: rgba(255,255,255,0.1)" @click="prev">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <img :src="urls[activeIndex]" :alt="`${alt} ${activeIndex + 1}`"
          class="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />

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

const scrollEl = ref<HTMLDivElement | null>(null)
const currentPage = ref(0)
const showPrev = ref(false)
const showNext = ref(true)
const activeIndex = ref<number | null>(null)

function updateArrows() {
  const el = scrollEl.value
  if (!el) return
  showPrev.value = el.scrollLeft > 10
  showNext.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
  const idx = Math.round(el.scrollLeft / el.clientWidth)
  currentPage.value = Math.min(idx, props.urls.length - 1)
}

function scrollBy(dir: number) {
  const el = scrollEl.value
  if (!el) return
  const idx = currentPage.value + dir
  if (idx < 0 || idx >= props.urls.length) return
  el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
}

function scrollTo(i: number) {
  const el = scrollEl.value
  if (!el) return
  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}

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
