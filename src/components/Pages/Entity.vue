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
        Filtered results: {{ totalItems }} total items found
      </div>

      <div v-if="displayedEntities.length > 0">
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

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          <span>Showing {{ ((currentPage - 1) * pageSize) + 1 }}-{{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} results</span>
        </div>
        <div class="pagination-controls">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasPreviousPage || isLoadingEntities"
            @click="goToPage(1)"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasPreviousPage || isLoadingEntities"
            @click="goToPage(currentPage - 1)"
          >
            <i class="fas fa-angle-left"></i> Previous
          </button>

          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="btn btn-sm"
              :class="page === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
              :disabled="isLoadingEntities"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>

          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasNextPage || isLoadingEntities"
            @click="goToPage(currentPage + 1)"
          >
            Next <i class="fas fa-angle-right"></i>
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="!hasNextPage || isLoadingEntities"
            @click="goToPage(totalPages)"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
        <div class="page-size-selector">
          <label for="pageSize">Items per page:</label>
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
          No results match the current filters
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

const { t } = useI18n();

const props = defineProps<{
  entityName: string;
  entityStore: Store;
}>();

const showModal = ref(false);
const entityToEdit = ref();

// Estado para les filtres
const activeFilters = reactive<Record<string, string>>({});

// Pagination state
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const totalItems = ref(0);
const isLoadingEntities = ref(false);
const hasNextPage = ref(false);
const hasPreviousPage = ref(false);

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

// Fonction pour appliquer les filtres
function applyFilters() {
  // Reset to page 1 when filters change
  currentPage.value = 1;
  // Reload data from server with filters
  loadEntities();
}

// Fonction pour effacer tous les filtres
function clearFilters() {
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key] = '';
  });
  // Reset to page 1 and reload data
  currentPage.value = 1;
  loadEntities();
}

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

async function getEntities(entityName: string, store: Store, page: number = 1, size: number = 20, filters: Record<string, string> = {}) {
  isLoadingEntities.value = true;
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value);
      }
    });

    const response = await axios.get(`/${entityName}?${params}`);

    // Handle paginated response with metadata
    if (response.data?.data) {
      // API response has data wrapper
      const entities = response.data.data || [];
      store.entities = entities;

      // Use pagination metadata from API
      totalItems.value = response.data.total || 0;
      totalPages.value = response.data.totalPages || 1;
      currentPage.value = response.data.currentPage || page;
      hasNextPage.value = response.data.hasNextPage || false;
      hasPreviousPage.value = response.data.hasPreviousPage || false;

      // Optional: Log pagination info for debugging (remove in production)
      // console.log('Pagination info:', { total: totalItems.value, totalPages: totalPages.value, currentPage: currentPage.value });
    } else {
      // Direct array response (fallback for non-paginated endpoints)
      const entities = response.data || [];
      store.entities = entities;
      totalItems.value = entities.length;
      totalPages.value = 1;
      currentPage.value = 1;
    }

    if (store.getSelectDatas) {
      store.selectDatas = store.getSelectDatas(store.entities);
    }
  } catch (error: any) {
    console.error('Error while getting ' + entityName, error);
    store.entities = [];
    store.selectDatas = [];
    totalItems.value = 0;
    totalPages.value = 1;
    currentPage.value = 1;
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

// Pagination functions
function loadEntities() {
  getEntities(props.entityName, props.entityStore, currentPage.value, pageSize.value, activeFilters);
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page;
    loadEntities();
  }
}

function changePageSize() {
  currentPage.value = 1;
  loadEntities();
}

// Visible page numbers for pagination
const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

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

.page-numbers {
  display: flex;
  gap: 4px;
  margin: 0 8px;
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

  .page-numbers {
    margin: 0 4px;
  }

  .page-numbers .btn {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>