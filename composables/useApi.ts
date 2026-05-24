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
  const fetch = import.meta.server ? useRequestFetch() : $fetch

  function get<T>(path: string, opts?: Parameters<typeof $fetch>[1]) {
    return fetch<T>(path, { baseURL: base, ...opts })
  }

  function post<T>(path: string, body: any, opts?: Parameters<typeof $fetch>[1]) {
    return fetch<T>(path, { method: 'POST', body, baseURL: base, ...opts })
  }

  return { get, post }
}