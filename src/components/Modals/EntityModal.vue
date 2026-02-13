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
  <BaseModal
    :visible="visible"
    :title="entity ? t('entityModal.modify') : t('entityModal.add')"
    :title-icon="entity ? 'fas fa-edit' : 'fas fa-plus'"
    size="large"
    :show-default-footer="true"
    :confirm-text="entity ? t('entityModal.buttonModify') : t('entityModal.buttonAdd')"
    confirm-icon="fas fa-save"
    :cancel-text="t('entityModal.buttonCancel')"
    cancel-icon="fas fa-ban"
    @close="closeModal"
    @confirm="handleEvent(entity ? 'modify' : 'submit')"
  >
    <div class="checkout-form">
      <template v-for="[name, field] of entityStore.fieldList" :key="name">
        <div v-if="field.type != 'subentity' && ((!entity && field.toBeSet) || (entity && field.toBeEdited))" class="form-group">
          <!-- Label (not shown for checkbox - handled inside wrapper) -->
          <label v-if="field.type !== 'checkbox'" :for="name">{{ field.label }}<span v-if="field.required" class="required-mark">*</span></label>

          <!-- Textarea -->
          <textarea
            v-if="field.type == 'textarea' || field.type == 'advanced-textarea'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Select -->
          <select
            v-else-if="field.type == 'select'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          >
            <option value="">{{ t('entityModal.selectOption') }}</option>
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.text }}
            </option>
          </select>

          <!-- Number -->
          <input
            v-else-if="field.type == 'number'"
            type="number"
            :id="name"
            v-model.number="data[name]"
            :min="field.min"
            :max="field.max"
            :step="field.step || 1"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Date -->
          <input
            v-else-if="field.type == 'date'"
            type="date"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <!-- Searchable Select -->
          <div v-else-if="field.type == 'searchable-select'" class="searchable-select-container">
            <input
              :id="name"
              v-model="searchQueries[name]"
              type="text"
              :class="['form-control', { 'is-invalid': errors[name] }]"
              :placeholder="field.placeholder || t('entityModal.searchPlaceholder')"
              @input="onSearchInput(name, field)"
              @focus="onSearchableFocus(name)"
              @blur="onSearchableBlur(name)"
              autocomplete="off"
            />
            <div v-if="showDropdown[name] && (searchResults[name]?.length > 0 || isSearching[name])" class="search-dropdown">
              <div v-if="isSearching[name]" class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                {{ t('entityModal.searching') }}
              </div>
              <div v-else-if="searchResults[name]?.length === 0 && searchQueries[name]?.trim()" class="search-empty">
                {{ t('entityModal.noResults') }}
              </div>
              <div
                v-for="(item, idx) in searchResults[name]"
                :key="item[field.itemValue || 'value'] || item.value || item.id || idx"
                class="search-result"
                @click="selectSearchableItem(name, item, field)"
              >
                <div class="search-result-text">
                  {{ item[field.itemText || 'label'] || item.label || item.text || item.display_name }}
                </div>
              </div>
            </div>
          </div>

          <!-- Checkbox -->
          <div v-else-if="field.type == 'checkbox'" class="checkbox-wrapper">
            <input
              type="checkbox"
              :id="name"
              v-model="data[name]"
              :class="['form-checkbox', { 'is-invalid': errors[name] }]"
            />
            <label :for="name" class="checkbox-label">{{ field.label }}<span v-if="field.required" class="required-mark">*</span></label>
          </div>

          <!-- Text Input (default) -->
          <input
            v-else-if="field.type == 'input'"
            :id="name"
            v-model="data[name]"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />

          <div v-if="errors[name]" class="invalid-feedback">
            {{ errors[name] }}
          </div>
        </div>
      </template>
      <div v-if="hasRequiredFields" class="required-legend">{{ t('entityModal.requiredLegend') }}</div>
      <div v-if="entityStore.subEntitiesStores.size > 0" v-for="[name, store] of entityStore.subEntitiesStores" class="form-group">
        <template v-if="entityStore.fieldList.get(name).toBeSet">
          <label :for="name">{{ name }}</label>
          <v-autocomplete
            label="Autocomplete"
            v-model="data[name]"
            :items="store.selectDatas"
            item-text="text"
            item-value="value"
            item-title="text"
            :class="['form-control', { 'is-invalid': errors[name] }]"
          />
        </template>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import { Store } from 'pinia';
import { useTranslations } from '../../composables/useTranslations';
import BaseModal from './BaseModal.vue';

const { t } = useTranslations({
  en: {
    entityModal: {
      modify: 'Modify',
      add: 'Add',
      selectOption: 'Select an option',
      buttonModify: 'Modify',
      buttonAdd: 'Add',
      buttonCancel: 'Cancel',
      fieldRequired: '{field} is required.',
      nameAlreadyUsed: 'This name is already used.',
      invalidNumber: 'Please enter a valid number.',
      numberTooSmall: 'Value must be at least {min}.',
      numberTooLarge: 'Value must be at most {max}.',
      searchPlaceholder: 'Search...',
      searching: 'Searching...',
      noResults: 'No results found',
      loading: 'Loading...',
      requiredLegend: '* Required field'
    }
  },
  fr: {
    entityModal: {
      modify: 'Modifier',
      add: 'Ajouter',
      selectOption: 'Sélectionner une option',
      buttonModify: 'Modifier',
      buttonAdd: 'Ajouter',
      buttonCancel: 'Annuler',
      fieldRequired: '{field} est requis.',
      nameAlreadyUsed: 'Ce nom est déjà utilisé.',
      invalidNumber: 'Veuillez entrer un nombre valide.',
      numberTooSmall: 'La valeur doit être au moins {min}.',
      numberTooLarge: 'La valeur doit être au plus {max}.',
      searchPlaceholder: 'Rechercher...',
      searching: 'Recherche en cours...',
      noResults: 'Aucun résultat trouvé',
      loading: 'Chargement...',
      requiredLegend: '* Champ obligatoire'
    }
  }
});

const data = reactive({});
const errors = reactive({});

// State for searchable-select fields
const searchQueries = reactive<Record<string, string>>({});
const searchResults = reactive<Record<string, any[]>>({});
const searchableOptions = reactive<Record<string, any[]>>({});
const isSearching = reactive<Record<string, boolean>>({});
const showDropdown = reactive<Record<string, boolean>>({});
const selectedItemText = reactive<Record<string, string>>({});

const props = defineProps<{
  visible: boolean;
  entity?: any;
  entityStore: Store;
  entityName: string;
}>();
const emit = defineEmits<{
  (e: 'submit', data: Record<string, string>): void;
  (e: 'modify', data: Record<string, string>): void;
  (e: 'close'): void;
}>();

const hasRequiredFields = computed(() => {
  for (const [, field] of props.entityStore.fieldList) {
    if (field.required && field.type !== 'subentity' &&
        ((!props.entity && field.toBeSet) || (props.entity && field.toBeEdited))) {
      return true
    }
  }
  return false
})

prepareNeededField();

function isFieldRequired(field: any): boolean {
  return field.required === true;
}

function validateFields() {
  let res = true;

  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      // Check if field is required and empty
      const isEmpty = value.type === 'checkbox'
        ? false // Checkboxes are never empty (they're boolean)
        : value.type === 'number'
        ? (data[key] === undefined || data[key] === null || data[key] === '')
        : (data[key]?.toString().trim() === '' || data[key] === undefined);

      if (isFieldRequired(value) && isEmpty) {
        errors[key] = t('entityModal.fieldRequired', { field: key });
        res = false;
      } else if (
        key === 'name' && // Only check uniqueness for 'name' field
        props.entityStore.entities.some(
          (storeEntity) => storeEntity.name === data[key]?.toString().trim() &&
          (!props.entity || storeEntity.id !== props.entity.id)
        )
      ) {
        errors[key] = t('entityModal.nameAlreadyUsed');
        res = false;
      } else if (value.type === 'number' && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        // Validate number constraints
        const num = Number(data[key]);
        if (isNaN(num)) {
          errors[key] = t('entityModal.invalidNumber');
          res = false;
        } else if (value.min !== undefined && num < value.min) {
          errors[key] = t('entityModal.numberTooSmall', { min: value.min });
          res = false;
        } else if (value.max !== undefined && num > value.max) {
          errors[key] = t('entityModal.numberTooLarge', { max: value.max });
          res = false;
        } else {
          errors[key] = null;
        }
      } else {
        errors[key] = null;
      }
    }
  });

  return res;
}

function formatFields() {
  Object.keys(data).forEach((key) => {
    if (props.entityStore.fieldList.get(key).type == 'advanced-textarea') {
      data[key] = data[key].split('\n');
    }
  });
}

function handleEvent(event) {
  if (validateFields()) {
    formatFields();
    if (props.entity) {
      data['id'] = props.entity['id'];
    } else {
      delete data['id'];
    }
    emit(event, { ...data });
    resetForm();
  }
}

function resetForm() {
  Object.keys(data).forEach((key) => {
    delete data[key];
  });
  Object.keys(errors).forEach((key) => {
    delete errors[key];
  });
}

function closeModal() {
  emit('close');
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    prepareNeededField();
    if (props.entity) {
      populateDataFromEntity();
    } else {
      resetForm();
    }
  }
});

function populateDataFromEntity() {
  props.entityStore.fieldList.forEach((value, key) => {
    if (value.toBeEdited) {
      if (value.type === 'advanced-textarea') {
        data[key] = props.entity[key]?.join('\n') || '';
      } else if (value.type === 'checkbox') {
        data[key] = props.entity[key] === true || props.entity[key] === 'true';
      } else if (value.type === 'number') {
        data[key] = props.entity[key] !== undefined ? Number(props.entity[key]) : '';
      } else if (value.type === 'searchable-select') {
        const entityValue = props.entity[key];
        data[key] = entityValue || null;
        // Set display text from loaded options
        if (entityValue && searchableOptions[key]) {
          selectedItemText[key] = getItemDisplayText(key, value, entityValue);
          searchQueries[key] = selectedItemText[key];
        }
      } else {
        data[key] = props.entity[key] || '';
      }
    }
  });
}

function prepareNeededField() {
  props.entityStore.fieldList.forEach((value, key) => {
    if ((!props.entity && value.toBeSet) || (props.entity && value.toBeEdited)) {
      // Initialize with appropriate default value based on type
      if (value.type === 'checkbox') {
        data[key] = false;
      } else if (value.type === 'number') {
        data[key] = value.min !== undefined ? value.min : '';
      } else if (value.type === 'searchable-select') {
        data[key] = null;
        searchQueries[key] = '';
        searchResults[key] = [];
        searchableOptions[key] = [];
        isSearching[key] = false;
        showDropdown[key] = false;
        selectedItemText[key] = '';
        // Load options if optionsLoader is provided
        if (value.optionsLoader) {
          loadSearchableOptions(key, value);
        }
      } else {
        data[key] = '';
      }
      errors[key] = null;
    }
  });

  if (props.entityStore.subEntitiesStores.size > 0) {
    props.entityStore.subEntitiesStores.forEach((_store, subKey) => {
      data[subKey] = '';
      errors[subKey] = null;
    });
  }
}

// Load options for searchable-select field
async function loadSearchableOptions(fieldName: string, fieldConfig: any) {
  if (!fieldConfig.optionsLoader) return;

  try {
    isSearching[fieldName] = true;
    const options = await fieldConfig.optionsLoader();
    searchableOptions[fieldName] = options;
    searchResults[fieldName] = options; // Initially show all options
  } catch (error) {
    console.error(`Failed to load options for ${fieldName}:`, error);
    searchableOptions[fieldName] = [];
    searchResults[fieldName] = [];
  } finally {
    isSearching[fieldName] = false;
  }
}

// Handle search input for searchable-select field
async function onSearchInput(fieldName: string, fieldConfig: any) {
  const query = searchQueries[fieldName]?.trim() || '';

  // If using searchFunction, call it
  if (fieldConfig.searchFunction) {
    if (query.length < 2) {
      searchResults[fieldName] = [];
      return;
    }

    isSearching[fieldName] = true;
    try {
      const results = await fieldConfig.searchFunction(query);
      searchResults[fieldName] = results;
    } catch (error) {
      console.error(`Search error for ${fieldName}:`, error);
      searchResults[fieldName] = [];
    } finally {
      isSearching[fieldName] = false;
    }
  } else {
    // Filter local options
    const options = searchableOptions[fieldName] || [];
    if (query.length === 0) {
      searchResults[fieldName] = options;
    } else {
      const itemText = fieldConfig.itemText || 'label';
      searchResults[fieldName] = options.filter((option: any) => {
        const text = option[itemText] || option.label || option.text || '';
        return text.toLowerCase().includes(query.toLowerCase());
      });
    }
  }
}

// Select an item from searchable-select dropdown
function selectSearchableItem(fieldName: string, item: any, fieldConfig: any) {
  const itemValue = fieldConfig.itemValue || 'value';
  const itemText = fieldConfig.itemText || 'label';

  data[fieldName] = item[itemValue] || item.value || item.id;
  selectedItemText[fieldName] = item[itemText] || item.label || item.text || item.display_name || '';
  searchQueries[fieldName] = selectedItemText[fieldName];
  showDropdown[fieldName] = false;
}

// Handle focus on searchable-select field
function onSearchableFocus(fieldName: string) {
  showDropdown[fieldName] = true;
  // Show all options if no search query
  const fieldConfig = props.entityStore.fieldList.get(fieldName);
  if (!searchQueries[fieldName] && fieldConfig) {
    searchResults[fieldName] = searchableOptions[fieldName] || [];
  }
}

// Handle blur on searchable-select field
function onSearchableBlur(fieldName: string) {
  // Delay hiding dropdown to allow click events to fire
  setTimeout(() => {
    showDropdown[fieldName] = false;
  }, 200);
}

// Get display text for a selected value
function getItemDisplayText(fieldName: string, fieldConfig: any, value: any): string {
  if (!value) return '';

  const options = searchableOptions[fieldName] || [];
  const itemValue = fieldConfig.itemValue || 'value';
  const itemText = fieldConfig.itemText || 'label';

  const item = options.find((opt: any) => (opt[itemValue] || opt.value || opt.id) === value);
  return item ? (item[itemText] || item.label || item.text || item.display_name || '') : '';
}
</script>

<style scoped>
.checkout-form {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:first-child {
  margin-top: 0;
}

.form-group:last-child {
  margin-bottom: 0;
}

textarea {
  height: 250px;
}

/* Checkbox styles */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

/* Required field indicators */
.required-mark {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.required-legend {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}

/* Number input styles */
input[type="number"] {
  max-width: 200px;
}

/* Date input styles */
input[type="date"] {
  max-width: 250px;
}

/* Searchable Select styles */
.searchable-select-container {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-medium);
  border-top: none;
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: var(--shadow-md);
  margin-top: -1px;
}

.search-loading,
.search-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.search-loading i {
  margin-right: var(--spacing-xs);
}

.search-result {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-fast);
}

.search-result:hover {
  background-color: var(--color-bg-secondary);
}

.search-result:last-child {
  border-bottom: none;
}

.search-result-text {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
</style>
