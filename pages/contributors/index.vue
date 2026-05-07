<template>
  <div>
    <h1 class="font-sans font-extrabold text-[24px] tracking-tight mb-2" style="color: var(--color-text-primary)">
      Contributors
    </h1>
    <p class="font-body text-[12px] mb-8" style="color: var(--color-text-muted)">
      People who have submitted AI tools to aifindr.org.
    </p>

    <div class="rounded-lg overflow-hidden"
      :style="{ border: '1px solid var(--color-border)' }">
      <table class="w-full font-body text-[12px]">
        <thead>
          <tr :style="{ background: 'var(--color-bg-surface)' }">
            <th class="text-left px-4 py-3 font-medium" style="color: var(--color-text-muted)">#</th>
            <th class="text-left px-4 py-3 font-medium" style="color: var(--color-text-muted)">Contributor</th>
            <th class="text-left px-4 py-3 font-medium hidden sm:table-cell" style="color: var(--color-text-muted)">Tools</th>
            <th class="text-left px-4 py-3 font-medium hidden md:table-cell" style="color: var(--color-text-muted)">Website</th>
            <th class="text-left px-4 py-3 font-medium hidden md:table-cell" style="color: var(--color-text-muted)">Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in contributors" :key="c.username"
            :style="{ borderTop: '1px solid var(--color-border)' }"
            class="hover:bg-[var(--color-bg-elevated)]">
            <td class="px-4 py-3" style="color: var(--color-text-muted)">
              <span v-if="i === 0">🥇</span>
              <span v-else-if="i === 1">🥈</span>
              <span v-else-if="i === 2">🥉</span>
              <span v-else>{{ i + 1 }}</span>
            </td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/contributors/${c.username}`" class="flex items-center gap-2"
                style="color: var(--color-text-primary)">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-sans font-bold text-[11px]"
                  :style="{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }">
                  {{ c.username.charAt(0).toUpperCase() }}
                </div>
                <span class="font-body font-medium">{{ c.username }}</span>
              </NuxtLink>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell" style="color: var(--color-text-secondary)">
              {{ c.toolCount }}
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <a v-if="c.website" :href="c.website" target="_blank"
                class="hover:underline" style="color: var(--color-text-link)">
                {{ c.website!.replace(/^https?:\/\//, '') }}
              </a>
            </td>
            <td class="px-4 py-3 hidden md:table-cell" style="color: var(--color-text-muted)">
              {{ c.joined }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const contributors = [
  { username: 'johndoe', toolCount: 5, website: 'https://johndoe.com', joined: '2026-01' },
  { username: 'alice', toolCount: 3, website: 'https://alice.dev', joined: '2026-02' },
  { username: 'bob', toolCount: 2, website: '', joined: '2026-03' },
  { username: 'charlie', toolCount: 1, website: 'https://charlie.ai', joined: '2026-04' },
]

useHead({
  title: 'Contributors – aifindr.org',
})
</script>
