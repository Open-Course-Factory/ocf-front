/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
import { useI18n } from "vue-i18n"
import { useBaseStore } from "./baseStore";


export const useSchedulesStore = defineStore('schedules', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { schedules : { 
        id : "id",
        pageTitle : 'Schedules list',
        name: 'Schedule Name',
        front_matter_content: 'Content',
        modify: 'Modify the schedule', 
        add: 'Add a schedule',
    }})
    useI18n().mergeLocaleMessage('fr', { schedules : { 
        id : "id",
        pageTitle : 'Liste des emplois du temps',
        name: 'Nom de l\'emploi du temps',
        front_matter_content: 'Contenu',
        modify: 'Modifier l\'emploi du temps', 
        add: 'Ajouter un emploi du temps',
     }})

    const fieldList = new Map<string, any>([
        ["id", { label: t('schedules.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('schedules.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["front_matter_content", { label: t('schedules.front_matter_content'), type: "advanced-textarea", display: true, toBeSet: true, toBeEdited: true }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
    ])


    return {...base, fieldList}
})