<template>
  <component :is="tag" :class="[btnClass, className]" v-bind="attrs">
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  to?: string
  href?: string
  disabled?: boolean
  class?: string
}>(), {
  variant: 'primary',
  size: 'md',
})

const className = computed(() => props.class || '')

const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { disabled: props.disabled }
})

const btnClass = computed(() => {
  const base = props.variant === 'primary' ? 'btn-primary' : props.variant === 'secondary' ? 'btn-secondary' : 'btn-ghost'
  const size = props.size === 'sm' ? '!h-[30px] !px-[10px] !text-[11px]' : ''
  return `${base} ${size}`
})
</script>
