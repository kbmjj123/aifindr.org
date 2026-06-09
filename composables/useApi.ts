export function useApi() {
  const config = useRuntimeConfig()

  function getBase() {
    if (!import.meta.server) return ''
    if (config.apiBase) return config.apiBase
    const { origin } = useRequestURL()
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