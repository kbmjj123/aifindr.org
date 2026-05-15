<template>
  <div style="display: flex; width: 100%; height: 100%; background: #080808; font-family: Inter, sans-serif;">
    <!-- Left brand panel -->
    <div style="display: flex; flex-direction: column; justify-content: space-between; width: 340px; height: 100%; padding: 60px 40px; flex-shrink: 0;">
      <!-- Site name -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 18px; height: 18px; background: #c8ff00; border-radius: 4px; flex-shrink: 0;" />
        <span style="font-size: 20px; font-weight: 700; color: #f0f0f0; letter-spacing: -0.3px;">aifindr</span>
        <span style="font-size: 20px; font-weight: 400; color: #555;">.org</span>
      </div>

      <!-- Green decorative elements -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 6px;">
          <div style="width: 32px; height: 4px; background: #c8ff00; border-radius: 2px;" />
          <div style="width: 16px; height: 4px; background: #c8ff00; border-radius: 2px; opacity: 0.5;" />
        </div>
        <div style="width: 120px; height: 2px; background: #c8ff00; border-radius: 1px; opacity: 0.3;" />
      </div>

      <!-- Bottom tagline -->
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 12px; color: #666; letter-spacing: 0.05em; text-transform: uppercase;">Open Source</div>
        <div style="font-size: 12px; color: #555; letter-spacing: 0.05em; text-transform: uppercase;">AI Tools Directory</div>
      </div>
    </div>

    <!-- Vertical separator -->
    <div style="width: 1px; height: 70%; align-self: center; background: linear-gradient(to bottom, transparent, #c8ff00 30%, #c8ff00 70%, transparent); flex-shrink: 0;" />

    <!-- Right content panel -->
    <div style="display: flex; flex-direction: column; justify-content: center; flex: 1; padding: 60px 60px 60px 50px; overflow: hidden;">
      <!-- Page type badge -->
      <div style="display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px; padding: 4px 12px; background: rgba(200, 255, 0, 0.1); border: 1px solid rgba(200, 255, 0, 0.25); border-radius: 20px;">
        <div style="width: 6px; height: 6px; background: #c8ff00; border-radius: 50%; flex-shrink: 0;" />
        <span style="font-size: 12px; color: #c8ff00; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;">{{ type || 'Page' }}</span>
      </div>

      <!-- Title -->
      <h1 style="font-size: 42px; font-weight: 800; color: #f0f0f0; line-height: 1.1; letter-spacing: -1px; margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
        {{ title }}
      </h1>

      <!-- Description -->
      <p v-if="description" style="font-size: 16px; color: #888; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 520px;">
        {{ description }}
      </p>
    </div>

    <!-- URL badge (bottom-right corner) -->
    <div style="position: absolute; bottom: 28px; right: 40px;">
      <span style="font-size: 13px; color: #555; font-weight: 400;">aifindr.org</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  type?: string
}>()
</script>
