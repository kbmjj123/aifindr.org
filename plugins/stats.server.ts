export default defineNuxtPlugin(async () => {
  const stats = useState('global-stats', () => ({
    tools: 0,
    categories: 0,
    contributors: 0,
    sites: 0,
    lists: 0,
  }))

  if (import.meta.server) {
    try {
      const res = await $fetch<{
        tools: number; categories: number; contributors: number; sites: number; lists: number
      }>('/api/stats')
      if (res) {
        stats.value = {
          tools: res.tools || 0,
          categories: res.categories || 0,
          contributors: res.contributors || 0,
          sites: res.sites || 0,
          lists: res.lists || 0,
        }
      }
    } catch {
      // stats non-critical
    }
  }
})
