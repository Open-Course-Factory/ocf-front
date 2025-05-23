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
import { useBaseStore } from "./baseStore"
import { useSchedulesStore } from "./schedules";
import { useThemesStore } from "./themes";
import { useCoursesStore } from "./courses";


export const useGenerationsStore = defineStore('generations', () => {

    const base = useBaseStore();

    useI18n().mergeLocaleMessage('en', { generations : { 
        id : "id",
        pageTitle : "Generations",
        name: 'Generation Name',
        courses: 'Course',
        themes: 'Theme',
        schedules: 'Schedule',
        format: 'Format',
        modify: 'Modify the generation', 
        add: 'Add a generation',
    }})
    useI18n().mergeLocaleMessage('fr', { generations : { 
        id : "id",
        pageTitle : "Generations",
        name: 'Nom de la generation',
        courses: 'Cours',
        themes: 'Theme',
        schedules: 'Emploi du temps',
        format: 'Format',
        modify: 'Modifier la generation', 
        add: 'Ajouter une generation',
     }})

    const { t } = useI18n()

    
    const fieldList = new Map<string, any>([
        ["id", { label: t('generations.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('generations.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["format", { label: t('generations.format'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["courses", { label: t('generation.courses'), type: "subentity", display: true, toBeSet: true, toBeEdited: true }],
        ["themes", { label: t('generation.themes'), type: "subentity", display: true, toBeSet: true, toBeEdited: true }],
        ["schedules", { label: t('generation.schedules'), type: "subentity", display: true, toBeSet: true, toBeEdited: true }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["courses", useCoursesStore()],
        ["themes", useThemesStore()],
        ["schedules", useSchedulesStore()],
    ])

    
    return {...base, fieldList}
})