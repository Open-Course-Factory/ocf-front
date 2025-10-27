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
import { ref, onMounted } from 'vue'
import { useChaptersStore } from '../../stores/chapters'
import { useTranslations } from '../../composables/useTranslations'
import HierarchicalContent from '../Course/HierarchicalContent.vue'
import EntityModal from '../Modals/EntityModal.vue'
import type { Chapter } from '../../types/entities'

const route = useRoute()
const chapterStore = useChaptersStore()

const { t } = useTranslations({
    en: {
        chapterDetails: {
            chapterNotFound: 'Chapter not found.',
            loading: 'Loading chapter...',
            title: 'Title',
            description: 'Description',
            sections: 'Sections',
            noPagesInSection: 'No pages in this section',
            edit: 'Edit',
            updateSuccess: 'Chapter updated successfully'
        }
    },
    fr: {
        chapterDetails: {
            chapterNotFound: 'Le chapitre n\'a pas été trouvé.',
            loading: 'Chargement du chapitre...',
            title: 'Titre',
            description: 'Description',
            sections: 'Sections',
            noPagesInSection: 'Aucune page dans cette section',
            edit: 'Modifier',
            updateSuccess: 'Chapitre mis à jour avec succès'
        }
    }
})

const currentChapter = ref<Chapter | null>(null)
const isLoadingChapter = ref(false)
const showEditModal = ref(false)

// Open edit modal
function openEditModal() {
    showEditModal.value = true
}

// Handle chapter update
async function updateChapter(updatedChapter: Record<string, any>) {
    if (!currentChapter.value?.id) return

    const success = await chapterStore.update(currentChapter.value.id, updatedChapter)

    if (success) {
        // Refresh the chapter data
        const chapterData = await chapterStore.fetchChapterById(currentChapter.value.id)
        if (chapterData) {
            currentChapter.value = chapterData
        }
        showEditModal.value = false
    }
}

onMounted(async () => {
    // Always fetch full chapter data from backend to ensure we have sections/pages
    isLoadingChapter.value = true
    const chapterId = route.params.id as string
    const chapterData = await chapterStore.fetchChapterById(chapterId)

    if (chapterData) {
        currentChapter.value = chapterData
    }

    isLoadingChapter.value = false
})
</script>

<template>
    <div class="wrapper">
        <div class="page-content" v-if="currentChapter">
            <div class="page-header">
                <h2>{{ currentChapter.title }}</h2>
                <button class="btn btn-primary" @click="openEditModal">
                    <i class="fas fa-edit"></i>
                    {{ t('chapterDetails.edit') }}
                </button>
            </div>

            <div class="chapter-info">
                <div v-if="currentChapter.description" class="info-section">
                    <h3>{{ t('chapterDetails.description') }}</h3>
                    <p>{{ currentChapter.description }}</p>
                </div>

                <div v-if="currentChapter.sections && currentChapter.sections.length > 0" class="info-section">
                    <h3>{{ t('chapterDetails.sections') }}</h3>
                    <HierarchicalContent
                        :sections="currentChapter.sections"
                        :no-pages-message="t('chapterDetails.noPagesInSection')"
                    />
                </div>
            </div>
        </div>
        <div v-else-if="isLoadingChapter" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>{{ t('chapterDetails.loading') }}</p>
        </div>
        <div v-else class="not-found">
            <p>{{ t('chapterDetails.chapterNotFound') }}</p>
        </div>

        <EntityModal
            :visible="showEditModal"
            :entity="currentChapter"
            :entity-store="chapterStore"
            entity-name="chapters"
            :fieldList="chapterStore.fieldList"
            @modify="updateChapter"
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

.chapter-info {
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

    .page-header h2 {
        font-size: var(--font-size-xl);
    }
}
</style>
