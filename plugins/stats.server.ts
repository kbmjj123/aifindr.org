export default defineNuxtPlugin(async () => {
  const stats = useState('global-stats', () => ({
    tools: 0,
    categories: 0,
    contributors: 0,
  }))

  if (import.meta.server) {
    try {
      const res = await $fetch<{ tools: number; categories: number; contributors: number }>('/api/stats')
      if (res) {
        stats.value = {
          tools: res.tools || 0,
          categories: res.categories || 0,
          contributors: res.contributors || 0,
        }
      }
    } catch {
      // stats non-critical
    }
  }
})
