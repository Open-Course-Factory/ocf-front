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
          <AlphaBadge size="medium" />
        </a>
      </h1>
    </div>
    <div class="right-controls">
      <LanguageSelector />
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

          <!-- Organization Section -->
          <div class="dropdown-divider"></div>
          <div class="dropdown-section">
            <div class="dropdown-section-title">{{ t('topMenu.organization') }}</div>

            <!-- Current org display (always shown) -->
            <div v-if="currentOrganization" class="current-organization-info" :class="{ 'org-switchable': userOrganizations.length > 1 }">
              <div class="org-icon" :class="currentOrganization.organization_type === 'personal' ? 'org-icon-personal' : 'org-icon-team'">
                <i :class="currentOrganization.organization_type === 'personal' ? 'fas fa-user' : 'fas fa-building'"></i>
              </div>
              <div class="org-details">
                <div class="org-name">{{ currentOrganization.display_name || currentOrganization.name }}</div>
                <div class="org-type">
                  {{ currentOrganization.organization_type === 'personal' ? t('topMenu.personalOrg') : t('topMenu.teamOrg') }}
                </div>
              </div>
              <!-- Switch button (only if multiple orgs) -->
              <button
                v-if="userOrganizations.length > 1"
                class="org-switch-btn"
                @click.stop="toggleOrgSwitcher"
                :title="t('topMenu.switchOrganization')"
              >
                <i class="fas fa-exchange-alt"></i>
              </button>
            </div>

            <!-- Org switcher flyout (nested dropdown) -->
            <div v-if="isOrgSwitcherOpen" class="org-switcher-flyout">
              <div class="org-switcher-header">{{ t('topMenu.switchOrganization') }}</div>
              <div class="org-switcher-list">
                <button
                  v-for="org in userOrganizations"
                  :key="org.id"
                  class="org-switcher-item"
                  :class="{ 'org-active': currentOrganization?.id === org.id }"
                  @click="switchOrganization(org.id)"
                >
                  <div class="org-icon org-icon-sm" :class="org.organization_type === 'personal' ? 'org-icon-personal' : 'org-icon-team'">
                    <i :class="org.organization_type === 'personal' ? 'fas fa-user' : 'fas fa-building'"></i>
                  </div>
                  <div class="org-details">
                    <div class="org-name">{{ org.display_name || org.name }}</div>
                    <div class="org-type">{{ org.organization_type === 'personal' ? t('topMenu.personalOrg') : t('topMenu.teamOrg') }}</div>
                  </div>
                  <i v-if="currentOrganization?.id === org.id" class="fas fa-check org-check"></i>
                </button>
              </div>
            </div>

            <router-link to="/organizations" class="dropdown-item dropdown-item-highlighted" @click="closeUserMenu">
              <i class="fas fa-building"></i>
              <span>{{ hasTeamOrganizations ? t('topMenu.manageOrganizations') : t('topMenu.learnAboutOrganizations') }}</span>
            </router-link>
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
          <div class="dropdown-section">
            <div class="dropdown-section-title">
              {{ t('topMenu.about') }}
              <AlphaBadge size="small" />
            </div>
            <div class="version-details">
              <div class="version-row">
                <span class="version-label">{{ t('topMenu.frontend') }}:</span>
                <span class="version-value">v{{ versions.frontend }}</span>
              </div>
              <div class="version-row">
                <span class="version-label">{{ t('topMenu.api') }}:</span>
                <span class="version-value">v{{ versions.api }}</span>
              </div>
              <div class="version-row">
                <span class="version-label">{{ t('topMenu.terminalTrainer') }}:</span>
                <span class="version-value">v{{ versions.terminalTrainer }}</span>
              </div>
            </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslations } from '../../composables/useTranslations';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useUserSettingsStore } from '../../stores/userSettings.ts';
import { useOrganizationsStore } from '../../stores/organizations.ts';
import { useFeatureFlags } from '../../composables/useFeatureFlags';
import { useAdminViewMode } from '../../composables/useAdminViewMode';
import { useVersionInfo } from '../../composables/useVersionInfo';
import AlphaBadge from '../Common/AlphaBadge.vue';
import LanguageSelector from '../UI/LanguageSelector.vue';

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
      viewingAsUser: 'Viewing as standard user (filtered data)',
      organization: 'Organization',
      personalOrg: 'Personal',
      teamOrg: 'Team',
      switchOrganization: 'Switch Organization',
      manageOrganizations: 'Manage Organizations',
      learnAboutOrganizations: 'Learn About Organizations',
      about: 'About',
      frontend: 'Frontend',
      api: 'API',
      terminalTrainer: 'Terminal Trainer'
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
      viewingAsUser: 'Vue utilisateur standard (données filtrées)',
      organization: 'Organisation',
      personalOrg: 'Personnel',
      teamOrg: 'Équipe',
      switchOrganization: 'Changer d\'organisation',
      manageOrganizations: 'Gérer les organisations',
      learnAboutOrganizations: 'En savoir plus sur les organisations',
      about: 'À propos',
      frontend: 'Interface',
      api: 'API',
      terminalTrainer: 'Terminal Trainer'
    }
  }
})

const router = useRouter();
const currentUser = useCurrentUserStore();
const settingsStore = useUserSettingsStore();
const organizationsStore = useOrganizationsStore();
const { isEnabled } = useFeatureFlags();
const { isAdmin, viewAsStandardUser, toggleViewMode: toggleViewModeComposable, initViewMode } = useAdminViewMode();
const { versions } = useVersionInfo();

// Organization computed properties
const currentOrganization = computed(() => organizationsStore.currentOrganization);
const userOrganizations = computed(() => organizationsStore.userOrganizations);
const hasTeamOrganizations = computed(() =>
  organizationsStore.businessOrganizations.length > 0 ||
  userOrganizations.value.length > 1
);

const emit = defineEmits(['toggle-menu']);

const isUserMenuOpen = ref(false);
const isOrgSwitcherOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

function toggleViewMode() {
  toggleViewModeComposable();
}

function toggleMenu() {
  emit('toggle-menu');
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
  isOrgSwitcherOpen.value = false;
}

function toggleOrgSwitcher() {
  isOrgSwitcherOpen.value = !isOrgSwitcherOpen.value;
}

function switchOrganization(orgId: string) {
  organizationsStore.setCurrentOrganization(orgId);
  isOrgSwitcherOpen.value = false;
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
onMounted(async () => {
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
  // Initialize admin view mode from localStorage
  initViewMode();
  // Load organizations for the switcher
  try {
    await organizationsStore.loadOrganizations();
  } catch (error) {
    console.error('Failed to load organizations:', error);
  }
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

.app-title .alpha-badge {
  margin-left: var(--spacing-sm);
}

.right-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
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
  max-width: calc(100vw - 2 * var(--spacing-lg));
  max-height: calc(100vh - 70px);
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
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
  position: relative;
}

.dropdown-section-title {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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

/* Organization Section Styles */
.current-organization-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  margin: 0 var(--spacing-lg) var(--spacing-sm) var(--spacing-lg);
}

.org-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.org-icon-personal {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.2) 100%);
  color: var(--color-primary);
}

.org-icon-team {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.2) 100%);
  color: var(--color-success);
}

.org-icon i {
  font-size: var(--font-size-base);
}

.org-details {
  flex: 1;
  min-width: 0;
}

.org-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-type {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

/* Org switcher styles */
.org-switchable {
  cursor: default;
}

.org-switch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-base);
  font-size: var(--font-size-xs);
}

.org-switch-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.org-switcher-flyout {
  position: absolute;
  right: calc(100% + var(--spacing-xs));
  top: 0;
  min-width: 260px;
  max-height: 320px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  animation: flyoutSlideIn var(--transition-fast) ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes flyoutSlideIn {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.org-switcher-header {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  flex-shrink: 0;
}

.org-switcher-list {
  overflow-y: auto;
  padding: var(--spacing-xs);
}

.org-switcher-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-base);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.org-switcher-item:hover {
  background-color: var(--color-bg-secondary);
}

.org-switcher-item.org-active {
  background-color: var(--color-bg-secondary);
}

.org-icon-sm {
  width: 32px;
  height: 32px;
}

.org-check {
  margin-left: auto;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.dropdown-item-highlighted {
  background-color: rgba(59, 130, 246, 0.05);
  border-left: 3px solid var(--color-primary);
}

.dropdown-item-highlighted:hover {
  background-color: rgba(59, 130, 246, 0.1);
  border-left-color: var(--color-primary-hover);
}

/* Version Details Styles */
.version-details {
  padding: var(--spacing-sm) var(--spacing-lg);
}

.version-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.version-label {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.version-value {
  color: var(--color-text-primary);
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-xs);
  background-color: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
}
</style>
