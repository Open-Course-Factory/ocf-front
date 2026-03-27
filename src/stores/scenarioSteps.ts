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
import { useScenarioStepHintsStore } from "./scenarioStepHints"
import { useProjectFilesStore } from "./projectFiles"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useScenarioStepsStore = defineStore('scenario-steps', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            scenarioSteps: {
                pageTitle: 'Scenario Steps',
                scenarioId: 'Scenario',
                order: 'Order',
                title: 'Title',
                textContent: 'Text Content',
                hintContent: 'Hint Content',
                verifyScript: 'Verify Script',
                backgroundScript: 'Background Script',
                foregroundScript: 'Foreground Script',
                verifyScriptId: 'Verify Script File',
                backgroundScriptId: 'Background Script File',
                foregroundScriptId: 'Foreground Script File',
                textFileId: 'Text File',
                hintFileId: 'Hint File',
                hasFlag: 'Has Flag',
                flagPath: 'Flag Path',
                flagLevel: 'Flag Level'
            }
        },
        fr: {
            scenarioSteps: {
                pageTitle: 'Étapes de Scénario',
                scenarioId: 'Scénario',
                order: 'Ordre',
                title: 'Titre',
                textContent: 'Contenu texte',
                hintContent: 'Contenu de l\'indice',
                verifyScript: 'Script de vérification',
                backgroundScript: 'Script d\'arrière-plan',
                foregroundScript: 'Script de premier plan',
                verifyScriptId: 'Fichier script de vérification',
                backgroundScriptId: 'Fichier script d\'arrière-plan',
                foregroundScriptId: 'Fichier script de premier plan',
                textFileId: 'Fichier texte',
                hintFileId: 'Fichier d\'indice',
                hasFlag: 'A un drapeau',
                flagPath: 'Chemin du drapeau',
                flagLevel: 'Niveau du drapeau'
            }
        }
    })

    const projectFilesStore = useProjectFilesStore()
    base.parentEntitiesStores = new Map<string, any>([
        ["scenario_id", useScenariosStore()],
        ["verify_script_id", projectFilesStore],
        ["background_script_id", projectFilesStore],
        ["foreground_script_id", projectFilesStore],
        ["text_file_id", projectFilesStore],
        ["hint_file_id", projectFilesStore],
    ])
    base.subEntitiesStores = new Map<string, any>([
        ["scenarioStepHints", useScenarioStepHintsStore()],
    ])

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('scenario_id', t('scenarioSteps.scenarioId')).type('multi-select').visible().creatable().required(),
        field('order', t('scenarioSteps.order')).input().visible().creatable().updatable().required(),
        field('title', t('scenarioSteps.title')).input().visible().creatable().updatable().required(),
        field('text_file_id', t('scenarioSteps.textFileId')).type('multi-select').visible().creatable().updatable(),
        field('hint_file_id', t('scenarioSteps.hintFileId')).type('multi-select').visible().creatable().updatable(),
        field('verify_script_id', t('scenarioSteps.verifyScriptId')).type('multi-select').visible().creatable().updatable(),
        field('background_script_id', t('scenarioSteps.backgroundScriptId')).type('multi-select').visible().creatable().updatable(),
        field('foreground_script_id', t('scenarioSteps.foregroundScriptId')).type('multi-select').visible().creatable().updatable(),
        field('text_content', t('scenarioSteps.textContent')).textarea().hidden(),
        field('hint_content', t('scenarioSteps.hintContent')).textarea().hidden(),
        field('verify_script', t('scenarioSteps.verifyScript')).textarea().hidden(),
        field('background_script', t('scenarioSteps.backgroundScript')).textarea().hidden(),
        field('foreground_script', t('scenarioSteps.foregroundScript')).textarea().hidden(),
        field('has_flag', t('scenarioSteps.hasFlag')).checkbox().visible().creatable().updatable(),
        field('flag_path', t('scenarioSteps.flagPath')).input().visible().creatable().updatable(),
        field('flag_level', t('scenarioSteps.flagLevel')).input().visible().creatable().updatable()
    ]))

    return { ...base, fieldList }
})
