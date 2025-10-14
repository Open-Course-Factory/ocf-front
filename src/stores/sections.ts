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
import { usePagesStore } from "./pages"
import { useBaseStore } from "./baseStore"
import { useCoursesStore } from "./courses"
import { useChaptersStore } from "./chapters"
import { useStoreTranslations } from '../composables/useTranslations'


export const useSectionsStore = defineStore('sections', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            sections: {
                id: "id",
                pageTitle: 'Sections',
                fileName: 'File name',
                title: 'Section title',
                number: 'Number',
                intro: 'Introduction',
                conclusion: 'Conclusion',
                pages: 'Pages',
                hiddenPages: 'Hidden pages',
                modify: 'Modify the section',
                add: 'Add a section',
            }
        },
        fr: {
            sections: {
                id: "id",
                pageTitle: 'Sections',
                fileName: 'Nom du fichier',
                title: 'Titre de la section',
                number: 'Numero',
                intro: 'Introduction',
                conclusion: 'Conclusion',
                pages: 'Pages',
                hiddenPages: 'Pages cachées',
                modify: 'Modifier la section',
                add: 'Ajouter une section',
            }
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: t('sections.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["fileName", { label: t('sections.fileName'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["title", { label: t('sections.title'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["intro", { label: t('sections.intro'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["conclusion", { label: t('sections.conclusion'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["number", { label: t('sections.number'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["courseId", { label: "Course", type: "select", display: false, toBeSet: false, toBeEdited: false }],
        ["chapterId", { label: "Chapter", type: "select", display: false, toBeSet: false, toBeEdited: false }],
        ["PageId", { label: t('sections.pages'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["hiddenPages", { label: t('sections.hiddenPages'), type: "advanced-textarea", display: false, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["PageId", usePagesStore()],
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseId", useCoursesStore()],
        ["chapterId", useChaptersStore()],
    ])

    return {...base, fieldList}
})