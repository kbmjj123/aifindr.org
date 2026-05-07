<template>
  <span class="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border whitespace-nowrap"
    :style="{
      background: 'var(--color-bg-elevated)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border)',
    }">
    <slot />
  </span>
</template>
