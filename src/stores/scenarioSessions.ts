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
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useScenarioSessionsStore = defineStore('scenarioSessions', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            scenarioSessions: {
                pageTitle: 'Scenario Sessions',
                scenarioId: 'Scenario',
                userId: 'User ID',
                terminalSessionId: 'Terminal Session ID',
                currentStep: 'Current Step',
                status: 'Status',
                startedAt: 'Started At',
                completedAt: 'Completed At',
                statusActive: 'Active',
                statusCompleted: 'Completed',
                statusAbandoned: 'Abandoned'
            }
        },
        fr: {
            scenarioSessions: {
                pageTitle: 'Sessions de Scénario',
                scenarioId: 'Scénario',
                userId: 'ID Utilisateur',
                terminalSessionId: 'ID Session Terminal',
                currentStep: 'Étape actuelle',
                status: 'Statut',
                startedAt: 'Démarré le',
                completedAt: 'Terminé le',
                statusActive: 'Active',
                statusCompleted: 'Terminée',
                statusAbandoned: 'Abandonnée'
            }
        }
    })

    base.parentEntitiesStores = new Map([["scenario_id", useScenariosStore()]])

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('scenario_id', t('scenarioSessions.scenarioId')).type('multi-select').visible().readonly(),
        field('user_id', t('scenarioSessions.userId')).input().visible().readonly(),
        field('terminal_session_id', t('scenarioSessions.terminalSessionId')).input().visible().readonly(),
        field('current_step', t('scenarioSessions.currentStep')).input().visible().readonly(),
        field('status', t('scenarioSessions.status')).select().visible().updatable().withOptions([
            { value: 'active', text: t('scenarioSessions.statusActive') },
            { value: 'completed', text: t('scenarioSessions.statusCompleted') },
            { value: 'abandoned', text: t('scenarioSessions.statusAbandoned') }
        ]),
        field('started_at', t('scenarioSessions.startedAt')).input().visible().readonly(),
        field('completed_at', t('scenarioSessions.completedAt')).input().visible().readonly()
    ]))

    return { ...base, fieldList }
})
