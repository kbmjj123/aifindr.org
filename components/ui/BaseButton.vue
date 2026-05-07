<template>
  <component :is="tag" :class="btnClass" v-bind="attrs">
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
}>(), {
  variant: 'primary',
  size: 'md',
})

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
  return [base, props.size === 'sm' ? 'text-xs h-8 px-3' : ''].filter(Boolean).join(' ')
})
</script>
