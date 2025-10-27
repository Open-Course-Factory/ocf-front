<!-- 
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
-->

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useCoursesStore } from '../../stores/courses'
import { useTranslations } from '../../composables/useTranslations'
import VersionSelector from '../Course/VersionSelector.vue'
import HierarchicalContent from '../Course/HierarchicalContent.vue'
import EntityModal from '../Modals/EntityModal.vue'
import type { Course } from '../../types/entities'

const route = useRoute()
const router = useRouter()
const courseStore = useCoursesStore()

const { t } = useTranslations({
    en: {
        courseDetails: {
            courseNotFound: 'Course not found.',
            loading: 'Loading course...',
            author: 'Course author',
            version: 'Version',
            title: 'Title',
            subtitle: 'Subtitle',
            description: 'Description',
            learningObjectives: 'Learning objectives',
            chapters: 'Chapters',
            noSectionsInChapter: 'No sections in this chapter',
            noPagesInSection: 'No pages in this section',
            edit: 'Edit',
            updateSuccess: 'Course updated successfully'
        }
    },
    fr: {
        courseDetails: {
            courseNotFound: 'Le cours n\'a pas été trouvé.',
            loading: 'Chargement du cours...',
            author: 'Auteur de ce cours',
            version: 'Version',
            title: 'Titre',
            subtitle: 'Sous-titre',
            description: 'Description',
            learningObjectives: 'Objectifs pédagogiques',
            chapters: 'Chapitres',
            noSectionsInChapter: 'Aucune section dans ce chapitre',
            noPagesInSection: 'Aucune page dans cette section',
            edit: 'Modifier',
            updateSuccess: 'Cours mis à jour avec succès'
        }
    }
})

const currentCourse = ref<Course | null>(null)
const selectedVersion = ref<string>('')
const isLoadingCourse = ref(false)
const showEditModal = ref(false)

// Open edit modal
function openEditModal() {
    showEditModal.value = true
}

// Handle course update
async function updateCourse(updatedCourse: Record<string, any>) {
    if (!currentCourse.value?.id) return

    const success = await courseStore.update(currentCourse.value.id, updatedCourse)

    if (success) {
        // Refresh the course data
        const courseData = await courseStore.fetchCourseById(currentCourse.value.id)
        if (courseData) {
            currentCourse.value = courseData
        }
        showEditModal.value = false
    }
}

onMounted(async () => {
    // Always fetch full course data from backend to ensure we have chapters/sections/pages
    // The store's entity list doesn't include nested data, only basic course info
    isLoadingCourse.value = true
    const courseId = route.params.id as string
    const courseData = await courseStore.fetchCourseById(courseId)

    if (courseData) {
        currentCourse.value = courseData
        selectedVersion.value = courseData.version

        // Load all versions for this course
        if (courseData.name) {
            await courseStore.fetchCourseVersions(courseData.name)
        }
    }

    isLoadingCourse.value = false
})

async function handleVersionChange(version: string) {
    if (!currentCourse.value?.name) return

    isLoadingCourse.value = true
    const courseData = await courseStore.fetchCourseByVersion(currentCourse.value.name, version)

    if (courseData) {
        currentCourse.value = courseData
        selectedVersion.value = version

        // Update URL to reflect the new course ID (optional)
        // This allows users to bookmark specific versions
        if (courseData.id !== route.params.id) {
            router.replace({ name: 'CourseDetails', params: { id: courseData.id } })
        }
    }

    isLoadingCourse.value = false
}

async function handleDeleteVersion(courseId: string) {
    if (!currentCourse.value?.name) return

    const success = await courseStore.deleteCourseVersion(courseId)

    if (success) {
        // Reload versions after deletion
        const versions = await courseStore.fetchCourseVersions(currentCourse.value.name)

        if (versions.length > 0) {
            // If current version was deleted, switch to the latest version
            if (courseId === currentCourse.value.id) {
                await handleVersionChange(versions[0].version)
            }
        } else {
            // If all versions deleted, go back to courses list
            router.push({ name: 'Courses' })
        }
    }
}

// Computed property to check if current user can delete the course
const canDeleteCourse = computed(() => {
    // TODO: Add proper permission check based on user ownership
    // For now, allow deletion if we have a current course
    return !!currentCourse.value
})
</script>

<template>
    <div class="wrapper">
        <div class="page-content" v-if="currentCourse">
            <div class="page-header">
                <div class="header-main">
                    <h2>{{ currentCourse.name }}</h2>
                    <p class="course-author">{{ t('courseDetails.author') }}: {{ currentCourse.author_email }}</p>
                </div>

                <div class="header-actions">
                    <button class="btn btn-primary" @click="openEditModal">
                        <i class="fas fa-edit"></i>
                        {{ t('courseDetails.edit') }}
                    </button>
                </div>
            </div>

            <div class="version-section" v-if="courseStore.courseVersions.length > 0">
                <VersionSelector
                    :versions="courseStore.courseVersions"
                    :selected-version="selectedVersion"
                    :is-loading="courseStore.isLoadingVersions || isLoadingCourse"
                    :error="courseStore.versionError"
                    :can-delete="canDeleteCourse"
                    @version-changed="handleVersionChange"
                    @delete-version="handleDeleteVersion"
                />
            </div>

            <div class="course-info">
                <div v-if="currentCourse.title" class="info-section">
                    <h3>{{ t('courseDetails.title') }}</h3>
                    <p>{{ currentCourse.title }}</p>
                </div>

                <div v-if="currentCourse.subtitle" class="info-section">
                    <h3>{{ t('courseDetails.subtitle') }}</h3>
                    <p>{{ currentCourse.subtitle }}</p>
                </div>

                <div v-if="currentCourse.description" class="info-section">
                    <h3>{{ t('courseDetails.description') }}</h3>
                    <p>{{ currentCourse.description }}</p>
                </div>

                <div v-if="currentCourse.learning_objectives" class="info-section">
                    <h3>{{ t('courseDetails.learningObjectives') }}</h3>
                    <p>{{ currentCourse.learning_objectives }}</p>
                </div>

                <div v-if="currentCourse.chapters && currentCourse.chapters.length > 0" class="info-section">
                    <h3>{{ t('courseDetails.chapters') }}</h3>
                    <HierarchicalContent
                        :chapters="currentCourse.chapters"
                        :no-sections-message="t('courseDetails.noSectionsInChapter')"
                        :no-pages-message="t('courseDetails.noPagesInSection')"
                    />
                </div>
            </div>
        </div>
        <div v-else-if="isLoadingCourse" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>{{ t('courseDetails.loading') }}</p>
        </div>
        <div v-else class="not-found">
            <p>{{ t('courseDetails.courseNotFound') }}</p>
        </div>

        <EntityModal
            :visible="showEditModal"
            :entity="currentCourse"
            :entity-store="courseStore"
            entity-name="courses"
            :fieldList="courseStore.fieldList"
            @modify="updateCourse"
            @close="showEditModal = false"
        />
    </div>
</template>

<style scoped>
.wrapper {
    padding: var(--spacing-lg);
}

.page-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-lg);
    border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.version-section {
    margin-bottom: var(--spacing-lg);
}

.header-main {
    flex: 1;
}

.header-main h2 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-2xl);
}

.course-author {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.course-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.info-section h3 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: 600;
}

.info-section p {
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.6;
}

.loading-state,
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--color-text-muted);
}

.loading-state i {
    font-size: 2rem;
    margin-bottom: var(--spacing-md);
    color: var(--color-primary);
}

@media (max-width: 768px) {
    .wrapper {
        padding: var(--spacing-md);
    }

    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .header-main h2 {
        font-size: var(--font-size-xl);
    }
}
</style>
