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
import { usePagesStore } from "./pages"
import { useBaseStore } from "./baseStore"
import { useCoursesStore } from "./courses"
import { useChaptersStore } from "./chapters"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import type { Section } from '../types/entities'


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
                errorLoadingSection: 'Error loading section',
                sectionNotFound: 'Section not found',
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
                errorLoadingSection: 'Erreur lors du chargement de la section',
                sectionNotFound: 'Section introuvable',
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
        field('pages', t('sections.pages')).type('subentity').visible().readonly(),
        field('hiddenPages', t('sections.hiddenPages')).type('advanced-textarea').hidden().readonly(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["pages", usePagesStore()],
    ])

    base.parentEntitiesStores = new Map<string, any>([
        ["courseId", useCoursesStore()],
        ["chapterId", useChaptersStore()],
    ])

    // Configure include parameters for API calls
    base.includeParams.children = ['pages']
    base.includeParams.parents = ['chapters.courses'] // Multi-level: chapter with its parent course

    /**
     * Fetch a single section by ID with nested pages and parent chapter
     * @param sectionId - The ID of the section
     * @returns The section or null if not found
     */
    const fetchSectionById = async (sectionId: string): Promise<Section | null> => {
        base.isLoading.value = true
        base.error.value = ''

        try {
            // Build include parameter from store configuration
            const includeList = [...base.includeParams.children, ...base.includeParams.parents]
            const includeParam = includeList.length > 0 ? `?include=${includeList.join(',')}` : ''

            // Try with include parameter first
            let response;
            try {
                response = await axios.get(`/sections/${sectionId}${includeParam}`)
            } catch (includeError: any) {
                // If 404 with include param, try without it (backend might not support it on detail endpoint)
                if (includeError.response?.status === 404 && includeParam) {
                    console.warn('Backend does not support include parameter on detail endpoint, fetching without it')
                    response = await axios.get(`/sections/${sectionId}`)
                } else {
                    throw includeError
                }
            }

            return response.data
        } catch (err: any) {
            if (err.response?.status === 404) {
                base.error.value = t('sections.sectionNotFound')
            } else {
                base.error.value = err.response?.data?.error ||
                                  err.response?.data?.message ||
                                  t('sections.errorLoadingSection')
            }
            console.error('Error fetching section by ID:', err)
            return null
        } finally {
            base.isLoading.value = false
        }
    }

    /**
     * Update a section
     */
    const update = async (sectionId: string, sectionData: Partial<any>) => {
        return await base.updateEntity('/sections', sectionId, sectionData)
    }

    /**
     * Delete a section
     */
    const deleteSection = async (sectionId: string) => {
        return await base.deleteEntity('/sections', sectionId)
    }

    return {...base, fieldList, fetchSectionById, update, delete: deleteSection}
})