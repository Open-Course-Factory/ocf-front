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
import { ref } from "vue"
import axios from "axios"
import { useBaseStore } from "./baseStore"
import { useChaptersStore } from "./chapters"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import type { Course } from '../types/entities'

export const useCoursesStore = defineStore('courses', () => {

    const base = useBaseStore();

    const { t } = useStoreTranslations({
        en: {
            courses: {
                pageTitle: 'Courses',
                name: 'Name',
                format: 'Format',
                authorEmail: 'Author email',
                category: 'Category',
                version: 'Version',
                title: 'Title',
                subTitle: 'Subtitle',
                header: 'Header',
                footer: 'Footer',
                logo: 'Logo file',
                description: 'Description',
                prelude: 'Prelude',
                learningObjectives: 'Learning objectives',
                chapters: 'Chapters',
                add: 'Add a course',
                generate: 'Generate',
                versionSelector: 'Version',
                allVersions: 'All versions',
                latestVersion: 'Latest',
                selectVersion: 'Select a version',
                deleteVersion: 'Delete this version',
                confirmDeleteVersion: 'Are you sure you want to delete version {version}?',
                versionDeleted: 'Version deleted successfully',
                errorLoadingVersions: 'Error loading course versions',
                errorLoadingVersion: 'Error loading course version',
                errorDeletingVersion: 'Error deleting course version',
                versionNotFound: 'Course version not found',
            }
        },
        fr: {
            courses: {
                pageTitle: 'Cours',
                name: 'Nom',
                format: 'Format',
                authorEmail: 'Email de l\'auteur',
                category: 'Categorie',
                version: 'Version',
                title: 'Titre',
                subTitle: 'Sous-titre',
                header: 'En-tête',
                footer: 'Pied de page',
                logo: 'Fichier du logo',
                description: 'Description',
                prelude: 'Préambule',
                learningObjectives: 'Objectifs pédagogiques',
                chapters: 'Chapitres',
                add: 'Ajouter un cours',
                generate: 'Générer',
                versionSelector: 'Version',
                allVersions: 'Toutes les versions',
                latestVersion: 'Dernière',
                selectVersion: 'Sélectionner une version',
                deleteVersion: 'Supprimer cette version',
                confirmDeleteVersion: 'Êtes-vous sûr de vouloir supprimer la version {version} ?',
                versionDeleted: 'Version supprimée avec succès',
                errorLoadingVersions: 'Erreur lors du chargement des versions du cours',
                errorLoadingVersion: 'Erreur lors du chargement de la version du cours',
                errorDeletingVersion: 'Erreur lors de la suppression de la version du cours',
                versionNotFound: 'Version du cours introuvable',
            }
        }
    })

    const fieldList = buildFieldList([
        field('name', t('courses.name')).input().visible().creatable().updatable(),
        field('format', t('courses.format')).input().visible().readonly(),
        field('authorEmail', t('courses.authorEmail')).input().visible().creatable().updatable(),
        field('category', t('courses.category')).input().visible().creatable().updatable(),
        field('version', t('courses.version')).input().visible().creatable().updatable(),
        field('title', t('courses.title')).input().visible().creatable().updatable(),
        field('subTitle', t('courses.subTitle')).input().visible().creatable().updatable(),
        field('header', t('courses.header')).input().visible().creatable().updatable(),
        field('footer', t('courses.footer')).input().visible().creatable().updatable(),
        field('logo', t('courses.logo')).input().visible().creatable().updatable(),
        field('description', t('courses.description')).input().visible().creatable().updatable(),
        field('prelude', t('courses.prelude')).input().visible().creatable().updatable(),
        field('learningObjectives', t('courses.learningObjectives')).input().visible().creatable().updatable(),
        field('chapters', t('courses.chapters')).type('subentity').visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["chapters", useChaptersStore()],
    ])

    // Configure include parameters for API calls
    // Using dot notation for multi-level nesting: chapters.sections.pages
    base.includeParams.children = ['chapters.sections.pages']
    base.includeParams.parents = [] // Courses have no parent entities

    // Version management state
    const courseVersions = ref<Course[]>([])
    const isLoadingVersions = ref(false)
    const versionError = ref('')

    /**
     * Fetch all versions of a course by name
     * @param courseName - The name of the course
     * @returns Array of course versions
     */
    const fetchCourseVersions = async (courseName: string): Promise<Course[]> => {
        isLoadingVersions.value = true
        versionError.value = ''

        try {
            const response = await axios.get('/courses/versions', {
                params: { name: courseName }
            })
            courseVersions.value = response.data || []
            return courseVersions.value
        } catch (err: any) {
            versionError.value = err.response?.data?.error ||
                               err.response?.data?.message ||
                               t('courses.errorLoadingVersions')
            console.error('Error fetching course versions:', err)
            return []
        } finally {
            isLoadingVersions.value = false
        }
    }

    /**
     * Fetch a specific version of a course
     * @param courseName - The name of the course
     * @param version - The version to fetch
     * @returns The course version or null if not found
     */
    const fetchCourseByVersion = async (courseName: string, version: string): Promise<Course | null> => {
        base.isLoading.value = true
        base.error.value = ''

        try {
            const response = await axios.get('/courses/by-version', {
                params: {
                    name: courseName,
                    version: version
                }
            })
            return response.data
        } catch (err: any) {
            if (err.response?.status === 404) {
                base.error.value = t('courses.versionNotFound')
            } else {
                base.error.value = err.response?.data?.error ||
                                  err.response?.data?.message ||
                                  t('courses.errorLoadingVersion')
            }
            console.error('Error fetching course by version:', err)
            return null
        } finally {
            base.isLoading.value = false
        }
    }

    /**
     * Fetch a single course by ID with nested chapters
     * @param courseId - The ID of the course
     * @returns The course or null if not found
     */
    const fetchCourseById = async (courseId: string): Promise<Course | null> => {
        base.isLoading.value = true
        base.error.value = ''

        try {
            // Build include parameter from store configuration
            const includeList = [...base.includeParams.children, ...base.includeParams.parents]
            const includeParam = includeList.length > 0 ? `?include=${includeList.join(',')}` : ''

            console.log(`[CourseStore] Fetching course with include parameter: /courses/${courseId}${includeParam}`)

            // Try with include parameter first
            let response;
            try {
                response = await axios.get(`/courses/${courseId}${includeParam}`)
            } catch (includeError: any) {
                // Only retry without include if we get a 404 AND the entity actually exists
                // This handles backends that don't support include on detail endpoints
                if (includeError.response?.status === 404 && includeParam) {
                    console.warn(`Retrying /courses/${courseId} without include parameter`)
                    try {
                        response = await axios.get(`/courses/${courseId}`)
                    } catch (retryError: any) {
                        // If still 404, the entity really doesn't exist
                        throw retryError
                    }
                } else {
                    throw includeError
                }
            }

            return response.data
        } catch (err: any) {
            if (err.response?.status === 404) {
                base.error.value = t('courses.versionNotFound')
            } else {
                base.error.value = err.response?.data?.error ||
                                  err.response?.data?.message ||
                                  t('courses.errorLoadingVersion')
            }
            console.error('Error fetching course by ID:', err)
            return null
        } finally {
            base.isLoading.value = false
        }
    }

    /**
     * Delete a specific course version
     * @param courseId - The ID of the course version to delete
     * @returns boolean indicating success
     */
    const deleteCourseVersion = async (courseId: string): Promise<boolean> => {
        base.isLoading.value = true
        base.error.value = ''

        try {
            await axios.delete(`/courses/${courseId}`)
            return true
        } catch (err: any) {
            base.error.value = err.response?.data?.error ||
                              err.response?.data?.message ||
                              t('courses.errorDeletingVersion')
            console.error('Error deleting course version:', err)
            return false
        } finally {
            base.isLoading.value = false
        }
    }

    /**
     * Update a course
     */
    const update = async (courseId: string, courseData: Partial<any>) => {
        return await base.updateEntity('/courses', courseId, courseData)
    }

    /**
     * Delete a course (alias for deleteEntity for consistency with CourseEditor)
     */
    const deleteCourse = async (courseId: string) => {
        return await base.deleteEntity('/courses', courseId)
    }

    return {
        ...base,
        fieldList,
        courseVersions,
        isLoadingVersions,
        versionError,
        fetchCourseVersions,
        fetchCourseByVersion,
        fetchCourseById,
        deleteCourseVersion,
        update,
        delete: deleteCourse
    }
})
