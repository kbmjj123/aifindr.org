interface ToastState {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

export function useToast() {
  const toast = useState<ToastState>('toast', () => ({
    message: '',
    type: 'success',
    visible: false,
  }))

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function show(message: string, type: 'success' | 'error' = 'success') {
    if (timeoutId) clearTimeout(timeoutId)

    toast.value = { message, type, visible: true }

    timeoutId = setTimeout(() => {
      toast.value.visible = false
    }, 3000)
  }

  function hide() {
    toast.value.visible = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return {
    toast: readonly(toast),
    show,
    hide,
  }
}
