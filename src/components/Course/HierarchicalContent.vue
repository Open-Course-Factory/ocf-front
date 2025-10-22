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
import { ref, computed } from 'vue'
import type { Chapter, Section, Page } from '../../types/entities'

interface Props {
    chapters?: Chapter[]
    sections?: Section[]
    noSectionsMessage?: string
    noPagesMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
    noSectionsMessage: 'No sections in this chapter',
    noPagesMessage: 'No pages in this section'
})

// Expand/collapse state
const expandedChapters = ref<Set<string>>(new Set())
const expandedSections = ref<Set<string>>(new Set())

// Sorted chapters by order
const sortedChapters = computed(() => {
    if (!props.chapters) return []
    return [...props.chapters].sort((a, b) => {
        const orderA = a.order ?? 0
        const orderB = b.order ?? 0
        return orderA - orderB
    })
})

// Sorted sections by order (for when sections are passed directly)
const sortedSections = computed(() => {
    if (!props.sections) return []
    return [...props.sections].sort((a, b) => {
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
</script>

<template>
    <div class="hierarchical-content">
        <!-- Full hierarchy: Chapters > Sections > Pages -->
        <div v-if="chapters && chapters.length > 0" class="course-structure">
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
                                {{ noPagesMessage }}
                            </div>
                        </div>
                    </div>

                    <div v-if="!chapter.sections || chapter.sections.length === 0" class="empty-state">
                        {{ noSectionsMessage }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Sections only: Sections > Pages (for chapter detail view) -->
        <div v-else-if="sections && sections.length > 0" class="sections-structure">
            <div
                v-for="section in sortedSections"
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
                        {{ noPagesMessage }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Course structure hierarchy */
.hierarchical-content {
    margin-top: var(--spacing-md);
}

.course-structure,
.sections-structure {
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

.sections-structure .section-block {
    margin-left: 0;
    border-left: none;
    padding-left: 0;
    border: var(--border-width-thin) solid var(--color-border-light);
    border-radius: var(--border-radius-md);
    overflow: hidden;
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

.sections-structure .section-header {
    border-radius: 0;
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

.sections-structure .section-content {
    padding: var(--spacing-md);
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

.sections-structure .page-block {
    margin-left: 0;
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
    .section-block,
    .page-block {
        margin-left: var(--spacing-sm);
    }

    .sections-structure .section-block,
    .sections-structure .page-block {
        margin-left: 0;
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
