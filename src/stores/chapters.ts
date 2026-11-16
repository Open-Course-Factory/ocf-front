/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import type { Chapter } from '../types/entities'


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
                errorLoadingChapter: 'Error loading chapter',
                chapterNotFound: 'Chapter not found',
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
                errorLoadingChapter: 'Erreur lors du chargement du chapitre',
                chapterNotFound: 'Chapitre introuvable',
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('chapters.id')).input().hidden().readonly(),
        field('courseIDs', t('chapters.courses')).type('multi-select').hidden().creatable(),
        field('title', t('chapters.title')).input().visible().editable(),
        field('introduction', t('chapters.introduction')).input().visible().editable(),
        field('footer', t('chapters.footer')).input().visible().editable(),
        field('number', t('chapters.number')).input().hidden().readonly(),
        field('sections', t('chapters.sections')).type('subentity').visible().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["sections", useSectionsStore()],
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseIDs", useCoursesStore()],
    ])

    // Configure include parameters for API calls
    // Using dot notation for multi-level nesting
    base.includeParams.children = ['sections.pages']
    base.includeParams.parents = ['courses']

    // Configure detail view route
    base.detailRouteName.value = 'ChapterDetails'

    /**
     * Fetch a single chapter by ID with nested sections and parent course
     * @param chapterId - The ID of the chapter
     * @returns The chapter or null if not found
     */
    const fetchChapterById = (chapterId: string) =>
        base.fetchOneWithInclude<Chapter>('/chapters', chapterId, t('chapters.chapterNotFound'), t('chapters.errorLoadingChapter'))

    /**
     * Update a chapter
     */
    const update = async (chapterId: string, chapterData: Partial<Chapter>) => {
        return await base.updateEntity('/chapters', chapterId, chapterData)
    }

    /**
     * Delete a chapter
     */
    const deleteChapter = async (chapterId: string) => {
        return await base.deleteEntity('/chapters', chapterId)
    }

    return {...base, fieldList, fetchChapterById, update, delete: deleteChapter}
})