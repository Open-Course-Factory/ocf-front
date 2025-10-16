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
    <!-- Card Header with entity name/title -->
    <div class="entity-card-header" v-if="displayName || props.entity.name">
      <div class="entity-icon">
        <i :class="getEntityIcon()"></i>
      </div>
      <div class="entity-title-section">
        <h3 class="entity-title">{{ displayName || props.entity.name }}</h3>
        <p class="entity-subtitle" v-if="displaySubtitle">{{ displaySubtitle }}</p>
      </div>
      <div class="entity-badges" v-if="statusBadges.length > 0">
        <span
          v-for="badge in statusBadges"
          :key="badge.key"
          :class="['status-badge', badge.type]"
        >
          <i :class="badge.icon"></i> {{ badge.label }}
        </span>
      </div>
    </div>

    <!-- Card Body with properties grid -->
    <div class="entity-card-body">
      <dl class="property-grid">
        <template
          v-for="(value, key) in entity"
          :key="key"
        >
          <template v-if="shouldDisplayProperty(key) && !isSubEntity(value)">
            <dt class="property-label">
              <i :class="getFieldIcon(key)"></i>
              <span>{{ t(`${translationKey}.${key}`) }}</span>
            </dt>
            <dd :class="['property-value', getFieldClass(key, value)]">
              <span v-if="isBooleanField(key, value)" :class="['boolean-badge', value ? 'true' : 'false']">
                <i :class="value ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                {{ value ? t('common.yes') : t('common.no') }}
              </span>
              <span v-else-if="isDateField(key)" class="date-value">
                <i class="far fa-calendar"></i>
                {{ getDisplayValue(key, value) }}
              </span>
              <span v-else>{{ getDisplayValue(key, value) }}</span>
            </dd>
          </template>

          <!-- Sub-entities in separate section -->
          <template v-if="shouldDisplayProperty(key) && isSubEntity(value)">
            <dt class="subentity-header" colspan="2">
              <i class="fas fa-folder-open"></i>
              {{ t(`${translationKey}.${key}`) }}
            </dt>
            <dd class="subentity-container" colspan="2">
              <EntityCard
                :entity="value"
                :entity-store="props.entityStore.subEntitiesStores.get(`${key}Id`)"
              />
            </dd>
          </template>
        </template>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Store } from 'pinia';
import { getTranslationKey } from '../../utils';
import { formatDateTime, formatCurrency, formatStorageSize, formatDuration, formatNumber } from '../../utils/formatters';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const translationKey = computed(() => getTranslationKey(props.entityStore.$id || 'unknown'));

const props = defineProps<{
  entity: Record<string, any>;
  entityStore: Store;
}>();

// Computed properties for card header
const displayName = computed(() => {
  return props.entity.display_name || props.entity.title || props.entity.name || null;
});

const displaySubtitle = computed(() => {
  // Show description or ID as subtitle if available
  if (props.entity.description && props.entity.description.length < 100) {
    return props.entity.description;
  }
  if (props.entity.id) {
    return `ID: ${props.entity.id}`;
  }
  return null;
});

// Status badges for important boolean/status fields
const statusBadges = computed(() => {
  const badges: Array<{ key: string, label: string, type: string, icon: string }> = [];

  if (props.entity.is_active !== undefined) {
    badges.push({
      key: 'is_active',
      label: props.entity.is_active ? t('common.active') : t('common.inactive'),
      type: props.entity.is_active ? 'success' : 'muted',
      icon: props.entity.is_active ? 'fas fa-check-circle' : 'fas fa-times-circle'
    });
  }

  if (props.entity.is_expired !== undefined && props.entity.is_expired) {
    badges.push({
      key: 'is_expired',
      label: t('common.expired'),
      type: 'danger',
      icon: 'fas fa-exclamation-triangle'
    });
  }

  if (props.entity.is_full !== undefined && props.entity.is_full) {
    badges.push({
      key: 'is_full',
      label: t('common.full'),
      type: 'warning',
      icon: 'fas fa-users'
    });
  }

  return badges;
});

function isSubEntity(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function shouldDisplayProperty(key: string) {
  // If fieldList is not available, show basic properties but exclude technical fields
  if (!props.entityStore.fieldList) {
    const excludedFields = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'];
    return !excludedFields.includes(key);
  }

  const field =
    props.entityStore.fieldList.get(key) ||
    props.entityStore.fieldList.get(`${key}Id`);
  return field?.display ?? false;
}

function getDisplayValue(key: string, value: any) {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return '-';
  }

  // If fieldList exists, check for custom formatter first
  if (props.entityStore.fieldList) {
    const field =
      props.entityStore.fieldList.get(key) ||
      props.entityStore.fieldList.get(`${key}Id`);

    // If field has a displayValue function, use it (takes precedence)
    if (field?.displayValue && typeof field.displayValue === 'function') {
      return field.displayValue(value);
    }
  }

  // Auto-format based on field name patterns

  // Date/time fields
  if (isDateField(key)) {
    return formatDateTime(value);
  }

  // Currency fields (assumed to be in cents)
  if (isCurrencyField(key) && typeof value === 'number') {
    // Detect currency from field name or entity
    const currency = props.entity.currency || 'EUR';
    return formatCurrency(value, currency);
  }

  // Storage size fields
  if (isStorageField(key) && typeof value === 'number') {
    // Check if field name indicates GB (already in GB, not bytes)
    if (key.includes('_gb')) {
      return `${value} GB`;
    }
    // Otherwise assume bytes and convert
    return formatStorageSize(value);
  }

  // Duration fields
  if (isDurationField(key) && typeof value === 'number') {
    // Check if field name indicates minutes
    if (key.includes('_minutes')) {
      return formatDuration(value * 60); // Convert minutes to seconds
    }
    // Otherwise assume seconds
    return formatDuration(value);
  }

  // Count/number fields with thousand separators
  if (isCountField(key) && typeof value === 'number') {
    return formatNumber(value);
  }

  // Otherwise return the original value
  return value;
}

// Get icon for entity type (from store or default)
function getEntityIcon(): string {
  const storeName = props.entityStore.$id || '';

  // Icon mapping based on store name
  const iconMap: Record<string, string> = {
    'classGroups': 'fas fa-users',
    'groupMembers': 'fas fa-user-friends',
    'courses': 'fas fa-book',
    'terminals': 'fas fa-terminal',
    'subscriptions': 'fas fa-credit-card',
    'invoices': 'fas fa-file-invoice-dollar',
    'sshKeys': 'fas fa-key',
  };

  return iconMap[storeName] || 'fas fa-cube';
}

// Get icon for specific field types
function getFieldIcon(key: string): string {
  // Date/time fields
  if (isDateField(key)) {
    return 'far fa-calendar';
  }

  // Currency/price fields
  if (isCurrencyField(key)) {
    return 'fas fa-euro-sign';
  }

  // Storage size fields
  if (isStorageField(key)) {
    return 'fas fa-database';
  }

  // Duration fields
  if (isDurationField(key)) {
    return 'far fa-clock';
  }

  // Count/number fields
  if (isCountField(key)) {
    return 'fas fa-sort-numeric-up';
  }

  // Boolean fields
  if (key.startsWith('is_') || key.includes('active') || key.includes('enabled')) {
    return 'fas fa-toggle-on';
  }

  // ID/reference fields
  if (key.includes('_id') || key === 'id') {
    return 'fas fa-hashtag';
  }

  // User/owner fields
  if (key.includes('user') || key.includes('owner') || key.includes('invited')) {
    return 'fas fa-user';
  }

  // Description/text fields
  if (key.includes('description') || key.includes('name')) {
    return 'fas fa-align-left';
  }

  // Default icon
  return 'fas fa-info-circle';
}

// Get CSS class for field values
function getFieldClass(key: string, value: any): string {
  const classes: string[] = [];

  if (isBooleanField(key, value)) {
    classes.push('boolean-field');
  }

  if (isDateField(key)) {
    classes.push('date-field');
  }

  if (isCurrencyField(key)) {
    classes.push('currency-field');
  }

  if (isStorageField(key)) {
    classes.push('storage-field');
  }

  if (isDurationField(key)) {
    classes.push('duration-field');
  }

  if (isCountField(key)) {
    classes.push('count-field');
  }

  if (typeof value === 'number') {
    classes.push('number-field');
  }

  return classes.join(' ');
}

// Check if field is boolean
function isBooleanField(key: string, value: any): boolean {
  return typeof value === 'boolean' ||
         (key.startsWith('is_') && (value === true || value === false));
}

// Check if field is a date
function isDateField(key: string): boolean {
  return key.includes('_at') ||
         key.includes('date') ||
         key === 'expires_at' ||
         key === 'joined_at';
}

// Check if field is a currency/price field
function isCurrencyField(key: string): boolean {
  return key.includes('price') ||
         key.includes('amount') ||
         key.includes('cost') ||
         key === 'total' ||
         key === 'subtotal';
}

// Check if field is a storage size field
function isStorageField(key: string): boolean {
  return key.includes('_gb') ||
         key.includes('_mb') ||
         key.includes('_bytes') ||
         key.includes('storage') ||
         key.includes('size');
}

// Check if field is a duration field (in minutes or seconds)
function isDurationField(key: string): boolean {
  return key.includes('duration') ||
         key.includes('_minutes') ||
         key.includes('_seconds') ||
         key.includes('timeout');
}

// Check if field is a count/number field that should have thousand separators
function isCountField(key: string): boolean {
  return key.includes('count') ||
         key.includes('number') ||
         key.includes('max_') ||
         key.includes('limit') ||
         key.includes('total_');
}
</script>

<style scoped>
/* === ENTITY CARD CONTAINER === */
.entity-card {
  background: var(--color-bg-primary);
  border: none;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-base);
  animation: fadeIn 0.3s ease-in-out;
  width: 100%;
}

.entity-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

/* === CARD HEADER === */
.entity-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
}

.entity-card-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--color-primary);
}

.entity-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.entity-title-section {
  flex: 1;
  min-width: 0;
}

.entity-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-subtitle {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.status-badge.success {
  background-color: transparent;
  color: var(--color-success);
}

.status-badge.danger {
  background-color: transparent;
  color: var(--color-danger);
}

.status-badge.warning {
  background-color: transparent;
  color: var(--color-warning);
}

.status-badge.muted {
  background-color: transparent;
  color: var(--color-text-muted);
}

.status-badge i {
  font-size: var(--font-size-xs);
}

/* === CARD BODY === */
.entity-card-body {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-primary);
}

/* === PROPERTY GRID (Definition List) === */
.property-grid {
  display: grid;
  grid-template-columns: minmax(180px, auto) 1fr;
  gap: var(--spacing-sm) var(--spacing-lg);
  margin: 0;
}

.property-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) 0;
  margin: 0;
}

.property-label i {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  width: 16px;
  text-align: center;
}

.property-value {
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  padding: var(--spacing-xs) 0;
  margin: 0;
}

/* === SPECIAL FIELD TYPES === */

/* Boolean fields */
.boolean-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-base);
}

.boolean-badge.true {
  color: var(--color-success);
}

.boolean-badge.false {
  color: var(--color-text-muted);
}

.boolean-badge i {
  font-size: var(--font-size-sm);
}

/* Date fields */
.date-value {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-primary);
}

.date-value i {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Number fields */
.number-field {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

/* Currency fields */
.currency-field {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
  color: var(--color-success-text);
}

/* Storage size fields */
.storage-field {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
  color: var(--color-info-text);
}

/* Duration fields */
.duration-field {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* Count fields */
.count-field {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

/* === SUB-ENTITIES === */
.subentity-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  padding: var(--spacing-md) 0 var(--spacing-sm) 0;
  margin-top: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.subentity-header i {
  color: var(--color-primary);
}

.subentity-container {
  grid-column: 1 / -1;
  margin: 0;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
}

.subentity-container .entity-card {
  box-shadow: none;
  border: none;
}

.subentity-container .entity-card:hover {
  transform: none;
}

/* === ANIMATIONS === */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .property-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .property-label {
    padding-bottom: var(--spacing-xs);
  }

  .property-value {
    margin-top: 0;
  }

  .entity-card-header {
    flex-wrap: wrap;
  }

  .entity-badges {
    width: 100%;
    margin-top: var(--spacing-sm);
  }

  .entity-icon {
    width: 40px;
    height: 40px;
    min-width: 40px;
    font-size: var(--font-size-lg);
  }

  .entity-title {
    font-size: var(--font-size-lg);
  }
}
</style>


