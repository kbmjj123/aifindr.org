import type { Tool } from '~/types/tool'

export function useTools() {
  const tools = ref<Tool[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTools(params?: {
    category?: string
    pricing?: string
    sort?: string
    page?: number
    pageSize?: number
  }) {
    loading.value = true
    error.value = null

    try {
      const query = new URLSearchParams()
      if (params?.category) query.set('category', params.category)
      if (params?.pricing) query.set('pricing', params.pricing)
      if (params?.sort) query.set('sort', params.sort)
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))

      const { data } = await useFetch(`/api/tools?${query.toString()}`)
      tools.value = (data.value as unknown as Tool[]) || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tools'
    } finally {
      loading.value = false
    }
  }

  async function fetchTool(category: string, slug: string) {
    loading.value = true
    error.value = null

    try {
      const { data } = await useFetch(`/api/tools/${category}/${slug}`)
      return (data.value as unknown as Tool) || null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tool'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    tools: readonly(tools),
    loading: readonly(loading),
    error: readonly(error),
    fetchTools,
    fetchTool,
  }
}
