<template>
  <div class="main-menu" :class="{ collapsed: isMenuCollapsed }">
    <nav class="menu-nav">
      <div class="menu-top">
        <ul>
          <NavCategory
            v-for="category in filteredTopCategories"
            :key="category.key"
            :categoryKey="category.key"
            :label="category.label"
            :icon="category.icon"
            :expanded="expandedCategories[category.key]"
            :hasActiveItem="isCategoryActive[category.key]"
            :collapsed="isMenuCollapsed ?? false"
            :disabled="category.disabled"
            :disabledTooltip="category.disabledTooltip"
            :popupStyle="isMenuCollapsed && menuPositions[category.key] ? {
              top: menuPositions[category.key].top + 'px',
              left: menuPositions[category.key].left + 'px'
            } : undefined"
            @toggle="toggleCategory"
          >
            <NavMenuItem
              v-for="item in category.items"
              :key="item.route"
              :to="item.disabled ? '' : item.route"
              :label="item.label"
              :icon="item.icon"
              :tooltip="isMenuCollapsed ? item.title : ''"
              :disabled="category.disabled"
              @click="handleMenuItemClick"
            />
          </NavCategory>
        </ul>
      </div>
      <div class="menu-bottom" :class="{ 'bottom-collapsed': isBottomCollapsed }">
        <div class="menu-bottom-toggle" @click="isBottomCollapsed = !isBottomCollapsed">
          <span v-if="!isMenuCollapsed" class="menu-bottom-toggle-label">{{ t('navigation.more') }}</span>
          <i class="fas fa-chevron-up menu-bottom-toggle-icon" :class="{ rotated: isBottomCollapsed }"></i>
        </div>
        <ul v-show="!isBottomCollapsed">
          <NavCategory
            v-for="category in filteredBottomCategories"
            :key="category.key"
            :categoryKey="category.key"
            :label="category.label"
            :icon="category.icon"
            :expanded="expandedCategories[category.key]"
            :hasActiveItem="isCategoryActive[category.key]"
            :collapsed="isMenuCollapsed ?? false"
            :disabled="category.disabled"
            :disabledTooltip="category.disabledTooltip"
            :popupStyle="isMenuCollapsed && menuPositions[category.key] ? {
              top: menuPositions[category.key].top + 'px',
              left: menuPositions[category.key].left + 'px'
            } : undefined"
            @toggle="toggleCategory"
          >
            <NavMenuItem
              v-for="item in category.items"
              :key="item.route"
              :to="item.disabled ? '' : item.route"
              :label="item.label"
              :icon="item.icon"
              :tooltip="isMenuCollapsed ? item.title : ''"
              :disabled="category.disabled"
              @click="handleMenuItemClick"
            />
          </NavCategory>
          <li v-if="showAdminLink" class="admin-direct-link">
            <router-link
              to="/admin"
              class="admin-link"
              :title="isMenuCollapsed ? t('navigation.administration') : ''"
            >
              <i class="fas fa-shield-alt"></i>
              <span class="menu-text">{{ t('navigation.administration') }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import NavCategory from './NavCategory.vue'
import NavMenuItem from './NavMenuItem.vue'
import { useCoursesStore } from '../../stores/courses.ts';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useSchedulesStore } from '../../stores/schedules.ts';
import { useThemesStore } from '../../stores/themes.ts';
import { useGenerationsStore } from '../../stores/generations.ts';
import { ref, computed, onMounted } from 'vue';
import { useI18n } from "vue-i18n"
import { useTerminalsStore } from '../../stores/terminals.ts';
import { useUserTerminalKeysStore } from '../../stores/userTerminalKeys.ts';
import { useSubscriptionPlansStore } from '../../stores/subscriptionPlans.ts';
import { useBillingAddressesStore } from '../../stores/billingAddresses.ts';
import { usePaymentMethodsStore } from '../../stores/paymentMethods.ts';
import { useInvoicesStore } from '../../stores/invoices.ts';
import { useSubscriptionsStore } from '../../stores/subscriptions.ts';
import { useClassGroupsStore } from '../../stores/classGroups.ts';
import { useGroupMembersStore } from '../../stores/groupMembers.ts';
import { useSubscriptionBatchesStore } from '../../stores/subscriptionBatches.ts';
import { useOrganizationsStore } from '../../stores/organizations.ts';
import { storeToRefs } from 'pinia';
import { useFeatureFlags } from '../../composables/useFeatureFlags';
import { usePermissions } from '../../composables/usePermissions';
import { usePermissionsStore } from '../../stores/permissions';
import { useMenuCategories } from '../../composables/useMenuCategories';
import { useHelpRegistryStore } from '../../stores/helpRegistry';
import { useLocale } from '../../composables/useLocale';
import { useTranslations } from '../../composables/useTranslations';

const helpStore = useHelpRegistryStore()
const { currentLocale } = useLocale()
const loc = (text: { en: string; fr: string }) => text[currentLocale.value as 'en' | 'fr'] || text.en

// Translations for nav-specific messages (gray-out tooltips)
const { t: tNav } = useTranslations({
  fr: {
    nav: {
      featureAvailableInOrg: "Disponible dans {orgName} — changez d'organisation pour y accéder",
      featureNotInCurrentOrg: "Non disponible dans cette organisation — changez d'organisation pour y accéder",
    }
  },
  en: {
    nav: {
      featureAvailableInOrg: 'Available in {orgName} — switch organization to access',
      featureNotInCurrentOrg: 'Not available in current organization — switch organization to access',
    }
  }
})

// Permissions store for feature availability checks across orgs
const permissionsStoreInstance = usePermissionsStore()

// Props
const props = defineProps<{
  isMenuCollapsed?: boolean;
}>();

// Needed for i18n
useCoursesStore();
useSchedulesStore();
useThemesStore();
useGenerationsStore();
useTerminalsStore();
useUserTerminalKeysStore();
useSubscriptionPlansStore();
useBillingAddressesStore();
usePaymentMethodsStore();
useInvoicesStore();
useSubscriptionsStore();
useClassGroupsStore();
useGroupMembersStore();
useSubscriptionBatchesStore();

// Get organizations store and check if current org is personal
const organizationsStore = useOrganizationsStore();
const { isPersonalOrganization } = storeToRefs(organizationsStore);

// Check if user has only assigned subscriptions (no personal/self-paid)
const subscriptionsStore = useSubscriptionsStore();
const hasOnlyAssignedSubscription = computed(() => {
  const current = subscriptionsStore.currentSubscription
  if (!current) return false
  return current.subscription_type === 'assigned' || !!current.subscription_batch_id
});

// Check if user has infrastructure access (admin or org with incus_ui_enabled)
const hasInfrastructureAccess = computed(() => {
  if (currentUserStore.userRoles?.includes('administrator')) return true
  const userOrgs = organizationsStore.userOrganizations
  return userOrgs.some(org => org.incus_ui_enabled)
})

const currentUserStore = useCurrentUserStore();
const { t } = useI18n();

// Feature flags
const { createReactiveFlag, waitForInitialization } = useFeatureFlags();

// Permissions
const { hasPermission } = usePermissions();

// Create reactive computed values for each flag we need to check
const courseConceptionEnabled = createReactiveFlag('course_conception')
const themeCustomizationEnabled = createReactiveFlag('theme_customization')
const archiveGenerationsEnabled = createReactiveFlag('archive_generations')
const sshKeyManagementEnabled = createReactiveFlag('ssh_key_management')
const terminalManagementEnabled = createReactiveFlag('terminal_management')
const classGroupsEnabled = createReactiveFlag('class_groups')
const helpDocumentationEnabled = createReactiveFlag('help_documentation')

// Track initialization state
const featureFlagsReady = ref(false)

// Helper function to check feature flags reactively
const isFeatureEnabled = (flagName: string): boolean => {
  switch (flagName) {
    case 'course_conception':
      return courseConceptionEnabled.value
    case 'theme_customization':
      return themeCustomizationEnabled.value
    case 'archive_generations':
      return archiveGenerationsEnabled.value
    case 'ssh_key_management':
      return sshKeyManagementEnabled.value
    case 'terminal_management':
      return terminalManagementEnabled.value
    case 'class_groups':
      return classGroupsEnabled.value
    case 'help_documentation':
      return helpDocumentationEnabled.value
    default:
      return true // Default to enabled for unknown flags
  }
}

// Types for menu items
interface MenuItem {
  route: string
  label: string
  title: string
  icon: string
  featureFlag?: string
  hideForAssignedOnly?: boolean
  disabled?: boolean
  disabledTooltip?: string
}

interface MenuCategory {
  key: string
  label: string
  icon: string
  allowedRoles: string[]
  items: MenuItem[]
  featureFlag?: string
  planFeature?: string // Maps to subscription plan feature name for org-aware visibility
  routePrefixes?: string[]
  disabled?: boolean
  disabledTooltip?: string
}

const isBottomCollapsed = ref(true);

// Structure des catégories de menu
const menuCategories = computed((): MenuCategory[] => [
  {
    key: 'courses',
    label: t('navigation.courseDesign'),
    icon: 'fas fa-graduation-cap',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'course_conception',
    items: [
      {
        route: '/courses',
        label: t('courses.pageTitle'),
        title: t('courses.pageTitle'),
        icon: 'fas fa-book'
      },
      {
        route: '/course-editor',
        label: t('navigation.courseEditor'),
        title: t('navigation.courseEditorTitle'),
        icon: 'fas fa-project-diagram'
      },
      {
        route: '/chapters',
        label: t('chapters.pageTitle'),
        title: t('chapters.pageTitle'),
        icon: 'fas fa-book-open'
      },
      {
        route: '/sections',
        label: t('sections.pageTitle'),
        title: t('sections.pageTitle'),
        icon: 'fas fa-stream'
      },
      {
        route: '/pages',
        label: t('pages.pageTitle'),
        title: t('pages.pageTitle'),
        icon: 'fas fa-file-alt'
      },
      {
        route: '/schedules',
        label: t('schedules.pageTitle'),
        title: t('schedules.pageTitle'),
        icon: 'fas fa-calendar-alt'
      },
      {
        route: '/themes',
        label: t('themes.pageTitle'),
        title: t('themes.pageTitle'),
        icon: 'fas fa-id-card',
        featureFlag: 'theme_customization'
      },
      {
        route: '/generations',
        label: t('generations.pageTitle'),
        title: t('generations.pageTitle'),
        icon: 'fas fa-archive',
        featureFlag: 'archive_generations'
      },
      {
        route: '/settings/ssh-keys',
        label: t('navigation.sshKeys'),
        title: t('navigation.sshKeysTitle'),
        icon: 'fas fa-key',
        featureFlag: 'ssh_key_management'
      }
    ]
  },
  {
    key: 'terminals',
    label: t('navigation.terminals'),
    icon: 'fas fa-laptop-code',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'terminal_management',
    planFeature: 'advanced_terminals',
    routePrefixes: ['/terminal-session', '/scenarios'],
    items: [
      {
        route: '/terminal-creation',
        label: t('navigation.createSession'),
        title: t('navigation.createNewTerminalSession'),
        icon: 'fas fa-plus-circle'
      },
      {
        route: '/terminal-sessions',
        label: t('navigation.mySessions'),
        title: t('navigation.manageAllTerminalSessions'),
        icon: 'fas fa-terminal'
      },
      {
        route: '/scenarios',
        label: t('navigation.scenarios'),
        title: t('navigation.scenariosTitle'),
        icon: 'fas fa-flask'
      },
      {
        route: '/my-scenarios',
        label: t('navigation.scenarioHistory'),
        title: t('navigation.scenarioHistoryTitle'),
        icon: 'fas fa-flag-checkered'
      }
    ]
  },
  {
    key: 'groups',
    label: t('navigation.groups'),
    icon: 'fas fa-users',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'class_groups',
    planFeature: 'multiple_groups',
    items: [
      {
        route: '/class-groups',
        label: t('classGroups.pageTitle'),
        title: t('classGroups.groupInfo'),
        icon: 'fas fa-users'
      },
      {
        route: '/class-groups-hierarchy',
        label: t('navigation.groupHierarchy'),
        title: t('navigation.groupHierarchyTitle'),
        icon: 'fas fa-sitemap'
      },
      {
        route: '/group-members',
        label: t('groupMembers.pageTitle'),
        title: t('groupMembers.memberInfo'),
        icon: 'fas fa-user-friends'
      }
    ]
  },
  {
    key: 'organizations',
    label: t('navigation.organizations'),
    icon: 'fas fa-building',
    allowedRoles: ['administrator', 'member'],
    items: [
      {
        route: '/organizations',
        label: t('navigation.myOrganizations'),
        title: t('navigation.myOrganizationsTitle'),
        icon: 'fas fa-building'
      },
      ...(hasInfrastructureAccess.value ? [{
        route: '/infrastructure',
        label: t('navigation.infrastructure'),
        title: t('navigation.infrastructureTitle'),
        icon: 'fas fa-network-wired'
      }] : [])
    ]
  },
  {
    key: 'subscription',
    label: t('navigation.subscriptionLicenses'),
    icon: 'fas fa-credit-card',
    allowedRoles: ['administrator', 'member'],
    items: [
      {
        route: '/subscription-dashboard',
        label: t('navigation.mySubscription'),
        title: t('navigation.mySubscriptionTitle'),
        icon: 'fas fa-tachometer-alt'
      },
      {
        route: '/subscription-plans',
        label: t('navigation.availablePlans'),
        title: t('navigation.availablePlansTitle'),
        icon: 'fas fa-tags'
      },
      {
        route: '/bulk-license-purchase',
        label: t('navigation.purchaseLicenses'),
        title: t('navigation.purchaseLicensesTitle'),
        icon: 'fas fa-shopping-cart',
        hideForAssignedOnly: true
      },
      {
        route: '/license-management',
        label: t('navigation.manageLicenses'),
        title: t('navigation.manageLicensesTitle'),
        icon: 'fas fa-layer-group',
        hideForAssignedOnly: true
      }
    ]
  },
  {
    key: 'help',
    label: loc({ en: 'Help & Documentation', fr: 'Aide & Documentation' }),
    icon: 'fas fa-question-circle',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'help_documentation',
    items: helpStore.navItems.map(item => ({
      route: item.route,
      label: loc(item.label),
      title: loc(item.title),
      icon: item.icon,
      ...(item.featureFlag ? { featureFlag: item.featureFlag } : {})
    }))
  },
  {
    key: 'admin',
    label: t('navigation.administration'),
    icon: 'fas fa-shield-alt',
    allowedRoles: ['administrator'],
    items: [
      {
        route: '/admin',
        label: t('navigation.adminDashboard'),
        title: t('navigation.adminDashboardTitle'),
        icon: 'fas fa-tachometer-alt'
      }
    ]
  }
]);

// Custom visibility check for groups menu
// Now powered by backend-calculated permissions
// Backend determines access based on: role + org ownership + group membership
const shouldShowGroupsMenu = computed(() => {
  return hasPermission('view_groups')
})

// Catégories filtrées selon le rôle de l'utilisateur et les feature flags
const filteredCategories = computed(() => {
  // Use getCurrentActorRoles to respect admin view mode
  const { getCurrentActor } = useFeatureFlags();
  const actor = getCurrentActor();
  const userRolesList = actor.roles || [];

  /**
   * Check if user has any of the allowed roles
   * Handles multi-role users (e.g., ["organization:xxx", "organization_manager:xxx", "administrator"])
   */
  const hasAnyAllowedRole = (allowedRoles: string[]): boolean => {
    // Check if ANY user role matches ANY allowed role
    return userRolesList.some(userRole => allowedRoles.includes(userRole));
  };

  return menuCategories.value
    .filter(category => {
      // Hide organizations menu for personal organizations
      if (category.key === 'organizations' && isPersonalOrganization.value) {
        return false
      }
      // Custom visibility logic for groups menu
      if (category.key === 'groups') {
        // Even if groups is not shown by permission, check if available in another org for gray-out
        if (!shouldShowGroupsMenu.value) {
          if (category.planFeature && permissionsStoreInstance.isFeatureInAnyOrg(category.planFeature)) {
            // Available in another org — show grayed out (handled in map step below)
            return true
          }
          return false
        }
      }
      // Check role access - user must have at least ONE of the allowed roles
      if (!hasAnyAllowedRole(category.allowedRoles)) {
        return false
      }
      // Check category-level feature flag
      if (category.featureFlag) {
        const flagEnabled = isFeatureEnabled(category.featureFlag)
        if (!flagEnabled) {
          // Feature flag is off — check if the plan feature is available in any org (gray-out)
          if (category.planFeature && permissionsStoreInstance.isFeatureInAnyOrg(category.planFeature)) {
            return true // Keep in list, will be marked disabled in map step
          }
          return false // Not available anywhere — hide completely
        }
      }
      return true
    })
    .map(category => {
      // Determine if category should be disabled (available in another org, not current)
      let disabled = false
      let disabledTooltip = ''

      if (category.planFeature) {
        const inCurrentOrg = permissionsStoreInstance.hasFeature(category.planFeature)
        const inAnyOrg = permissionsStoreInstance.isFeatureInAnyOrg(category.planFeature)

        if (!inCurrentOrg && inAnyOrg) {
          disabled = true
          const orgName = permissionsStoreInstance.getOrgWithFeature(category.planFeature)
          disabledTooltip = orgName
            ? tNav('nav.featureAvailableInOrg', { orgName })
            : tNav('nav.featureNotInCurrentOrg')
        }
      }

      // For groups, also check the shouldShowGroupsMenu permission
      if (category.key === 'groups' && !shouldShowGroupsMenu.value) {
        disabled = true
        if (!disabledTooltip) {
          const orgName = category.planFeature
            ? permissionsStoreInstance.getOrgWithFeature(category.planFeature)
            : null
          disabledTooltip = orgName
            ? tNav('nav.featureAvailableInOrg', { orgName })
            : tNav('nav.featureNotInCurrentOrg')
        }
      }

      return {
        ...category,
        disabled,
        disabledTooltip,
        items: category.items.filter(item => {
          // Hide items marked as not for assigned-only users
          if (item.hideForAssignedOnly && hasOnlyAssignedSubscription.value) {
            return false
          }
          // Check item-level feature flag if it exists
          if (item.featureFlag) {
            return isFeatureEnabled(item.featureFlag)
          }
          // Include items without feature flags
          return true
        })
      }
    })
    .filter(category => category.items.length > 0) // Remove categories with no visible items
});

// Split categories into top (functional) and bottom (utility/admin) sections
const bottomCategoryKeys = new Set(['subscription', 'help', 'admin'])

const filteredTopCategories = computed(() =>
  filteredCategories.value.filter(c => !bottomCategoryKeys.has(c.key))
)
const filteredBottomCategories = computed(() =>
  filteredCategories.value.filter(c => bottomCategoryKeys.has(c.key) && c.key !== 'admin')
)

// Admin is rendered as a direct link, not an expandable category
const showAdminLink = computed(() =>
  filteredCategories.value.some(c => c.key === 'admin')
)

// Use shared composable for category expansion, position, active state, and outside click
const {
  expandedCategories,
  menuPositions,
  toggleCategory,
  isCategoryActive,
  handleMenuItemClick
} = useMenuCategories(
  () => menuCategories.value,
  {
    isCollapsed: () => props.isMenuCollapsed ?? false,
    menuSelector: '.main-menu'
  }
)

onMounted(async () => {
  // Wait for feature flags to be initialized from backend
  await waitForInitialization();
  featureFlagsReady.value = true;
});
</script>

<style scoped>
.main-menu {
  background-color: var(--color-gray-800);
  color: var(--color-white);
  height: 100%;
  padding: var(--spacing-lg);
  animation: fadeIn 0.5s ease-in-out;
  transition: width var(--transition-slow) ease;
  overflow: hidden;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-top {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.menu-bottom {
  flex-shrink: 0;
  border-top: 1px solid var(--color-gray-600);
}

.menu-bottom-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
  color: var(--color-gray-400);
  font-size: var(--font-size-xs);
  user-select: none;
  transition: color var(--transition-slow);
}

.menu-bottom-toggle:hover {
  color: var(--color-white);
}

.menu-bottom-toggle-icon {
  transition: transform var(--transition-slow) ease;
  font-size: 10px;
}

.menu-bottom-toggle-icon.rotated {
  transform: rotate(180deg);
}

.main-menu.collapsed {
  width: 80px;
}

.menu-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

/* Hide menu-text in collapsed mode — only in category headers and admin link, not in popup submenus */
.main-menu.collapsed :deep(.category-header .menu-text),
.main-menu.collapsed .admin-link .menu-text {
  opacity: 0;
  width: 0;
  height: 0;
}

/* Animation d'apparition */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-menu {
    position: fixed;
    z-index: 1000;
  }
}

/* Administration direct link */
.admin-direct-link {
  margin-top: var(--spacing-sm);
}

.admin-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-white);
  text-decoration: none;
  background: linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-hover) 100%);
  border: var(--border-width-thin) solid var(--color-danger-hover);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: background var(--transition-slow), transform var(--transition-slow);
  min-height: 50px;
  box-sizing: border-box;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.admin-link i {
  width: 20px;
  text-align: center;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.admin-link:hover {
  background: linear-gradient(135deg, var(--color-danger-hover) 0%, var(--color-danger-dark) 100%);
  transform: translateX(3px);
}

.admin-link.router-link-active {
  background: linear-gradient(135deg, var(--color-danger-dark) 0%, var(--color-danger-darker) 100%);
}

/* Collapsed mode admin link */
.main-menu.collapsed .admin-link {
  justify-content: center;
  min-height: 50px;
}

.main-menu.collapsed .admin-link i {
  margin: 0;
}

.main-menu.collapsed .admin-link:hover {
  transform: none;
}

.main-menu.collapsed .admin-link:hover::after {
  content: attr(title);
  position: absolute;
  left: 85px;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--color-bg-dark);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
  z-index: 5000;
  border: var(--border-width-thin) solid var(--color-border-medium);
  box-shadow: var(--shadow-md);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

.admin-direct-link {
  position: relative;
}
</style>