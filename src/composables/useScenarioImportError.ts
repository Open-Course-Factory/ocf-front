/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { useTranslations } from './useTranslations'
import { scenarioImportError } from '../utils/scenarioImportProblems'

/**
 * scenarioImportError with its too-large sentence in the reader's language,
 * shared by every scenario import (file upload, JSON, AI answer). Call it in
 * setup; the returned function reads the error.
 */
export function useScenarioImportError() {
  const { t } = useTranslations({
    en: { scenarioImportError: { tooLarge: 'The scenario is too large for the server to accept.' } },
    fr: { scenarioImportError: { tooLarge: 'Le scénario est trop volumineux pour que le serveur l’accepte.' } }
  })
  return (err: unknown, fallback: string) =>
    scenarioImportError(err, { tooLarge: t('scenarioImportError.tooLarge'), fallback })
}
