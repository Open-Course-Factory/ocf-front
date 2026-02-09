import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { terminalService } from '../services/domain/terminal'
import { useStoreTranslations } from '../composables/useTranslations'
import type { Backend } from '../types/entities'

export const useTerminalBackendsStore = defineStore('terminalBackends', () => {

  // State
  const backends = ref<Backend[]>([])
  const selectedBackendId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref('')

  // Translations
  const { t } = useStoreTranslations({
    en: {
      terminalBackends: {
        loadError: 'Failed to load backends',
        setDefaultError: 'Failed to set default backend',
        setDefaultSuccess: 'Default backend updated',
        backendOffline: 'Backend "{name}" is offline',
        noBackends: 'No backends available',
        allOffline: 'All backends are offline'
      }
    },
    fr: {
      terminalBackends: {
        loadError: 'Échec du chargement des backends',
        setDefaultError: 'Échec de la définition du backend par défaut',
        setDefaultSuccess: 'Backend par défaut mis à jour',
        backendOffline: 'Le backend « {name} » est hors ligne',
        noBackends: 'Aucun backend disponible',
        allOffline: 'Tous les backends sont hors ligne'
      }
    }
  })

  // Computed
  const defaultBackend = computed(() =>
    backends.value.find(b => b.is_default)
  )

  const onlineBackends = computed(() =>
    backends.value.filter(b => b.connected)
  )

  const hasMultipleBackends = computed(() =>
    backends.value.length > 1
  )

  const selectedBackend = computed(() =>
    backends.value.find(b => b.id === selectedBackendId.value) || null
  )

  // Actions
  async function fetchBackends(organizationId?: string) {
    isLoading.value = true
    error.value = ''

    try {
      backends.value = await terminalService.getBackends(organizationId)
      autoSelectDefault()
      return backends.value
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || t('terminalBackends.loadError')
      backends.value = []
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function setSystemDefault(backendId: string) {
    error.value = ''

    try {
      const updated = await terminalService.setDefaultBackend(backendId)

      // Update local state: clear old default, set new one
      backends.value = backends.value.map(b => ({
        ...b,
        is_default: b.id === backendId
      }))

      return updated
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || t('terminalBackends.setDefaultError')
      throw err
    }
  }

  function selectBackend(id: string) {
    selectedBackendId.value = id
  }

  function clearSelection() {
    selectedBackendId.value = null
  }

  function autoSelectDefault() {
    // If we already have a valid selection, keep it
    if (selectedBackendId.value) {
      const stillExists = backends.value.find(
        b => b.id === selectedBackendId.value && b.connected
      )
      if (stillExists) return
    }

    // Auto-select the default backend if it's online
    const def = defaultBackend.value
    if (def && def.connected) {
      selectedBackendId.value = def.id
      return
    }

    // Fallback: first online backend
    const firstOnline = onlineBackends.value[0]
    if (firstOnline) {
      selectedBackendId.value = firstOnline.id
      return
    }

    selectedBackendId.value = null
  }

  return {
    // State
    backends,
    selectedBackendId,
    isLoading,
    error,

    // Computed
    defaultBackend,
    onlineBackends,
    hasMultipleBackends,
    selectedBackend,

    // Actions
    fetchBackends,
    setSystemDefault,
    selectBackend,
    clearSelection
  }
})
