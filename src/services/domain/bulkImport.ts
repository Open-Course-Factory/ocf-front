import axios from 'axios'

export interface ImportError {
  row: number
  file: string
  field?: string
  message: string
  code: string
}

export interface ImportWarning {
  row: number
  file: string
  message: string
}

export interface ImportSummary {
  users_created: number
  users_updated: number
  users_skipped: number
  groups_created: number
  groups_updated: number
  groups_skipped: number
  memberships_created: number
  memberships_skipped: number
  total_processed: number
  processing_time: string
}

export interface ImportResponse {
  success: boolean
  dry_run: boolean
  summary: ImportSummary
  errors: ImportError[]
  warnings: ImportWarning[]
}

export const bulkImportService = {
  /**
   * Perform bulk import or validation
   */
  async importData(
    organizationId: string,
    usersFile: File,
    options: {
      groupsFile?: File
      membershipsFile?: File
      dryRun?: boolean
      updateExisting?: boolean
    } = {}
  ): Promise<ImportResponse> {
    const formData = new FormData()
    formData.append('users', usersFile)

    if (options.groupsFile) {
      formData.append('groups', options.groupsFile)
    }

    if (options.membershipsFile) {
      formData.append('memberships', options.membershipsFile)
    }

    formData.append('dry_run', String(options.dryRun ?? false))
    formData.append('update_existing', String(options.updateExisting ?? false))

    const response = await axios.post<ImportResponse>(
      `/organizations/${organizationId}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    // Normalize response: ensure errors/warnings arrays always exist
    const normalizedData: ImportResponse = {
      ...response.data,
      errors: response.data.errors || [],
      warnings: response.data.warnings || []
    }

    return normalizedData
  },

  /**
   * Validate import without actually importing
   */
  async validateImport(
    organizationId: string,
    usersFile: File,
    groupsFile?: File,
    membershipsFile?: File
  ): Promise<ImportResponse> {
    return this.importData(organizationId, usersFile, {
      groupsFile,
      membershipsFile,
      dryRun: true,
      updateExisting: false
    })
  }
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'Field validation failed',
  DUPLICATE: 'Duplicate entry found',
  LIMIT_EXCEEDED: 'Organization limit exceeded',
  NOT_FOUND: 'Referenced entity not found',
  INVALID_ROLE: 'Invalid role specified',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_DATE: 'Invalid date format',
  CIRCULAR_REFERENCE: 'Circular parent-child reference',
  ORPHANED_GROUP: 'Group references non-existent parent'
} as const
