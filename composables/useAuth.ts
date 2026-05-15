export interface AuthUser {
  id: number
  username: string
  email?: string
  avatar_url?: string
}

// Module-level shared state
const user = ref<AuthUser | null>(null)
const loading = ref(false)

// Token stored in localStorage (not useCookie — SSG hydration clears cookies)
function lsGet(): string | null {
  if (import.meta.server) return null
  return localStorage.getItem('aifindr-token')
}

export const useAuth = () => {
  const token = ref<string | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  async function fetchUser() {
    const t = token.value
    if (!t) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const data = await $fetch<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
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
    localStorage.removeItem('aifindr-token')
    token.value = null
    user.value = null
    navigateTo('/')
  }

  /** Restore token from localStorage on mount */
  function handleUrlToken() {
    if (import.meta.server) return
    const stored = lsGet()
    if (stored) {
      token.value = stored
      fetchUser()
    } else {
      loading.value = false
    }
  }

  return { token, user, loading, isLoggedIn, login, logout, fetchUser, handleUrlToken }
}
