/**
 * useScenarioExport
 * ─────────────────
 * Downloads a scenario as a KillerCoda archive or as OCF JSON through
 * GET /scenarios/:id/export. The backend answers only callers that may manage
 * the scenario (CanManageScenario, the same verdict as the scenario's
 * `can_manage`), so callers offer it only when `can_manage` is true.
 */
import { teacherService } from '../services/domain/scenario'
import { downloadBlob, downloadJSON } from '../utils/download'
import { useNotification } from './useNotification'
import { useTranslations } from './useTranslations'

export type ScenarioExportFormat = 'killercoda' | 'json'

export function useScenarioExport() {
  const notification = useNotification()
  const { t } = useTranslations({
    en: { scenarioExport: { error: 'The scenario could not be exported.' } },
    fr: { scenarioExport: { error: 'Le scénario n\'a pas pu être exporté.' } }
  })

  async function exportScenario(
    scenario: { id: string; name?: string; title?: string },
    format: ScenarioExportFormat
  ): Promise<void> {
    const baseName = scenario.name || scenario.title || scenario.id
    try {
      if (format === 'json') {
        downloadJSON(await teacherService.exportScenarioJSON(scenario.id), `${baseName}.json`)
      } else {
        // The backend sends application/zip whatever the archive was imported from.
        downloadBlob(await teacherService.exportScenarioArchive(scenario.id), `${baseName}.zip`)
      }
    } catch (err: any) {
      notification.showError(err.response?.data?.error_message || t('scenarioExport.error'))
    }
  }

  return { exportScenario }
}
