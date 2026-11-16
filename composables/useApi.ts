export function useApi() {
  const config = useRuntimeConfig()

  function getBase() {
    if (!import.meta.server) return ''
    const { origin } = useRequestURL()
    // SSR 用 useRequestFetch() 进程内调用，必须走同源。
    // 本地 .env 里的 8787 是历史遗留（wrangler dev 端口），本地并无该服务，
    // 直接用会 fetch failed 导致页面落空态；生产环境的 https apiBase 保留原行为。
    if (config.apiBase && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(config.apiBase)) {
      return config.apiBase
    }
    return origin
  }

  const base = getBase()

  // SSR 用 useRequestFetch()，进程内直接调用，不走网络，避免 Workers 自调用 522
  // CSR 用 $fetch，行为与之前完全一致
  const fetcher = import.meta.server ? useRequestFetch() : $fetch

  function authHeaders(): Record<string, string> {
    if (import.meta.server) return {}                          // SSR 预渲染无需鉴权
    const token = localStorage.getItem('aifindr-token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  function get<T>(path: string, opts?: Parameters<typeof $fetch>[1]) {
    return fetcher<T>(path, {
      baseURL: base,
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> | undefined) },
    })
  }

  function post<T>(path: string, body: any, opts?: Parameters<typeof $fetch>[1]) {
    return fetcher<T>(path, {
      method: 'POST',
      body,
      baseURL: base,
      ...opts,
      headers: { ...authHeaders(), ...(opts?.headers as Record<string, string> | undefined) },
    })
  }

  return { get, post }
}