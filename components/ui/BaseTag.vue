<template>
  <span class="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium whitespace-nowrap"
    :style="{
      background: 'var(--color-bg-elevated)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    }">
    <slot />
  </span>
</template>
