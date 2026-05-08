import type { Tool } from '~/types/tool'

interface FetchToolsParams {
  category?: string
  pricing?: string
  platform?: string
  tags?: string
  sort?: 'latest' | 'trending' | 'featured'
  page?: number
  pageSize?: number
}

interface ToolsResponse {
  tools: Tool[]
  total: number
  page: number
  pageSize: number
}

export function useTools() {
  const tools = ref<Tool[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(24)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTools(params?: FetchToolsParams) {
    loading.value = true
    error.value = null

    try {
      const query = new URLSearchParams()
      if (params?.category) query.set('category', params.category)
      if (params?.pricing) query.set('pricing', params.pricing)
      if (params?.platform) query.set('platform', params.platform)
      if (params?.tags) query.set('tags', params.tags)
      if (params?.sort) query.set('sort', params.sort)
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))

      const { data } = await useFetch<ToolsResponse>(`/api/tools?${query.toString()}`)
      if (data.value) {
        tools.value = data.value.tools || []
        total.value = data.value.total
        page.value = data.value.page
        pageSize.value = data.value.pageSize
      } else {
        tools.value = []
        total.value = 0
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tools'
      tools.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchTool(category: string, slug: string): Promise<Tool | null> {
    loading.value = true
    error.value = null

    try {
      const { data } = await useFetch<Tool>(`/api/tools/${category}/${slug}`)
      return data.value || null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch tool'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    tools: readonly(tools),
    total: readonly(total),
    page: readonly(page),
    pageSize: readonly(pageSize),
    loading: readonly(loading),
    error: readonly(error),
    fetchTools,
    fetchTool,
  }
}
