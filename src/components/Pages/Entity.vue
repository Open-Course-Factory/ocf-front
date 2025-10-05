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

<template>
  <div class="content">
    <!-- Barre d'outils fixe -->
    <div class="toolbar-container">
      <div class="toolbar">
        <div class="toolbar-left">
          <h2>{{ t(`${translationKey}.pageTitle`) }}</h2>
        </div>
        <div class="toolbar-right">
          <!-- Filtres par entités parentes -->
          <div v-if="parentFilters.length > 0" class="filters-container">
            <div
              v-for="filter in parentFilters"
              :key="filter.key"
              class="filter-group"
            >
              <label :for="`filter-${filter.key}`" class="filter-label">
                <i class="fas fa-filter"></i>
                {{ filter.label }}:
              </label>
              <select
                :id="`filter-${filter.key}`"
                v-model="activeFilters[filter.key]"
                @change="applyFilters"
                class="filter-select"
              >
                <option value="">All</option>
                <option
                  v-for="option in filter.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.text }}
                </option>
              </select>
            </div>
            <button
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="btn btn-secondary btn-clear-filters"
              title="Clear filters"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <button class="btn btn-primary" @click="openModal(null)">
            <i class="fas fa-plus"></i> {{ t('add') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contenu principal avec padding pour compenser la toolbar fixe -->
    <div class="main-content">
      <!-- Indicateur de filtres actifs -->
      <div v-if="hasActiveFilters" class="active-filters-info">
        <i class="fas fa-info-circle"></i>
        {{ t('pagination.filteredResults') }} {{ totalItems }} {{ t('pagination.totalItems') }}
      </div>

      <!-- Sequential navigation loading state -->
      <div v-if="isSequentialNavigating" class="sequential-loading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>{{ t('pagination.navigatingTo') }} {{ targetPageForNavigation }}...</p>
      </div>

      <!-- Normal entity list (hidden during sequential navigation) -->
      <div v-else-if="displayedEntities.length > 0">
        <ul>
          <li v-for="entity in displayedEntities" :key="entity.id" class="entity-item">
            <EntityCard :entity="entity" :entityStore="props.entityStore" />
            <div class="actions">
              <!-- Slot pour les actions spécifiques -->
              <slot name="actions" :entity="entity"></slot>
              <button
                class="btn btn-primary"
                v-if="isEditable(props.entityStore)"
                @click="openModal(entity)"
              >
                <i class="fas fa-edit"></i>
                <br>
                {{ t('edit') }}
              </button>
              <button
                class="btn btn-danger"
                :disabled="props.entityStore.entities.length <= 1"
                @click="deleteEntity(entity.id)"
              >
                <i class="fas fa-trash"></i>
                <br>
                {{ t('delete') }}
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Cursor-based Pagination Controls -->
      <div v-if="shouldShowPagination && !isSequentialNavigating" class="pagination-container">
        <div class="pagination-info">
          <span>{{ t('pagination.showing') }} {{ (currentPageIndex * pageSize) + 1 }}-{{ (currentPageIndex * pageSize) + displayedEntities.length }} {{ t('pagination.of') }} {{ totalItems }} {{ t('pagination.results') }} ({{ t('pagination.page') }} {{ currentPageIndex + 1 }})</span>
        </div>
        <div class="pagination-controls">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasPreviousPage || isLoadingEntities"
            @click="goToFirstPage"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasPreviousPage || isLoadingEntities"
            @click="goToPreviousPage"
          >
            <i class="fas fa-angle-left"></i> {{ t('pagination.previous') }}
          </button>

          <div class="page-indicator">
            <span
              v-if="!showPageJumpInput"
              class="current-page-indicator clickable"
              @click="togglePageJumpInput"
              :title="`${t('pagination.clickToJump')} (1-${totalPages})`"
            >
              {{ t('pagination.page') }} {{ currentPageIndex + 1 }} / {{ totalPages }}
            </span>
            <div v-else class="page-jump-container">
              <input
                v-model="pageJumpInput"
                type="number"
                min="1"
                :max="totalPages"
                class="page-jump-input"
                @keyup="handlePageJumpKeypress"
                @blur="handleInputBlur"
                :placeholder="`1-${totalPages}`"
              />
              <button
                class="btn btn-primary btn-xs"
                @mousedown.prevent
                @click="jumpToPage"
              >
                {{ t('pagination.go') }}
              </button>
            </div>
          </div>

          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasNextPage || isLoadingEntities"
            @click="goToNextPage"
          >
            {{ t('pagination.next') }} <i class="fas fa-angle-right"></i>
          </button>
        </div>
        <div class="page-size-selector">
          <label for="pageSize">{{ t('pagination.itemsPerPage') }}</label>
          <select
            id="pageSize"
            v-model="pageSize"
            @change="changePageSize"
            :disabled="isLoadingEntities"
            class="form-select form-select-sm"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div v-else-if="totalItems === 0 && hasActiveFilters && !isLoadingEntities">
        <p class="no-results">
          <i class="fas fa-search"></i>
          {{ t('pagination.noResults') }}
        </p>
      </div>
      <div v-else-if="totalItems === 0 && !isLoadingEntities">
        <p class="empty-state">
          <i class="fas fa-inbox"></i>
          {{ t('empty') }}
        </p>
      </div>
    </div>

    <EntityModal
      :visible="showModal"
      :entity="entityToEdit"
      :entity-store="props.entityStore"
      :entity-name="props.entityName"
      :fieldList="props.entityStore.fieldList"
      @submit="addEntity"
      @modify="updateEntity"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref, onBeforeMount, computed, reactive, watch } from 'vue';
import EntityModal from '../Modals/EntityModal.vue';
import EntityCard from '../Cards/EntityCard.vue';
import { useI18n } from 'vue-i18n';
import { Store } from 'pinia';
import { getTranslationKey } from '../../utils';
import { useRoute, useRouter } from 'vue-router';
import { useBaseStore } from '../../stores/baseStore';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Ensure baseStore is initialized to load pagination translations
useBaseStore();


const props = defineProps<{
  entityName: string;
  entityStore: Store;
}>();

const showModal = ref(false);
const entityToEdit = ref();

// Estado para les filtres
const activeFilters = reactive<Record<string, string>>({});

// Cursor-based pagination state
const currentCursor = ref<string | null>(null);
const nextCursor = ref<string | null>(null);
const pageSize = ref(20);
const totalItems = ref(0);
const isLoadingEntities = ref(false);
const hasNextPage = ref(false);
const hasPreviousPage = ref(false);
const pageHistory = ref<Array<{ cursor: string | null, count: number }>>([{ cursor: null, count: 0 }]);
const currentPageIndex = ref(0);
const isUpdatingURL = ref(false);
const backendSupportsCursor = ref<boolean | null>(null); // null = unknown, true = supports, false = doesn't support
const pageJumpInput = ref('');
const showPageJumpInput = ref(false);
const isSequentialNavigating = ref(false);
const targetPageForNavigation = ref(0);

// Calcul des filtres disponibles basés sur les entités parentes
const parentFilters = computed(() => {
  const filters: Array<{key: string, label: string, options: Array<{value: string, text: string}>}> = [];

  if (!props.entityStore.fieldList) return filters;

  // Chercher dans les entités parentes
  if ((props.entityStore as any).parentEntitiesStores) {
    (props.entityStore as any).parentEntitiesStores.forEach((parentStore: any, key: string) => {
      const field = props.entityStore.fieldList.get(key);
      if (field && parentStore && parentStore.entities && parentStore.entities.length > 0) {
        let filteredOptions = parentStore.selectDatas || [];

        // Filter options based on other active filters for related entities
        if (Object.keys(activeFilters).some(filterKey => activeFilters[filterKey] && filterKey !== key)) {
          filteredOptions = parentStore.selectDatas.filter((option: any) => {
            const entity = parentStore.entities.find((e: any) => e.id === option.value);
            if (!entity) return false;

            // Check if this entity is compatible with other active filters
            return Object.entries(activeFilters).every(([filterKey, filterValue]) => {
              if (!filterValue || filterKey === key) return true;

              // Check if the entity has a relationship field that matches the active filter
              // Direct match (e.g., section.courseId === selectedCourseId)
              if (entity[filterKey] === filterValue) return true;

              // Array field match (e.g., chapter.courseIDs.includes(selectedCourseId))
              if (Array.isArray(entity[filterKey]) && entity[filterKey].includes(filterValue)) return true;

              // Handle field name variations generically
              const variations = [
                filterKey.replace(/s$/, ''), // courseIds -> courseId
                filterKey + 's', // courseId -> courseIds
                filterKey.replace(/Id$/, 'IDs'), // courseId -> courseIDs
                filterKey.replace(/ID$/, 'IDs'), // courseID -> courseIDs
                filterKey.replace(/id$/, 'ids'), // courseid -> courseids
              ];

              for (const variation of variations) {
                // Direct value match
                if (entity[variation] === filterValue) return true;

                // Array/collection match (including Proxy arrays)
                if (entity[variation] && entity[variation].includes && entity[variation].includes(filterValue)) {
                  return true;
                }

                // Additional check for reactive arrays that might not have direct includes method
                if (entity[variation]) {
                  try {
                    const arrayContent = Array.from(entity[variation]);
                    if (arrayContent.includes(filterValue)) return true;
                  } catch (e) {
                    // Not iterable, skip
                  }
                }
              }

              return false;
            });
          });
        }

        filters.push({
          key: key,
          label: field.label || t(`${translationKey}.${key}`),
          options: filteredOptions
        });
      }
    });
  }

  return filters;
});

// Entités affichées (viennent directement du serveur, déjà filtrées)
const displayedEntities = computed(() => {
  return props.entityStore.entities || [];
});

// Vérifier s'il y a des filtres actifs
const hasActiveFilters = computed(() => {
  return Object.values(activeFilters).some(value => value !== '');
});

// Determine if pagination should be shown
const shouldShowPagination = computed(() => {
  return hasNextPage.value || hasPreviousPage.value || totalItems.value > pageSize.value;
});

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value);
});

// Fonction pour appliquer les filtres
function applyFilters() {
  // Reset to first page when filters change
  resetPagination();
  // Update URL with new filters
  updateURL();
  // Reload data from server with filters
  loadEntities();
}

// Fonction pour effacer tous les filtres
function clearFilters() {
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key] = '';
  });
  // Reset to first page and reload data
  resetPagination();
  // Update URL to remove filters
  updateURL();
  loadEntities();
}

// Reset pagination to initial state
function resetPagination() {
  currentCursor.value = null;
  nextCursor.value = null;
  currentPageIndex.value = 0;
  pageHistory.value = [{ cursor: null, count: 0 }];
  hasNextPage.value = false;
  hasPreviousPage.value = false;
}

// Validate page from URL and redirect to valid page if needed
function validateRequestedPage() {
  const requestedPage = (window as any).__requestedPage;
  if (!requestedPage || requestedPage <= 1) {
    // Clear the stored requested page
    delete (window as any).__requestedPage;
    return;
  }

  // Use computed total pages
  const totalPagesCount = totalPages.value;

  console.log(`Validating requested page ${requestedPage} against ${totalPagesCount} total pages`);

  if (requestedPage > totalPagesCount && totalPagesCount > 0) {
    // Requested page doesn't exist, redirect to last page
    console.log(`Page ${requestedPage} doesn't exist, redirecting to last page ${totalPagesCount}`);

    // Clear the stored requested page
    delete (window as any).__requestedPage;

    // Update URL to valid last page
    const validQuery = { ...route.query };
    validQuery.page = totalPagesCount.toString();

    router.replace({
      path: route.path,
      query: validQuery
    });

    return;
  } else if (requestedPage <= totalPagesCount && requestedPage > 1) {
    // Valid page requested - we need to navigate to it
    console.log(`Valid page ${requestedPage} requested - starting navigation`);

    // Clear the stored requested page
    delete (window as any).__requestedPage;

    // Navigate to the requested page sequentially
    navigateToPageSequentially(requestedPage);
  } else {
    // Clear the stored requested page
    delete (window as any).__requestedPage;
  }
}

// Navigate to a specific page by loading pages sequentially (for cursor pagination)
async function navigateToPageSequentially(targetPage: number) {
  if (targetPage <= 1) {
    return;
  }

  console.log(`Starting sequential navigation to page ${targetPage}`);

  // Set navigation flag to hide intermediate states
  isSequentialNavigating.value = true;
  targetPageForNavigation.value = targetPage;

  try {
    // Start from page 1
    resetPagination();

  // Load pages sequentially until we reach the target
  for (let page = 1; page <= targetPage; page++) {
    if (!hasNextPage.value && page > 1) {
      // We've reached the end before getting to target page
      console.log(`Reached end at page ${page}, target was ${targetPage}`);
      break;
    }

    if (page > 1) {
      // Move to next page
      await goToNextPageForSequentialNavigation();
    } else {
      // Load first page
      await loadEntities();
    }

    // Safety check to prevent infinite loops
    if (page > 100) {
      console.error('Sequential navigation safety limit reached');
      break;
    }
  }

  console.log(`Sequential navigation completed, currently on page ${currentPageIndex.value + 1}`);

  } finally {
    // Clear navigation flag to show final result
    isSequentialNavigating.value = false;
  }
}

// Page jump functions
function togglePageJumpInput() {
  showPageJumpInput.value = !showPageJumpInput.value;
  if (showPageJumpInput.value) {
    pageJumpInput.value = (currentPageIndex.value + 1).toString();
    // Focus the input after the next tick
    setTimeout(() => {
      const input = document.querySelector('.page-jump-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }
}

function jumpToPage() {
  console.log('🔄 jumpToPage called with input:', pageJumpInput.value);

  const targetPage = parseInt(pageJumpInput.value);

  console.log('📊 Jump validation:', {
    input: pageJumpInput.value,
    targetPage,
    isNaN: isNaN(targetPage),
    totalPages: totalPages.value,
    currentPage: currentPageIndex.value + 1
  });

  if (isNaN(targetPage) || targetPage < 1) {
    console.log('❌ Invalid page number');
    alert(t('pagination.invalidPage'));
    return;
  }

  if (targetPage > totalPages.value) {
    console.log('❌ Page exceeds maximum');
    alert(`${t('pagination.page')} ${targetPage} ${t('pagination.pageNotExist')} ${totalPages.value}`);
    return;
  }

  if (targetPage === currentPageIndex.value + 1) {
    // Already on this page
    console.log('✅ Already on target page, closing input');
    showPageJumpInput.value = false;
    return;
  }

  console.log(`✅ Jumping to page ${targetPage}`);

  // Update URL to trigger navigation
  const newQuery = { ...route.query };
  newQuery.page = targetPage.toString();

  console.log('🔄 Updating URL:', { newQuery });

  router.push({
    path: route.path,
    query: newQuery
  });

  showPageJumpInput.value = false;
}

function handlePageJumpKeypress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    jumpToPage();
  } else if (event.key === 'Escape') {
    showPageJumpInput.value = false;
  }
}

function handleInputBlur() {
  // Delay the blur to allow button click to process first
  setTimeout(() => {
    showPageJumpInput.value = false;
  }, 150);
}

// Helper function for sequential navigation (doesn't update URL)
async function goToNextPageForSequentialNavigation() {
  if (hasNextPage.value) {
    // Save current page info in history
    if (currentPageIndex.value >= pageHistory.value.length - 1) {
      pageHistory.value.push({
        cursor: nextCursor.value,
        count: displayedEntities.value.length
      });
    }

    currentPageIndex.value++;
    currentCursor.value = nextCursor.value;
    hasPreviousPage.value = true;

    // Load entities without updating URL (for sequential navigation)
    await getEntitiesWithCursor(props.entityName, props.entityStore, currentCursor.value, pageSize.value, activeFilters);
  }
}

// URL synchronization functions
function updateURL() {
  // Prevent infinite loops
  isUpdatingURL.value = true;

  const query: Record<string, string> = {};

  // Add active filters to URL
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value && value !== '') {
      query[key] = value;
    }
  });

  // Add pagination info
  if (currentPageIndex.value > 0) {
    query.page = (currentPageIndex.value + 1).toString();
  }

  if (pageSize.value !== 20) {
    query.size = pageSize.value.toString();
  }

  // Use push for pagination to create history entries, replace for filters
  // This allows back button to navigate through pagination states
  const currentQuery = route.query;
  const isPageChange = query.page !== currentQuery.page;

  const routeUpdate = {
    path: route.path,
    query
  };

  if (isPageChange && query.page) {
    // Pagination changes create new history entries
    router.push(routeUpdate).finally(() => {
      isUpdatingURL.value = false;
    });
  } else {
    // Filter changes and resets use replace to avoid cluttering history
    router.replace(routeUpdate).finally(() => {
      isUpdatingURL.value = false;
    });
  }
}

function loadFromURL() {
  // Load filters from URL
  Object.keys(activeFilters).forEach(key => {
    const urlValue = route.query[key] as string;
    if (urlValue) {
      activeFilters[key] = urlValue;
    }
  });

  // Load page size from URL
  const urlSize = route.query.size as string;
  if (urlSize) {
    pageSize.value = parseInt(urlSize);
  }

  // For cursor pagination, we can't jump to arbitrary pages
  // We need to load from page 1 and validate the requested page after getting total count
  const urlPage = route.query.page as string;
  if (urlPage) {
    const requestedPage = parseInt(urlPage);
    if (requestedPage > 1) {
      // Store the requested page for validation after data loads
      (window as any).__requestedPage = requestedPage;
      console.log(`URL requests page ${requestedPage} - will validate after loading data`);
    }
  }
}

// Watch for URL query changes to reload data
watch(() => route.query, (newQuery, oldQuery) => {
  // Skip if we're updating URL programmatically, or if it's the initial load
  if (isUpdatingURL.value || !oldQuery || JSON.stringify(newQuery) === JSON.stringify(oldQuery)) {
    return;
  }

  console.log('URL query changed from browser navigation, reloading data:', { newQuery, oldQuery });

  // Reset pagination state
  resetPagination();

  // Load state from new URL
  loadFromURL();

  // Reload entities with new parameters
  loadEntities();
}, { deep: true });

// Initialiser les filtres quand les données changent
watch(() => props.entityStore.entities, () => {
  // Réinitialiser les filtres si nécessaire
  parentFilters.value.forEach(filter => {
    if (!(filter.key in activeFilters)) {
      activeFilters[filter.key] = '';
    }
  });
}, { immediate: true });

onBeforeMount(() => {
  // Load state from URL first
  loadFromURL();
  loadEntities();

  // Charger les données des entités parentes (sans pagination)
  if ((props.entityStore as any).parentEntitiesStores) {
    (props.entityStore as any).parentEntitiesStores.forEach((store: Store, key: string) => {
      getEntitiesWithoutPagination(store.$id || key, store);
    });
  }

  // Charger les données des sous-entités (sans pagination)
  if (props.entityStore.subEntitiesStores) {
    props.entityStore.subEntitiesStores.forEach((store: Store, key: string) => {
      getEntitiesWithoutPagination(store.$id || key, store);
    });
  }
});

async function getEntitiesWithCursor(entityName: string, store: any, cursor: string | null = null, size: number = 20, filters: Record<string, string> = {}) {
  isLoadingEntities.value = true;
  try {
    let result: { data: any[], nextCursor: string | null, hasMore: boolean, total: number };

    // Check if store supports cursor-based pagination
    if (store.loadEntitiesWithCursor && typeof store.loadEntitiesWithCursor === 'function') {
      result = await store.loadEntitiesWithCursor(`/${entityName}`, cursor, size, filters);
    } else {
      // Determine pagination strategy based on backend support
      let response: any;

      // Backend supports cursor pagination when cursor parameter is present
      console.log('Using cursor pagination with cursor:', cursor || '(empty for first page)');

      const cursorParams = new URLSearchParams();
      cursorParams.append('cursor', cursor || ''); // ✅ Always include cursor param, even if empty
      cursorParams.append('limit', size.toString());

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          cursorParams.append(key, value);
        }
      });

      response = await axios.get(`/${entityName}?${cursorParams}`);

      // Handle cursor-based response (backend always returns cursor format when cursor param is present)
      console.log('✅ Backend supports cursor pagination');
      result = {
        data: response.data?.data || response.data || [],
        nextCursor: response.data?.nextCursor || null, // ✅ Use exact cursor from API
        hasMore: response.data?.hasMore || false,
        total: response.data?.total || 0
      };

      // Update store entities manually for fallback
      if (cursor) {
        store.entities.push(...result.data);
      } else {
        store.entities.splice(0, store.entities.length, ...result.data);
      }
    }

    // Update pagination state
    totalItems.value = result.total || 0;
    hasNextPage.value = result.hasMore || false;

    // Safety check: if we have a total that's larger than current page, we should have next page
    if (totalItems.value > (currentPageIndex.value + 1) * pageSize.value) {
      hasNextPage.value = true;

      // ❌ NEVER generate fake cursors - this breaks UUID-based backends
    }

    // Debug logging (can be removed in production)
    console.log('Pagination debug:', {
      totalItems: totalItems.value,
      hasNextPage: hasNextPage.value,
      hasPreviousPage: hasPreviousPage.value,
      currentPageIndex: currentPageIndex.value,
      pageSize: pageSize.value,
      entityCount: result.data.length,
      nextCursor: result.nextCursor,
      currentCursor: currentCursor.value,
      mode: backendSupportsCursor.value === true ? 'cursor' :
            backendSupportsCursor.value === false ? 'offset' : 'detecting'
    });

    // Store next cursor separately (don't overwrite currentCursor)
    nextCursor.value = result.nextCursor;

    // Update previous page state based on current position
    hasPreviousPage.value = currentPageIndex.value > 0;

    // Validate requested page from URL after we have total count
    validateRequestedPage();

    // Update select data if available
    if (store.getSelectDatas) {
      store.selectDatas = store.getSelectDatas(store.entities);
    }

    return result;
  } catch (error: any) {
    console.error('Error while getting ' + entityName, error);
    store.entities = [];
    store.selectDatas = [];
    totalItems.value = 0;
    hasNextPage.value = false;
    hasPreviousPage.value = false;
    switch (error.response?.status) {
      case 404:
        break;
      case 401:
        console.log('401 - L\'intercepteur va gérer la déconnexion');
        break;
      default:
        break;
    }
  } finally {
    isLoadingEntities.value = false;
  }
}

// Get entities without pagination for parent/sub entities
async function getEntitiesWithoutPagination(entityName: string, store: Store) {
  try {
    const response = await axios.get(`/${entityName}`);
    const entities = response.data?.data || response.data || [];
    store.entities = entities;
    if (store.getSelectDatas) {
      store.selectDatas = store.getSelectDatas(store.entities);
    }
  } catch (error: any) {
    store.entities = [];
    store.selectDatas = [];
    console.error('Error while getting ' + entityName, error);
  }
}

async function addEntity(data: Record<string, string>) {
  try {
    // Exécuter le hook beforeCreate si défini
    const processedData = await props.entityStore.executeBeforeCreateHook?.(data) || data;
    
    const response = await axios.post(`/${props.entityName}`, processedData);
    
    const newEntity = response.data;
    props.entityStore.entities.push(newEntity);
    
    if (props.entityStore.getSelectDatas) {
      props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities);
    }
    
    // Exécuter le hook afterCreate si défini (générique)
    if (props.entityStore.executeAfterCreateHook) {
      await props.entityStore.executeAfterCreateHook(newEntity, data);
    }
    
    showModal.value = false;
  } catch (error) {
    console.error('Error while adding ' + props.entityName, error);
  }
}

async function deleteEntity(keyId: string) {
  try {
    await axios.delete(`/${props.entityName}/${keyId}`);
    
    props.entityStore.entities = props.entityStore.entities.filter((entity: any) => entity.id !== keyId);
    
    if (props.entityStore.getSelectDatas) {
      props.entityStore.selectDatas = props.entityStore.getSelectDatas(props.entityStore.entities);
    }
    
    // Exécuter le hook afterDelete si défini (générique)
    if (props.entityStore.executeAfterDeleteHook) {
      await props.entityStore.executeAfterDeleteHook(keyId);
    }
  } catch (error) {
    console.error('Error while deleting ' + props.entityName, error);
  }
}

async function updateEntity(data: Record<string, string>) {
  try {
    await axios.patch(`/${props.entityName}/${data['id']}`, data);
    
    // Recharger les entités
    loadEntities();
    
    // Exécuter le hook afterUpdate si défini (générique)
    if (props.entityStore.executeAfterUpdateHook) {
      const updatedEntity = props.entityStore.entities.find((e: any) => e.id === data['id']);
      await props.entityStore.executeAfterUpdateHook(updatedEntity, data);
    }
    
    showModal.value = false;
  } catch (error) {
    console.error('Error while updating ' + props.entityName, error);
  }
}

// Cursor-based pagination functions
async function loadEntities() {
  // Use currentCursor for the current page, not pageHistory
  return await getEntitiesWithCursor(props.entityName, props.entityStore, currentCursor.value, pageSize.value, activeFilters);
}

function goToNextPage() {
  console.log('🔄 goToNextPage called:', {
    hasNextPage: hasNextPage.value,
    currentCursor: currentCursor.value,
    currentPageIndex: currentPageIndex.value,
    totalItems: totalItems.value
  });

  if (hasNextPage.value) {
    // Save current page info in history BEFORE moving to next page
    if (currentPageIndex.value >= pageHistory.value.length - 1) {
      pageHistory.value.push({
        cursor: nextCursor.value,
        count: displayedEntities.value.length
      });
    }

    currentPageIndex.value++;
    // Update currentCursor to the next page cursor
    currentCursor.value = nextCursor.value;

    hasPreviousPage.value = true;
    // Update URL with new page
    updateURL();
    loadEntities();
  } else {
    console.log('❌ Cannot go to next page: hasNextPage is false');
  }
}

function goToPreviousPage() {
  if (hasPreviousPage.value && currentPageIndex.value > 0) {
    currentPageIndex.value--;

    // Get the cursor for the previous page
    const previousPageData = pageHistory.value[currentPageIndex.value];
    currentCursor.value = previousPageData?.cursor || null;

    console.log('🔄 Going to previous page:', {
      currentPageIndex: currentPageIndex.value,
      cursor: currentCursor.value,
      pageHistoryLength: pageHistory.value.length
    });

    // Update URL with new page
    updateURL();
    loadEntities();

    // Update previous page state
    hasPreviousPage.value = currentPageIndex.value > 0;
  }
}

function goToFirstPage() {
  if (hasPreviousPage.value) {
    resetPagination();
    props.entityStore.entities.splice(0);
    // Update URL to remove page
    updateURL();
    loadEntities();
  }
}

function changePageSize() {
  console.log('📏 changePageSize called:', {
    newPageSize: pageSize.value,
    currentPageIndex: currentPageIndex.value,
    totalItems: totalItems.value
  });

  resetPagination();
  props.entityStore.entities.splice(0);
  // Update URL with new page size
  updateURL();
  loadEntities();
}

function isEditable(entityStore: Store) {
  let res = false;
  entityStore.fieldList?.forEach((element: any) => {
    if (element.toBeEdited === true) {
      res = true;
      return res;
    }
  });
  return res;
}

function openModal(entity: any) {
  showModal.value = true;
  entityToEdit.value = entity;
}

const translationKey = computed(() => getTranslationKey(props.entityName));
</script>

<style scoped>
.content {
  width: 100%;
  animation: fadeIn 0.5s ease-in-out;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

.entity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  transition: transform 0.3s, background-color 0.3s;
}

.entity-item:hover {
  background-color: #f8f9fa;
  transform: scale(1.02);
}

.actions :deep(button) {
  margin-left: 10px;
  margin-bottom: 2px;
  width: -moz-available;          /* WebKit-based browsers will ignore this. */
  width: -webkit-fill-available;  /* Mozilla-based browsers will ignore this. */
}

.actions .btn i {
  margin-right: 5px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Styles */
.modal-content {
  max-height: 80vh; /* Adjust as needed */
  overflow-y: auto;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

/* === AJOUTS MINIMAUX POUR LES NOUVELLES FONCTIONNALITÉS === */

/* Toolbar fixe */
.toolbar-container {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 0 0 16px 16px;
  border-radius: 12px;
}

.toolbar {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.toolbar-left {
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Filtres - style minimal */
.filters-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.btn-clear-filters {
  padding: 5px 10px;
  font-size: 12px;
}

/* Contenu principal */
.main-content {
  width: 98%;
  margin: 1%;
}

/* Messages d'état */
.active-filters-info {
  background: #f0f8ff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
}

/* Messages d'état */
.empty-state,
.no-results {
  text-align: center;
  padding: 20px;
}

/* === PAGINATION STYLES === */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.pagination-info {
  font-size: 14px;
  color: #6c757d;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-indicator {
  display: flex;
  align-items: center;
  margin: 0 8px;
}

.current-page-indicator {
  padding: 8px 12px;
  background: #e9ecef;
  border-radius: 4px;
  font-weight: 500;
  color: #495057;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.page-size-selector select {
  width: auto;
  min-width: 70px;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-controls {
    order: 2;
  }

  .pagination-info {
    order: 1;
  }

  .page-size-selector {
    order: 3;
  }

  .page-indicator {
    margin: 0 4px;
  }

  .current-page-indicator {
    padding: 6px 10px;
    font-size: 12px;
  }

  .current-page-indicator.clickable {
    cursor: pointer;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .current-page-indicator.clickable:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }

  .page-jump-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .page-jump-input {
    width: 60px;
    padding: 4px 6px;
    font-size: 12px;
    border: 1px solid #ced4da;
    border-radius: 3px;
    text-align: center;
  }

  .page-jump-input:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .btn-xs {
    padding: 2px 6px;
    font-size: 11px;
    line-height: 1.2;
  }

  .sequential-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .loading-spinner {
    margin-bottom: 16px;
  }

  .loading-spinner i {
    font-size: 24px;
    color: #007bff;
  }

  .sequential-loading p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
  }
}
</style>