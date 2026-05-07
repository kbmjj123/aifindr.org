<template>
  <Teleport to="body">
    <div v-if="visible" :class="['toast', type]" :style="{ animation: 'toast-slide-in 300ms ease' }">
      {{ message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  type?: 'success' | 'error'
  visible?: boolean
}>(), {
  type: 'success',
  visible: false,
})
</script>

<style scoped>
@keyframes toast-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
