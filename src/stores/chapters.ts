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
import { useBaseStore } from "./baseStore"
import { useSectionsStore } from "./sections"
import { useCoursesStore } from "./courses"
import { useStoreTranslations } from '../composables/useTranslations'


export const useChaptersStore = defineStore('chapters', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            chapters: {
                id: "id",
                pageTitle: 'Chapters',
                courses: 'Course',
                title: 'Chapter Title',
                number: 'Number',
                introduction: 'Introduction',
                footer: 'Footer',
                sections: 'Sections',
                modify: 'Modify the chapter',
                add: 'Add a chapter',
            }
        },
        fr: {
            chapters: {
                id: "id",
                pageTitle: 'Chapitres',
                courses: 'Cours',
                title: 'Titre du chapitre',
                number: 'Numero',
                introduction: 'Introduction',
                footer: 'Pied de page',
                sections: 'Sections',
                modify: 'Modifier le chapitre',
                add: 'Ajouter un chapitre',
            }
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: t('chapters.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["courseIDs", { label: t('chapters.courses'), type: "multi-select", display: false, toBeSet: false, toBeEdited: false }],
        ["title", { label: t('chapters.title'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["introduction", { label: t('chapters.introduction'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["footer", { label: t('chapters.footer'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["number", { label: t('chapters.number'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["sections", { label: t('chapters.sections'), type: "advanced-textarea", display: true, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["sections", useSectionsStore()],
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseIDs", useCoursesStore()],
    ])

    return {...base, fieldList}
})