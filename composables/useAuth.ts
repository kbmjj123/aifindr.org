export interface AuthUser {
  id: number
  username: string
  email?: string
  avatar_url?: string
}

const COOKIE_NAME = 'aifindr-token'
const MAX_AGE = 604800

function getCookie(): string | null {
  if (import.meta.server) return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(value: string | null) {
  if (import.meta.server) return
  if (value) {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
  }
}

// Module-level shared state — NOT useCookie, avoids SSG hydration clearing value
const token = ref<string | null>(null)
const user = ref<AuthUser | null>(null)
const loading = ref(false)

export const useAuth = () => {
  const isLoggedIn = computed(() => !!token.value)

  async function fetchUser() {
    if (!token.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const data = await $fetch<AuthUser>('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function login() {
    window.location.href = '/api/auth/github'
  }

  function logout() {
    setCookie(null)
    token.value = null
    user.value = null
    navigateTo('/')
  }

  /** Handle token from URL (?token=xxx) after OAuth callback */
  function handleUrlToken() {
    if (import.meta.server) return
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      setCookie(urlToken)
      token.value = urlToken
      window.history.replaceState({}, '', window.location.pathname)
      fetchUser()
    }
  }

  /** Restore session from existing cookie on app start */
  function restoreSession() {
    if (import.meta.server) return
    const existing = getCookie()
    if (existing) {
      token.value = existing
      fetchUser()
    } else {
      loading.value = false
    }
  }

  return { token, user, loading, isLoggedIn, login, logout, fetchUser, handleUrlToken, restoreSession }
}
