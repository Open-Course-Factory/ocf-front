/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from "pinia"
import { computed } from 'vue'
import { useBaseStore } from "./baseStore"
import { useScenariosStore } from "./scenarios"
import { useScenarioStepsStore } from "./scenarioSteps"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useScenarioStepHintsStore = defineStore('scenario-step-hints', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            scenarioStepHints: {
                pageTitle: 'Scenario Step Hints',
                scenarioId: 'Scenario',
                stepId: 'Step',
                level: 'Level',
                content: 'Content'
            }
        },
        fr: {
            scenarioStepHints: {
                pageTitle: 'Indices des Étapes',
                scenarioId: 'Scénario',
                stepId: 'Étape',
                level: 'Niveau',
                content: 'Contenu'
            }
        }
    })

    base.parentEntitiesStores = new Map<string, any>([
        ["scenario_id", useScenariosStore()],
        ["step_id", useScenarioStepsStore()],
    ])

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('scenario_id', t('scenarioStepHints.scenarioId')).type('select').hidden(),
        field('step_id', t('scenarioStepHints.stepId')).type('multi-select').visible().creatable().required(),
        field('level', t('scenarioStepHints.level')).input().visible().creatable().updatable().required(),
        field('content', t('scenarioStepHints.content')).textarea().visible().creatable().updatable()
    ]))

    return { ...base, fieldList }
})
