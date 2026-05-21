<template>
  <Teleport to="body">
    <div v-if="isVisible" :class="['toast', type]" :style="{ animation: 'toast-slide-in 280ms ease' }">
      {{ message }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  message?: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}>(), {
  message: '',
  type: 'info',
  duration: 3000,
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(false)

onMounted(() => {
  nextTick(() => { isVisible.value = true })
  if (props.duration > 0) {
    setTimeout(() => {
      isVisible.value = false
      setTimeout(() => emit('close'), 280)
    }, props.duration)
  }
})
</script>

<style scoped>
@keyframes toast-slide-in {
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
