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
import { field, buildFieldList } from '../utils/fieldBuilder'


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

    const fieldList = buildFieldList([
        field('id', t('chapters.id')).input().hidden().readonly(),
        field('courseIDs', t('chapters.courses')).type('multi-select').hidden().readonly(),
        field('title', t('chapters.title')).input().visible().editable(),
        field('introduction', t('chapters.introduction')).input().visible().editable(),
        field('footer', t('chapters.footer')).input().visible().editable(),
        field('number', t('chapters.number')).input().hidden().readonly(),
        field('sections', t('chapters.sections')).type('advanced-textarea').visible().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["sections", useSectionsStore()],
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseIDs", useCoursesStore()],
    ])

    return {...base, fieldList}
})