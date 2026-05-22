export function useApi() {
  const config = useRuntimeConfig()

  const base = import.meta.server && config.apiBase ? config.apiBase : ''

  function get<T>(path: string, opts?: Parameters<typeof $fetch>[1]) {
		console.info('get', path, opts)
    return $fetch<T>(`${base}${path}`, opts)
  }

  function post<T>(path: string, body: any, opts?: Parameters<typeof $fetch>[1]) {
    return $fetch<T>(`${base}${path}`, { method: 'POST', body, ...opts })
  }

  return { get, post }
}