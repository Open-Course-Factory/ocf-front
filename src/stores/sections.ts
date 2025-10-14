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
import { field, buildFieldList } from '../utils/fieldBuilder'


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

    const fieldList = buildFieldList([
        field('id', t('sections.id')).input().hidden().readonly(),
        field('fileName', t('sections.fileName')).input().hidden().readonly(),
        field('title', t('sections.title')).input().visible().creatable().updatable(),
        field('intro', t('sections.intro')).input().visible().creatable().updatable(),
        field('conclusion', t('sections.conclusion')).input().visible().creatable().updatable(),
        field('number', t('sections.number')).input().hidden().readonly(),
        field('courseId', 'Course').type('select').hidden().readonly(),
        field('chapterId', 'Chapter').type('select').hidden().readonly(),
        field('PageId', t('sections.pages')).input().visible().creatable().updatable(),
        field('hiddenPages', t('sections.hiddenPages')).type('advanced-textarea').hidden().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
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