import type { Tool } from '~/types/tool'

export function useSearch() {
  const isOpen = useState('searchModalOpen', () => false)
  const query = ref('')
  const results = ref<Tool[]>([])
  const loading = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function open() { isOpen.value = true }
  function close() {
    isOpen.value = false
    query.value = ''
    results.value = []
  }
  function toggle() { isOpen.value = !isOpen.value }

  async function search(q: string) {
    if (!q.trim()) {
      results.value = []
      return
    }
    loading.value = true
    try {
      const { data } = await useFetch<{ tools: Tool[] }>(`/api/tools/search?q=${encodeURIComponent(q)}`)
      results.value = data.value?.tools || []
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  function debouncedSearch(q: string) {
    query.value = q
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => search(q), 200)
  }

  return {
    isOpen: readonly(isOpen),
    query: readonly(query),
    results: readonly(results),
    loading: readonly(loading),
    open,
    close,
    toggle,
    search,
    debouncedSearch,
  }
}
