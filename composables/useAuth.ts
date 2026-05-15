export interface AuthUser {
  id: number
  username: string
  email?: string
  avatar_url?: string
}

// Module-level shared state (global across all useAuth() calls)
const user = ref<AuthUser | null>(null)
const loading = ref(true)

export const useAuth = () => {
  const token = useCookie<string | null>('aifindr-token', { maxAge: 604800 })

  const isLoggedIn = computed(() => !!token.value)

  async function fetchUser() {
    if (!token.value) {
      loading.value = false
      return
    }
    try {
      // Cookie (aifindr-token) is sent automatically by the browser
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
    token.value = null
    user.value = null
    navigateTo('/')
  }

  /** Handle token from URL (?token=xxx) after OAuth callback */
  function handleUrlToken() {
		debugger
    if (import.meta.client) {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      if (urlToken) {
        token.value = urlToken
        window.history.replaceState({}, '', window.location.pathname)
        fetchUser()
      }
    }
  }

  return { token, user, loading, isLoggedIn, login, logout, fetchUser, handleUrlToken }
}
