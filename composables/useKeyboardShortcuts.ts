export function useKeyboardShortcuts() {
  const { isOpen, toggle } = useSearch()

  function handleKeydown(e: KeyboardEvent) {
    // Cmd+K / Ctrl+K — open search modal
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      toggle()
    }

    // Escape — close search modal
    if (e.key === 'Escape' && isOpen.value) {
      e.preventDefault()
      // useSearch().close() is called by the modal itself
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('keydown', handleKeydown)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('keydown', handleKeydown)
    }
  })
}
