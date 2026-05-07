<template>
  <select :class="['select', { error }]" :value="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    v-bind="$attrs">
    <option v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
      {{ opt.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  options: { value: string; label: string; disabled?: boolean }[]
  error?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
