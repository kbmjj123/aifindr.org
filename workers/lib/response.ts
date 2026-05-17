export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export function error(message: string, status: number, code?: string) {
  return json({ error: message, ...(code ? { code } : {}) }, status)
}

/** Match a URL path against a pattern like /tools/:category/:slug */
export function matchPath(path: string, pattern: string): Record<string, string> | null {
  const parts = pattern.split('/')
  const actual = path.split('/')
  if (parts.length !== actual.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]?.startsWith(':')) {
      params[parts[i].slice(1)] = actual[i]
    } else if (parts[i] !== actual[i]) {
      return null
    }
  }
  return params
}
