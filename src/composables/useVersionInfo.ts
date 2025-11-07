/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref, onMounted } from 'vue'
import { versionService } from '../services/domain/system'
import { useTranslations } from './useTranslations'

export interface VersionData {
  frontend: string
  api: string
  terminalTrainer: string
}

export function useVersionInfo() {
  const { t } = useTranslations({
    en: {
      version: {
        frontend: 'Frontend',
        api: 'API',
        terminalTrainer: 'Terminal Trainer',
        notAvailable: 'N/A',
        loading: 'Loading...',
        alpha: 'Alpha'
      }
    },
    fr: {
      version: {
        frontend: 'Interface',
        api: 'API',
        terminalTrainer: 'Terminal Trainer',
        notAvailable: 'N/D',
        loading: 'Chargement...',
        alpha: 'Alpha'
      }
    }
  })

  const versions = ref<VersionData>({
    frontend: __APP_VERSION__,
    api: t('version.loading'),
    terminalTrainer: t('version.notAvailable')
  })

  const isLoading = ref(true)
  const error = ref<string | null>(null)

  const loadVersions = async () => {
    try {
      isLoading.value = true
      const versionInfo = await versionService.getVersionInfo()

      versions.value = {
        frontend: __APP_VERSION__,
        api: versionInfo.api || t('version.notAvailable'),
        terminalTrainer: versionInfo.terminalTrainer || t('version.notAvailable')
      }

      error.value = null
    } catch (err: any) {
      console.error('Failed to load version info:', err)
      error.value = err.message
      // Keep frontend version, set others as not available
      versions.value = {
        frontend: __APP_VERSION__,
        api: t('version.notAvailable'),
        terminalTrainer: t('version.notAvailable')
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadVersions()
  })

  return {
    versions,
    isLoading,
    error,
    t
  }
}
