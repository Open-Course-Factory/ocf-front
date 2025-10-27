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
import axios from "axios"
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
        field('courseIDs', t('chapters.courses')).type('multi-select').hidden().readonly(),
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

    /**
     * Fetch a single chapter by ID with nested sections and parent course
     * @param chapterId - The ID of the chapter
     * @returns The chapter or null if not found
     */
    const fetchChapterById = async (chapterId: string): Promise<Chapter | null> => {
        base.isLoading.value = true
        base.error.value = ''

        try {
            // Build include parameter from store configuration
            const includeList = [...base.includeParams.children, ...base.includeParams.parents]
            const includeParam = includeList.length > 0 ? `?include=${includeList.join(',')}` : ''

            // Try with include parameter first
            let response;
            try {
                response = await axios.get(`/chapters/${chapterId}${includeParam}`)
            } catch (includeError: any) {
                // If 404 with include param, try without it (backend might not support it on detail endpoint)
                if (includeError.response?.status === 404 && includeParam) {
                    console.warn('Backend does not support include parameter on detail endpoint, fetching without it')
                    response = await axios.get(`/chapters/${chapterId}`)
                } else {
                    throw includeError
                }
            }

            return response.data
        } catch (err: any) {
            if (err.response?.status === 404) {
                base.error.value = t('chapters.chapterNotFound')
            } else {
                base.error.value = err.response?.data?.error ||
                                  err.response?.data?.message ||
                                  t('chapters.errorLoadingChapter')
            }
            console.error('Error fetching chapter by ID:', err)
            return null
        } finally {
            base.isLoading.value = false
        }
    }

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