/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { useTranslations } from './useTranslations'

/** One fault of a scenario, as ocf-core's CheckScenarioHealth reports it. */
export interface ScenarioHealthFinding {
  code: string
  severity: string
  locale?: string
  detail?: string
}

/**
 * The sentence for a health finding, with the numbers the server filled in.
 *
 * Written here rather than sent by the server so it reads in the reader's
 * language; the server sends a stable code and the parts it alone can know.
 * Shared by the operators' report and the editor's checks, so the two never
 * describe the same fault differently.
 *
 * step_without_verification comes at two severities that mean different
 * things (CheckScenarioHealth): blocking is a step with no way past it, a
 * warning is a terminal step that passes unchecked. Each has its sentence.
 */
export function useScenarioHealthSentence() {
  const { t } = useTranslations({
    en: {
      scenarioHealth: {
        codes: {
          locale_not_offered: 'Declared in {locale}, and the launcher does not offer it — the card shows no language choice and the scenario plays in its own language.',
          lexicon_incomplete: 'The {locale} vocabulary is incomplete, so the setup script cannot build the world: the learner gets an empty container.',
          no_steps: 'The scenario has no steps. Launching it provisions a container with nothing to do in it.',
          step_without_verification: 'Steps a learner cannot get past — a quiz with no questions: {detail}.',
          step_without_verification_warning: "Terminal steps with no verify script: Verify always passes them, so nothing checks the learner's work: {detail}."
        }
      }
    },
    fr: {
      scenarioHealth: {
        codes: {
          locale_not_offered: 'Déclaré en {locale}, et le lanceur ne le propose pas — la carte n\'affiche aucun choix de langue et le scénario se joue dans la sienne.',
          lexicon_incomplete: 'Le vocabulaire {locale} est incomplet : le script d\'installation ne peut pas construire le monde et l\'apprenant reçoit un conteneur vide.',
          no_steps: "Le scénario n'a aucune étape. Le lancer provisionne un conteneur où il n'y a rien à faire.",
          step_without_verification: "Étapes qu'un apprenant ne peut pas franchir — un quiz sans question : {detail}.",
          step_without_verification_warning: "Étapes terminal sans script de vérification : « Vérifier » les valide toujours, rien ne contrôle le travail de l'apprenant : {detail}."
        }
      }
    }
  })

  function sentence(finding: ScenarioHealthFinding): string {
    const key = finding.code === 'step_without_verification' && finding.severity === 'warning'
      ? 'step_without_verification_warning'
      : finding.code
    return t(`scenarioHealth.codes.${key}`, {
      locale: finding.locale || '',
      detail: finding.detail || '',
    })
  }

  return { sentence }
}
