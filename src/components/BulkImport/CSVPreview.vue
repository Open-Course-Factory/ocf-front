<template>
  <BaseModal
    :visible="visible"
    :title="title"
    @close="$emit('close')"
    size="large"
  >
    <div class="csv-preview">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('csvPreview.loading') }}</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
      </div>

      <div v-else-if="previewData" class="preview-content">
        <div class="preview-info">
          <p>{{ t('csvPreview.showingRows', { count: previewData.rows.length, total: totalRows }) }}</p>
        </div>

        <div class="table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="(header, index) in previewData.headers" :key="index">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in previewData.rows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="preview-summary">
          <p>{{ t('csvPreview.totalRows', { count: totalRows }) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">
        {{ t('csvPreview.close') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '../Modals/BaseModal.vue'
import { useTranslations } from '../../composables/useTranslations'

const translations = {
  en: {
    csvPreview: {
      loading: 'Loading preview...',
      showingRows: 'Showing first {count} of {total} rows',
      totalRows: 'Total: {count} rows',
      close: 'Close',
      parseError: 'Failed to parse CSV file'
    }
  },
  fr: {
    csvPreview: {
      loading: 'Chargement de l\'aperçu...',
      showingRows: 'Affichage des {count} premières lignes sur {total}',
      totalRows: 'Total : {count} lignes',
      close: 'Fermer',
      parseError: 'Échec de l\'analyse du fichier CSV'
    }
  }
}

const { t } = useTranslations(translations)

interface Props {
  visible: boolean
  file: File | null
  title: string
}

const props = defineProps<Props>()

defineEmits<{
  'close': []
}>()

interface PreviewData {
  headers: string[]
  rows: string[][]
}

const loading = ref(false)
const error = ref<string | null>(null)
const previewData = ref<PreviewData | null>(null)
const totalRows = ref(0)

const MAX_PREVIEW_ROWS = 10

async function parseCSV(file: File) {
  loading.value = true
  error.value = null
  previewData.value = null

  try {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      throw new Error('Empty CSV file')
    }

    // Parse CSV (simple implementation - doesn't handle quoted commas)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }

      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const dataLines = lines.slice(1, Math.min(lines.length, MAX_PREVIEW_ROWS + 1))
    const rows = dataLines.map(line => parseCSVLine(line))

    totalRows.value = lines.length - 1 // Exclude header
    previewData.value = {
      headers,
      rows
    }
  } catch (err) {
    console.error('Failed to parse CSV:', err)
    error.value = t('csvPreview.parseError')
  } finally {
    loading.value = false
  }
}

watch(() => [props.visible, props.file] as const, ([visible, file]) => {
  if (visible && file) {
    parseCSV(file)
  }
}, { immediate: true })
</script>

<style scoped>
.csv-preview {
  min-height: 300px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border-medium);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--color-danger);
  text-align: center;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.preview-info,
.preview-summary {
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.preview-table thead {
  background: var(--color-bg-tertiary);
  position: sticky;
  top: 0;
}

.preview-table th {
  padding: var(--spacing-sm);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border-medium);
  white-space: nowrap;
}

.preview-table td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-medium);
  color: var(--color-text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-table tbody tr:hover {
  background: var(--color-bg-secondary);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: opacity 0.2s ease;
}

.btn:hover {
  opacity: 0.8;
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-white);
}
</style>
