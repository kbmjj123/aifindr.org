<template>
  <div class="flex flex-wrap items-center gap-3 mb-8">
    <div class="flex gap-1">
      <button
        v-for="opt in pricingOptions"
        :key="opt.value"
        class="h-[30px] px-3 rounded-md font-body text-[11px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150"
        :style="{
          background: modelValue.pricing === opt.value ? 'var(--color-accent-dim)' : 'transparent',
          border: modelValue.pricing === opt.value ? '1px solid var(--color-accent-border)' : '1px solid transparent',
          color: modelValue.pricing === opt.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }"
        @click="update('pricing', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <span class="font-body text-[10px]" style="color: var(--color-text-muted)">|</span>

    <div class="flex gap-1">
      <button
        v-for="opt in sortOptions"
        :key="opt.value"
        class="h-[30px] px-3 rounded-md font-body text-[11px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150"
        :style="{
          background: modelValue.sort === opt.value ? 'var(--color-accent-dim)' : 'transparent',
          border: modelValue.sort === opt.value ? '1px solid var(--color-accent-border)' : '1px solid transparent',
          color: modelValue.sort === opt.value ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }"
        @click="update('sort', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: { pricing: string; sort: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { pricing: string; sort: string }]
}>()

function update(key: 'pricing' | 'sort', value: string) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const pricingOptions = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Freemium', value: 'freemium' },
  { label: 'Paid', value: 'paid' },
]

const sortOptions = [
  { label: 'Latest', value: 'latest' },
  { label: 'Trending', value: 'trending' },
  { label: 'Featured', value: 'featured' },
]
</script>
