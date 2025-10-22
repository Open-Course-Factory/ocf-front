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
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useSectionsStore } from '../../stores/sections'
import { useTranslations } from '../../composables/useTranslations'
import EntityModal from '../Modals/EntityModal.vue'
import type { Section } from '../../types/entities'

const route = useRoute()
const sectionStore = useSectionsStore()

const { t } = useTranslations({
    en: {
        sectionDetails: {
            sectionNotFound: 'Section not found.',
            loading: 'Loading section...',
            title: 'Title',
            content: 'Content',
            pages: 'Pages',
            noPagesInSection: 'No pages in this section',
            edit: 'Edit',
            updateSuccess: 'Section updated successfully'
        }
    },
    fr: {
        sectionDetails: {
            sectionNotFound: 'La section n\'a pas été trouvée.',
            loading: 'Chargement de la section...',
            title: 'Titre',
            content: 'Contenu',
            pages: 'Pages',
            noPagesInSection: 'Aucune page dans cette section',
            edit: 'Modifier',
            updateSuccess: 'Section mise à jour avec succès'
        }
    }
})

const currentSection = ref<Section | null>(null)
const isLoadingSection = ref(false)
const showEditModal = ref(false)

// Open edit modal
function openEditModal() {
    showEditModal.value = true
}

// Handle section update
async function updateSection(updatedSection: Section) {
    if (!currentSection.value?.id) return

    const success = await sectionStore.update(currentSection.value.id, updatedSection)

    if (success) {
        // Refresh the section data
        const sectionData = await sectionStore.fetchSectionById(currentSection.value.id)
        if (sectionData) {
            currentSection.value = sectionData
        }
        showEditModal.value = false
    }
}

// Sorted pages by order
const sortedPages = computed(() => {
    if (!currentSection.value?.pages) return []
    return [...currentSection.value.pages].sort((a, b) => {
        const orderA = a.order ?? 0
        const orderB = b.order ?? 0
        return orderA - orderB
    })
})

onMounted(async () => {
    // Always fetch full section data from backend to ensure we have pages
    isLoadingSection.value = true
    const sectionId = route.params.id as string
    const sectionData = await sectionStore.fetchSectionById(sectionId)

    if (sectionData) {
        currentSection.value = sectionData
    }

    isLoadingSection.value = false
})
</script>

<template>
    <div class="wrapper">
        <div class="page-content" v-if="currentSection">
            <div class="page-header">
                <h2>{{ currentSection.title }}</h2>
                <button class="btn btn-primary" @click="openEditModal">
                    <i class="fas fa-edit"></i>
                    {{ t('sectionDetails.edit') }}
                </button>
            </div>

            <div class="section-info">
                <div v-if="currentSection.content" class="info-section">
                    <h3>{{ t('sectionDetails.content') }}</h3>
                    <p>{{ currentSection.content }}</p>
                </div>

                <div v-if="currentSection.pages && currentSection.pages.length > 0" class="info-section">
                    <h3>{{ t('sectionDetails.pages') }}</h3>
                    <div class="pages-list">
                        <div
                            v-for="page in sortedPages"
                            :key="page.id"
                            class="page-block"
                        >
                            <h4 class="page-title">{{ page.title }}</h4>
                            <div v-if="page.content" class="page-content">
                                {{ page.content }}
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    {{ t('sectionDetails.noPagesInSection') }}
                </div>
            </div>
        </div>
        <div v-else-if="isLoadingSection" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>{{ t('sectionDetails.loading') }}</p>
        </div>
        <div v-else class="not-found">
            <p>{{ t('sectionDetails.sectionNotFound') }}</p>
        </div>

        <EntityModal
            :visible="showEditModal"
            :entity="currentSection"
            :entity-store="sectionStore"
            entity-name="sections"
            :fieldList="sectionStore.fieldList"
            @modify="updateSection"
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
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.page-header h2 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-2xl);
}

.section-info {
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

.pages-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.page-block {
    padding: var(--spacing-md);
    background: var(--color-background);
    border: var(--border-width-thin) solid var(--color-border-light);
    border-radius: var(--border-radius-sm);
}

.page-title {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
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

    .page-header h2 {
        font-size: var(--font-size-xl);
    }

    .page-content {
        font-size: var(--font-size-xs);
    }
}
</style>
