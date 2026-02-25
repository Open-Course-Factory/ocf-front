import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bulkImportService, type ImportResponse } from '../services/domain/bulkImport'
import { useStoreTranslations } from '../composables/useTranslations'

type ImportStep = 'upload' | 'validating' | 'validation-results' | 'importing' | 'success' | 'error'

const translations = {
  en: {
    bulkImport: {
      loadError: 'Failed to load import data',
      validateError: 'Validation failed',
      importError: 'Import failed',
      uploadError: 'File upload failed',
      parseError: 'Failed to parse CSV file',
      invalidFile: 'Invalid file format',
      fileTooLarge: 'File exceeds size limit (10MB)',
      importSuccess: 'Import completed successfully',
      validationSuccess: 'Validation completed successfully'
    }
  },
  fr: {
    bulkImport: {
      loadError: 'Échec du chargement des données d\'importation',
      validateError: 'Échec de la validation',
      importError: 'Échec de l\'importation',
      uploadError: 'Échec du téléchargement du fichier',
      parseError: 'Échec de l\'analyse du fichier CSV',
      invalidFile: 'Format de fichier invalide',
      fileTooLarge: 'Le fichier dépasse la limite de taille (10 Mo)',
      importSuccess: 'Importation terminée avec succès',
      validationSuccess: 'Validation terminée avec succès'
    }
  }
}

export const useBulkImportStore = defineStore('bulkImport', () => {
  const { t } = useStoreTranslations(translations)

  // State
  const usersFile = ref<File | null>(null)
  const groupsFile = ref<File | null>(null)
  const membershipsFile = ref<File | null>(null)

  const dryRun = ref(true)
  const updateExisting = ref(false)
  const targetGroupId = ref<string>('')

  const step = ref<ImportStep>('upload')
  const isValidating = ref(false)
  const isImporting = ref(false)

  const validationResults = ref<ImportResponse | null>(null)
  const importResults = ref<ImportResponse | null>(null)

  const error = ref<string | null>(null)
  const uploadErrors = ref<Record<string, string>>({})

  // Computed
  const hasFiles = computed(() => usersFile.value !== null)
  const hasValidationResults = computed(() => validationResults.value !== null)
  const hasErrors = computed(() =>
    validationResults.value ? validationResults.value.errors.length > 0 : false
  )
  const hasWarnings = computed(() =>
    validationResults.value ? validationResults.value.warnings.length > 0 : false
  )

  // Actions
  function setUsersFile(file: File | null) {
    usersFile.value = file
    if (file) {
      delete uploadErrors.value.users
    }
  }

  function setGroupsFile(file: File | null) {
    groupsFile.value = file
    if (file) {
      delete uploadErrors.value.groups
    }
  }

  function setMembershipsFile(file: File | null) {
    membershipsFile.value = file
    if (file) {
      delete uploadErrors.value.memberships
    }
  }

  function setDryRun(value: boolean) {
    dryRun.value = value
  }

  function setUpdateExisting(value: boolean) {
    updateExisting.value = value
  }

  function setTargetGroup(groupId: string) {
    targetGroupId.value = groupId
  }

  async function validateImport(organizationId: string): Promise<boolean> {
    if (!usersFile.value) {
      error.value = t('bulkImport.uploadError')
      return false
    }

    isValidating.value = true
    error.value = null
    step.value = 'validating'

    try {
      const result = await bulkImportService.validateImport(
        organizationId,
        usersFile.value,
        groupsFile.value || undefined,
        membershipsFile.value || undefined,
        targetGroupId.value || undefined
      )

      validationResults.value = result

      if (result.errors.length > 0) {
        step.value = 'error'
        error.value = t('bulkImport.validateError')
        return false
      } else {
        step.value = 'validation-results'
        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    t('bulkImport.validateError')
      step.value = 'error'
      return false
    } finally {
      isValidating.value = false
    }
  }

  async function performImport(organizationId: string): Promise<boolean> {
    if (!usersFile.value) {
      error.value = t('bulkImport.uploadError')
      return false
    }

    isImporting.value = true
    error.value = null
    step.value = 'importing'

    try {
      const result = await bulkImportService.importData(
        organizationId,
        usersFile.value,
        {
          groupsFile: groupsFile.value || undefined,
          membershipsFile: membershipsFile.value || undefined,
          dryRun: false,
          updateExisting: updateExisting.value,
          targetGroup: targetGroupId.value || undefined
        }
      )

      // Safety check: ensure result has expected structure
      if (!result || typeof result !== 'object') {
        error.value = 'Invalid response format from server'
        step.value = 'error'
        return false
      }

      importResults.value = result

      // Check if there are errors (handle undefined/null errors array)
      const hasErrors = result.errors && Array.isArray(result.errors) && result.errors.length > 0

      if (hasErrors) {
        step.value = 'error'
        error.value = t('bulkImport.importError')
        return false
      } else {
        step.value = 'success'
        return true
      }
    } catch (err: any) {

      error.value = err.response?.data?.error_message ||
                    err.response?.data?.message ||
                    t('bulkImport.importError')

      // Create a minimal error result for display
      importResults.value = {
        success: false,
        dry_run: false,
        summary: {
          users_created: 0,
          users_updated: 0,
          users_skipped: 0,
          groups_created: 0,
          groups_updated: 0,
          groups_skipped: 0,
          memberships_created: 0,
          memberships_skipped: 0,
          total_processed: 0,
          processing_time: '0s'
        },
        errors: [{
          row: 0,
          file: 'system',
          message: error.value,
          code: 'NETWORK_ERROR'
        }],
        warnings: []
      }

      step.value = 'error'
      return false
    } finally {
      isImporting.value = false
    }
  }

  function reset() {
    usersFile.value = null
    groupsFile.value = null
    membershipsFile.value = null
    dryRun.value = true
    updateExisting.value = false
    targetGroupId.value = ''
    step.value = 'upload'
    isValidating.value = false
    isImporting.value = false
    validationResults.value = null
    importResults.value = null
    error.value = null
    uploadErrors.value = {}
  }

  function goToStep(newStep: ImportStep) {
    step.value = newStep
  }

  return {
    // State
    usersFile,
    groupsFile,
    membershipsFile,
    dryRun,
    updateExisting,
    targetGroupId,
    step,
    isValidating,
    isImporting,
    validationResults,
    importResults,
    error,
    uploadErrors,

    // Computed
    hasFiles,
    hasValidationResults,
    hasErrors,
    hasWarnings,

    // Actions
    setUsersFile,
    setGroupsFile,
    setMembershipsFile,
    setDryRun,
    setUpdateExisting,
    setTargetGroup,
    validateImport,
    performImport,
    reset,
    goToStep
  }
})
