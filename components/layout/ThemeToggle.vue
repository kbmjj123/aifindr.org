<template>
  <button class="btn-theme-toggle"
    :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle">
    <!-- 夜间显示 ☀️（点击切换到日间），日间显示 🌙（点击切换到夜间） -->
    <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>
