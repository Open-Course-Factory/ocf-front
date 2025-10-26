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
  <div class="top-menu">
    <div class="left-controls">
      <button class="menu-toggle" @click="toggleMenu">
        <i class="fas fa-bars"></i>
      </button>
      <h1 class="app-title">
        <a href="#" @click.prevent="navigateToHome">
          <i class="fas fa-book"></i>
          <span>OCF</span>
        </a>
      </h1>
    </div>
    <div class="right-controls">
      <div class="locale-changer">
        <select :value="currentLocale" @change="handleLocaleChange" class="flag-select">
          <option v-for="localeCode in supportedLocales" :key="`locale-${localeCode}`" :value="localeCode">
            {{ getLocaleInfo(localeCode).flag }} {{ getLocaleInfo(localeCode).name }}
          </option>
        </select>
      </div>
      <!-- Admin View Mode Toggle -->
      <div v-if="isAdmin" class="view-mode-toggle" :title="viewAsStandardUser ? t('topMenu.viewingAsUser') : t('topMenu.viewingAsAdmin')">
        <button
          class="toggle-button"
          :class="{ active: viewAsStandardUser }"
          @click="toggleViewMode"
        >
          <i :class="viewAsStandardUser ? 'fas fa-user' : 'fas fa-user-shield'"></i>
          <span class="toggle-text">{{ viewAsStandardUser ? t('topMenu.userView') : t('topMenu.adminView') }}</span>
        </button>
      </div>
      <div class="user-menu" ref="userMenuRef">
        <button class="user-info" @click="toggleUserMenu">
          <div class="profile-picture">
            <i class="fas fa-user"></i>
          </div>
          <p>{{ currentUser.userDisplayName || currentUser.userName }}</p>
          <i class="fas fa-chevron-down chevron-icon" :class="{ rotated: isUserMenuOpen }"></i>
        </button>
        <div v-if="isUserMenuOpen" class="user-dropdown">
          <div class="dropdown-user-header">
            <div class="user-name">@{{ currentUser.userName }}</div>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-section">
            <div class="dropdown-section-title">{{ t('topMenu.account') }}</div>
            <router-link to="/settings/navigation" class="dropdown-item" @click="closeUserMenu">
              <i class="fas fa-cog"></i>
              <span>{{ t('topMenu.settings') }}</span>
            </router-link>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-section">
            <div class="dropdown-section-title">{{ t('topMenu.billingPayment') }}</div>
            <router-link to="/payment-methods" class="dropdown-item" @click="closeUserMenu">
              <i class="fas fa-credit-card"></i>
              <span>{{ t('topMenu.paymentMethods') }}</span>
            </router-link>
            <router-link to="/billing-addresses" class="dropdown-item" @click="closeUserMenu">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ t('topMenu.billingAddresses') }}</span>
            </router-link>
            <router-link to="/invoices" class="dropdown-item" @click="closeUserMenu">
              <i class="fas fa-file-invoice-dollar"></i>
              <span>{{ t('topMenu.invoices') }}</span>
            </router-link>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item disconnect-item" @click="handleDisconnect">
            <i class="fas fa-sign-out-alt"></i>
            <span>{{ t('topMenu.disconnect') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslations } from '../../composables/useTranslations';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useUserSettingsStore } from '../../stores/userSettings.ts';
import { useLocale } from '../../composables/useLocale';
import { useFeatureFlags } from '../../composables/useFeatureFlags';
import { useAdminViewMode } from '../../composables/useAdminViewMode';

const { t } = useTranslations({
  en: {
    topMenu: {
      account: 'Account',
      settings: 'Settings',
      billingPayment: 'Billing & Payment',
      paymentMethods: 'Payment Methods',
      billingAddresses: 'Billing Addresses',
      invoices: 'Invoices',
      disconnect: 'Disconnect',
      adminView: 'Admin',
      userView: 'User',
      viewingAsAdmin: 'Viewing as admin (all data)',
      viewingAsUser: 'Viewing as standard user (filtered data)'
    }
  },
  fr: {
    topMenu: {
      account: 'Compte',
      settings: 'Paramètres',
      billingPayment: 'Facturation et Paiement',
      paymentMethods: 'Moyens de paiement',
      billingAddresses: 'Adresses de facturation',
      invoices: 'Factures',
      disconnect: 'Déconnexion',
      adminView: 'Admin',
      userView: 'Utilisateur',
      viewingAsAdmin: 'Vue administrateur (toutes les données)',
      viewingAsUser: 'Vue utilisateur standard (données filtrées)'
    }
  }
})

const router = useRouter();
const currentUser = useCurrentUserStore();
const settingsStore = useUserSettingsStore();
const { currentLocale, supportedLocales, setLocale, getLocaleInfo } = useLocale();
const { isEnabled } = useFeatureFlags();
const { isAdmin, viewAsStandardUser, toggleViewMode: toggleViewModeComposable, initViewMode } = useAdminViewMode();

const emit = defineEmits(['toggle-menu']);

const isUserMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

function toggleViewMode() {
  toggleViewModeComposable();
}

function toggleMenu() {
  emit('toggle-menu');
}

function handleLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  setLocale(target.value);
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
}

function handleDisconnect() {
  closeUserMenu();
  currentUser.logout();
  // Router redirect is handled by logout() action
}

async function navigateToHome() {
  try {
    // Load user settings to get default landing page
    const settings = await settingsStore.loadSettings();
    let landingPage = settings.default_landing_page;

    // If user has a landing page preference, validate it's enabled
    if (landingPage) {
      // Check if the landing page requires a feature that's disabled
      if (landingPage === '/courses' && !isEnabled('course_conception')) {
        landingPage = null; // Reset to find alternative
      }
      if (landingPage?.startsWith('/terminal') && !isEnabled('terminal_management')) {
        landingPage = null; // Reset to find alternative
      }
    }

    // If no valid landing page, find first available enabled route
    if (!landingPage) {
      // Priority order: dashboard > terminals > courses
      if (isEnabled('terminal_management')) {
        landingPage = '/subscription-dashboard';
      } else if (isEnabled('course_conception')) {
        landingPage = '/courses';
      } else {
        // Fallback to subscription dashboard (always available)
        landingPage = '/subscription-dashboard';
      }
    }

    router.push(landingPage);
  } catch (error) {
    console.error('Error loading default landing page:', error);
    // Fallback to subscription dashboard
    router.push('/subscription-dashboard');
  }
}

function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    closeUserMenu();
  }
}

// Register event listeners
onMounted(() => {
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
  // Initialize admin view mode from localStorage
  initViewMode();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.top-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  background-color: var(--color-bg-primary);
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-index-modal);
  padding: 0 var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  animation: slideDown var(--transition-slow) ease-in-out;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.menu-toggle {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-text-primary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base), color var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.menu-toggle:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.app-title a {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color var(--transition-base);
}

.app-title a:hover {
  color: var(--color-primary);
}

.app-title i {
  font-size: var(--font-size-lg);
}

.right-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.locale-changer select {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
  min-width: 140px;
}

.locale-changer select:hover {
  border-color: var(--color-border-dark);
}

.locale-changer select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.flag-select option {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.view-mode-toggle {
  display: flex;
  align-items: center;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.toggle-button:hover {
  border-color: var(--color-primary);
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.toggle-button.active {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.toggle-button.active:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.toggle-button i {
  font-size: var(--font-size-base);
}

.toggle-text {
  font-size: var(--font-size-sm);
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  color: var(--color-text-primary);
  background: none;
  border: none;
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-base);
}

.user-info:hover {
  background-color: var(--color-bg-secondary);
}

.user-info p {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.profile-picture {
  width: 36px;
  height: 36px;
  background-color: var(--color-primary);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  flex-shrink: 0;
}

.profile-picture i {
  font-size: var(--font-size-base);
}

.chevron-icon {
  font-size: var(--font-size-xs);
  transition: transform var(--transition-base);
  margin-left: var(--spacing-xs);
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 280px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: var(--z-index-dropdown);
  animation: dropdownSlideIn var(--transition-fast) ease-out;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-base), color var(--transition-base);
  font-size: var(--font-size-sm);
}

.dropdown-item:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dropdown-item i {
  width: 18px;
  text-align: center;
  font-size: var(--font-size-base);
}

.dropdown-section {
  padding: var(--spacing-xs) 0;
}

.dropdown-section-title {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-xs) 0;
}

.disconnect-item {
  color: var(--color-danger);
}

.disconnect-item:hover {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.disconnect-item:hover i {
  color: var(--color-white);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.dropdown-user-header {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
