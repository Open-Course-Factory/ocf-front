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
  <div class="entity-card">
    <!-- Display the entity name prominently if available -->
    <h2 v-if="props.entity.name" class="entity-name">
      <i class="fas fa-tag"></i> {{ props.entity.name }}
    </h2>

    <div class="entity-properties">
      <!-- Iterate over entity properties -->
      <div
        v-for="(value, key) in entity"
        :key="key"
        class="property"
      >
        <span v-if="shouldDisplayProperty(key)">
          <!-- If the property is a sub-entity, render it recursively -->
          <div v-if="isSubEntity(value)">
            <h3 class="subentity-title">
              <i class="fas fa-folder-open"></i> {{ t(`${translationKey}.${key}`) }}
            </h3>
            <EntityCard
              :entity="value"
              :entity-store="props.entityStore.subEntitiesStores.get(`${key}Id`)"
            />
          </div>
          <!-- Otherwise, display the property name and value -->
          <div v-else class="property-item">
            <span class="property-name">
              <i class="fas fa-info-circle"></i> {{ t(`${translationKey}.${key}`) }}:
            </span>
            <span class="property-value">{{ value }}</span>
          </div>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Store } from 'pinia';
import { getTranslationKey } from '../../utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const translationKey = computed(() => getTranslationKey(props.entityStore.$id || 'unknown'));

const props = defineProps<{
  entity: Record<string, any>;
  entityStore: Store;
}>();

function isSubEntity(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function shouldDisplayProperty(key: string) {
  const field =
    props.entityStore.fieldList.get(key) ||
    props.entityStore.fieldList.get(`${key}Id`);
  return field?.display ?? false;
}

// function checkDisplayParameters(index) {
//   let res = props.entityStore.fieldList.get(`${index.toString()}`) != undefined && props.entityStore.fieldList.get(`${index.toString()}`).display
//   res = res || props.entityStore.fieldList.get(`${index.toString()}Id`) != undefined && props.entityStore.fieldList.get(`${index.toString()}Id`).display
//   return res
// }

</script>

<style scoped>
.entity-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;
  width: 100%;
}

.entity-name {
  margin-bottom: 16px;
  font-size: 24px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.entity-properties {
  display: flex;
  flex-direction: column;
}

.property {
  margin-bottom: 12px;
}

.subentity-title {
  font-size: 20px;
  margin-bottom: 8px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-item {
  display: flex;
  align-items: center;
}

.property-name {
  font-weight: 600;
  margin-right: 8px;
  color: #444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-value {
  color: #666;
}

.property-item:not(:last-child) {
  margin-bottom: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>


