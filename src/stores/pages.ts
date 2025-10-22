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
import { useCoursesStore } from "./courses"
import { useChaptersStore } from "./chapters"
import { useSectionsStore } from "./sections"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'


export const usePagesStore = defineStore('pages', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            pages: {
                id: "id",
                pageTitle: 'Pages',
                name: 'Page Name',
                number: 'Page number',
                parent_section_title: 'Parent section title',
                toc: 'Table of Content',
                content: 'Content',
                hide: 'Hide page',
                modify: 'Modify the page',
                add: 'Add a page',
            }
        },
        fr: {
            pages: {
                id: "id",
                pageTitle: 'Pages',
                name: 'Nom de la page',
                number: 'Numéro de la page',
                parent_section_title: 'Titre de la section parente',
                toc: 'Table des contenus',
                content: 'Contenu',
                hide: 'Cacher la page',
                modify: 'Modifier la page',
                add: 'Ajouter une page',
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('pages.id')).input().hidden().readonly(),
        field('number', t('pages.number')).input().hidden().readonly(),
        field('parentSectionTitle', t('pages.parent_section_title')).input().hidden().readonly(),
        field('courseId', 'Course').type('select').hidden().readonly(),
        field('chapterId', 'Chapter').type('select').hidden().readonly(),
        field('sectionId', 'Section').type('select').hidden().readonly(),
        field('toc', t('pages.toc')).input().hidden().readonly(),
        field('content', t('pages.content')).type('advanced-textarea').visible().creatable().updatable(),
        field('hide', t('pages.hide')).input().hidden().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseId", useCoursesStore()],
        ["chapterId", useChaptersStore()],
        ["sectionId", useSectionsStore()],
    ])

    // Configure include parameters for API calls
    base.includeParams.children = [] // Pages have no child entities
    base.includeParams.parents = ['sections']

    return {...base, fieldList}
})