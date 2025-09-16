<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
                <option value="">{{ t('all') }}</option>
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
              :title="t('clearFilters')"
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
        {{ t('filteredResults', { total: filteredEntities.length, of: props.entityStore.entities.length }) }}
      </div>

      <div v-if="filteredEntities.length > 0">
        <ul>
          <li v-for="entity in filteredEntities" :key="entity.id" class="entity-item">
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
      <div v-else-if="props.entityStore.entities.length === 0">
        <p class="empty-state">
          <i class="fas fa-inbox"></i>
          {{ t('empty') }}
        </p>
      </div>
      <div v-else>
        <p class="no-results">
          <i class="fas fa-search"></i>
          {{ t('noFilterResults') }}
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

// Ajouter les traductions manquantes
useI18n().mergeLocaleMessage('en', {
  all: 'All',
  clearFilters: 'Clear filters',
  filteredResults: 'Showing {total} of {of} results',
  noFilterResults: 'No results match the current filters'
});

useI18n().mergeLocaleMessage('fr', {
  all: 'Tous',
  clearFilters: 'Effacer les filtres',
  filteredResults: 'Affichage de {total} sur {of} résultats',
  noFilterResults: 'Aucun résultat ne correspond aux filtres actuels'
});

const props = defineProps<{
  entityName: string;
  entityStore: Store;
}>();

const showModal = ref(false);
const entityToEdit = ref();

// État pour les filtres
const activeFilters = reactive<Record<string, string>>({});

// Calcul des filtres disponibles basés sur les entités parentes
const parentFilters = computed(() => {
  const filters: Array<{key: string, label: string, options: Array<{value: string, text: string}>}> = [];
  
  if (!props.entityStore.fieldList) return filters;
  
  // Chercher dans les entités parentes
  if ((props.entityStore as any).parentEntitiesStores) {
    (props.entityStore as any).parentEntitiesStores.forEach((parentStore: any, key: string) => {
      const field = props.entityStore.fieldList.get(key);
      if (field && parentStore && parentStore.entities && parentStore.entities.length > 0) {
        filters.push({
          key: key,
          label: field.label || t(`${translationKey}.${key}`),
          options: parentStore.selectDatas || []
        });
      }
    });
  }
  
  return filters;
});

// Entités filtrées
const filteredEntities = computed(() => {
  if (!hasActiveFilters.value) {
    return props.entityStore.entities || [];
  }
  
  return (props.entityStore.entities || []).filter((entity: any) => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      
      const entityValue = entity[key];
      
      // Gestion générique des relations many-to-many avec array d'IDs
      if (Array.isArray(entityValue)) {
        // Conversion en string pour être sûr de la comparaison
        return entityValue.includes(String(value));
      }
      
      // Relation simple (one-to-many classique)
      return String(entityValue) === String(value);
    });
  });
});

// Vérifier s'il y a des filtres actifs
const hasActiveFilters = computed(() => {
  return Object.values(activeFilters).some(value => value !== '');
});

// Fonction pour appliquer les filtres
function applyFilters() {
  // Les filtres sont automatiquement appliqués via la computed property filteredEntities
}

// Fonction pour effacer tous les filtres
function clearFilters() {
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key] = '';
  });
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
  getEntities(props.entityName, props.entityStore);
  
  // Charger les données des entités parentes
  if ((props.entityStore as any).parentEntitiesStores) {
    (props.entityStore as any).parentEntitiesStores.forEach((store: Store, key: string) => {
      getEntities(store.$id || key, store);
    });
  }
  
  // Charger les données des sous-entités
  if (props.entityStore.subEntitiesStores) {
    props.entityStore.subEntitiesStores.forEach((store: Store, key: string) => {
      getEntities(store.$id || key, store);
    });
  }
});

async function getEntities(entityName: string, store: Store) {
  try {
    const response = await axios.get(`/${entityName}`);

    store.entities = response.data || [];
    if (store.getSelectDatas) {
      store.selectDatas = store.getSelectDatas(store.entities);
    }
  } catch (error: any) {
    store.entities = [];
    store.selectDatas = [];
    console.error('Error while getting ' + entityName, error);
    switch (error.response?.status) {
      case 404:
        break;
      case 401:
        // L'intercepteur va déjà gérer la déconnexion automatique
        console.log('401 - L\'intercepteur va gérer la déconnexion');
        break;
      default:
        // Redirection vers login seulement pour les autres erreurs si nécessaire
        break;
    }
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
    getEntities(props.entityName, props.entityStore);
    
    // Exécuter le hook afterUpdate si défini (générique)
    if (props.entityStore.executeAfterUpdateHook) {
      const updatedEntity = props.entityStore.entities.find(e => e.id === data['id']);
      await props.entityStore.executeAfterUpdateHook(updatedEntity, data);
    }
    
    showModal.value = false;
  } catch (error) {
    console.error('Error while updating ' + props.entityName, error);
  }
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  width: 95%;
  margin: 30px 42px;
}

/* Messages d'état */
.active-filters-info {
  background: #f0f8ff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
}

.empty-state,
.no-results {
  text-align: center;
  padding: 20px;
}
</style>