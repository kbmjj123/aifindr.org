<template>
  <div class="flex items-center">
    <!-- Logged in: avatar + dropdown -->
    <div v-if="isLoggedIn && user" class="relative" @click.stop>
      <button class="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="dropdownOpen = !dropdownOpen">
        <div class="w-6 h-6 rounded-full flex items-center justify-center font-sans font-bold text-[10px]"
          :style="{ background: 'var(--color-accent)', color: '#000' }">
          {{ user.username[0]?.toUpperCase() }}
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div v-if="dropdownOpen" class="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg z-50"
        :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-modal)' }"
        @click="dropdownOpen = false">
        <div class="px-3 py-2 font-body text-[11px] truncate" :style="{ color: 'var(--color-text-muted)' }">
          {{ user.email || user.username }}
        </div>
        <div :style="{ borderTop: '1px solid var(--color-border)' }" />
        <NuxtLink to="/settings" class="block w-full text-left px-3 py-2 font-body text-[12px] transition-colors"
          :style="{ color: 'var(--color-text-secondary)' }"
          style="display: block;">Settings</NuxtLink>
        <div :style="{ borderTop: '1px solid var(--color-border)' }" />
        <button class="w-full text-left px-3 py-2 font-body text-[12px] transition-colors"
          :style="{ color: 'var(--color-text-secondary)' }"
          @click="logout">Sign Out</button>
      </div>
    </div>

    <!-- Not logged in: sign in button -->
    <button v-else class="flex items-center gap-1.5 h-7 px-2.5 rounded-md font-body text-[11px] transition-colors"
      :style="{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }"
      @click="login">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      Sign in
    </button>
  </div>
</template>

<script setup lang="ts">
const { user, isLoggedIn, loading, login, logout } = useAuth()
const dropdownOpen = ref(false)

// Close dropdown on outside click
if (import.meta.client) {
  document.addEventListener('click', () => { dropdownOpen.value = false })
}
</script>
