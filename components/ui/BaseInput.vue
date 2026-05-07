<template>
  <input :class="['input', { error }]" :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    v-bind="$attrs" />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  error?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
