export function useApi() {
  const config = useRuntimeConfig()

  function getBase() {
    if (!import.meta.server) return ''
		if (config.apiBase) return config.apiBase
		const { origin } = useRequestURL()
		console.log('SSR base:', origin)  // 加这行
		return origin
  }

  const base = getBase()

  function get<T>(path: string, opts?: Parameters<typeof $fetch>[1]) {
    return $fetch<T>(path, opts)
  }

  function post<T>(path: string, body: any, opts?: Parameters<typeof $fetch>[1]) {
    return $fetch<T>(path, { method: 'POST', body, ...opts })
  }

  return { get, post }
}