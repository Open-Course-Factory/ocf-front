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
import type { Course, Chapter, Section } from '../../types/entities'

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
            noPagesInSection: 'No pages in this section'
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
            noPagesInSection: 'Aucune page dans cette section'
        }
    }
})

const currentCourse = ref<Course | null>(null)
const selectedVersion = ref<string>('')
const isLoadingCourse = ref(false)

// Expand/collapse state for chapters and sections
const expandedChapters = ref<Set<string>>(new Set())
const expandedSections = ref<Set<string>>(new Set())

// Get course from store by ID (for backward compatibility)
const courseFromStore = computed(() => {
    return courseStore.entities.find(c => c.id === route.params.id)
})

// Sorted chapters by order
const sortedChapters = computed(() => {
    if (!currentCourse.value?.chapters) return []
    return [...currentCourse.value.chapters].sort((a, b) => {
        const orderA = a.order ?? 0
        const orderB = b.order ?? 0
        return orderA - orderB
    })
})

// Helper functions for expand/collapse
function toggleChapter(chapterId: string) {
    if (expandedChapters.value.has(chapterId)) {
        expandedChapters.value.delete(chapterId)
    } else {
        expandedChapters.value.add(chapterId)
    }
}

function toggleSection(sectionId: string) {
    if (expandedSections.value.has(sectionId)) {
        expandedSections.value.delete(sectionId)
    } else {
        expandedSections.value.add(sectionId)
    }
}

function isChapterExpanded(chapterId: string): boolean {
    return expandedChapters.value.has(chapterId)
}

function isSectionExpanded(sectionId: string): boolean {
    return expandedSections.value.has(sectionId)
}

function getSortedSections(chapter: Chapter) {
    if (!chapter.sections) return []
    return [...chapter.sections].sort((a, b) => {
        const orderA = a.order ?? 0
        const orderB = b.order ?? 0
        return orderA - orderB
    })
}

function getSortedPages(section: Section) {
    if (!section.pages) return []
    return [...section.pages].sort((a, b) => {
        const orderA = a.order ?? 0
        const orderB = b.order ?? 0
        return orderA - orderB
    })
}

onMounted(async () => {
    // Try to get course from store first
    if (courseFromStore.value) {
        currentCourse.value = courseFromStore.value
        selectedVersion.value = courseFromStore.value.version

        // Load all versions for this course
        if (courseFromStore.value.name) {
            await courseStore.fetchCourseVersions(courseFromStore.value.name)
        }
    } else {
        // If not in store, fetch by ID from backend
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
    }
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

                <VersionSelector
                    v-if="courseStore.courseVersions.length > 0"
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
                    <div class="course-structure">
                        <div
                            v-for="chapter in sortedChapters"
                            :key="chapter.id"
                            class="chapter-block"
                        >
                            <div
                                class="chapter-header"
                                @click="toggleChapter(chapter.id)"
                            >
                                <i
                                    class="fas"
                                    :class="isChapterExpanded(chapter.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                                ></i>
                                <h4>{{ chapter.title }}</h4>
                            </div>

                            <div v-if="isChapterExpanded(chapter.id)" class="chapter-content">
                                <p v-if="chapter.description" class="chapter-description">
                                    {{ chapter.description }}
                                </p>

                                <div
                                    v-for="section in getSortedSections(chapter)"
                                    :key="section.id"
                                    class="section-block"
                                >
                                    <div
                                        class="section-header"
                                        @click="toggleSection(section.id)"
                                    >
                                        <i
                                            class="fas"
                                            :class="isSectionExpanded(section.id) ? 'fa-chevron-down' : 'fa-chevron-right'"
                                        ></i>
                                        <h5>{{ section.title }}</h5>
                                    </div>

                                    <div v-if="isSectionExpanded(section.id)" class="section-content">
                                        <p v-if="section.content" class="section-description">
                                            {{ section.content }}
                                        </p>

                                        <div
                                            v-for="page in getSortedPages(section)"
                                            :key="page.id"
                                            class="page-block"
                                        >
                                            <h6 class="page-title">{{ page.title }}</h6>
                                            <div v-if="page.content" class="page-content">
                                                {{ page.content }}
                                            </div>
                                        </div>

                                        <div v-if="!section.pages || section.pages.length === 0" class="empty-state">
                                            {{ t('courseDetails.noPagesInSection') }}
                                        </div>
                                    </div>
                                </div>

                                <div v-if="!chapter.sections || chapter.sections.length === 0" class="empty-state">
                                    {{ t('courseDetails.noSectionsInChapter') }}
                                </div>
                            </div>
                        </div>
                    </div>
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
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: var(--border-width-thin) solid var(--color-border-light);
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

.chapters-list {
    margin: 0;
    padding-left: var(--spacing-lg);
    color: var(--color-text-secondary);
    line-height: 1.8;
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

.not-found p {
    font-size: var(--font-size-lg);
}

/* Course structure hierarchy */
.course-structure {
    margin-top: var(--spacing-md);
}

.chapter-block {
    margin-bottom: var(--spacing-lg);
    border: var(--border-width-thin) solid var(--color-border-light);
    border-radius: var(--border-radius-md);
    overflow: hidden;
}

.chapter-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-background-secondary);
    cursor: pointer;
    transition: background 0.2s ease;
}

.chapter-header:hover {
    background: var(--color-background-tertiary);
}

.chapter-header i {
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    min-width: 16px;
}

.chapter-header h4 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: 600;
}

.chapter-content {
    padding: var(--spacing-md);
    background: var(--color-background);
}

.chapter-description {
    margin: 0 0 var(--spacing-md) 0;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-background-secondary);
    border-left: 3px solid var(--color-primary);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    font-style: italic;
}

.section-block {
    margin-bottom: var(--spacing-md);
    margin-left: var(--spacing-lg);
    border-left: 2px solid var(--color-border-light);
    padding-left: var(--spacing-md);
}

.section-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background 0.2s ease;
}

.section-header:hover {
    background: var(--color-background-tertiary);
}

.section-header i {
    color: var(--color-primary);
    font-size: var(--font-size-xs);
    min-width: 12px;
}

.section-header h5 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
}

.section-content {
    margin-top: var(--spacing-sm);
}

.section-description {
    margin: 0 0 var(--spacing-sm) 0;
    padding: var(--spacing-sm);
    color: var(--color-text-secondary);
}

.page-block {
    margin-bottom: var(--spacing-md);
    margin-left: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--color-background);
    border: var(--border-width-thin) solid var(--color-border-light);
    border-radius: var(--border-radius-sm);
}

.page-title {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: 600;
}

.page-content {
    margin: 0;
    padding: var(--spacing-sm);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    line-height: 1.6;
    white-space: pre-wrap;
    font-family: var(--font-family-mono, monospace);
    font-size: var(--font-size-sm);
}

.empty-state {
    padding: var(--spacing-md);
    text-align: center;
    color: var(--color-text-muted);
    font-style: italic;
    font-size: var(--font-size-sm);
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

    .section-block,
    .page-block {
        margin-left: var(--spacing-sm);
    }

    .chapter-header h4 {
        font-size: var(--font-size-base);
    }

    .section-header h5 {
        font-size: var(--font-size-sm);
    }

    .page-content {
        font-size: var(--font-size-xs);
    }
}
</style>
