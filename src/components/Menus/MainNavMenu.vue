<template>
  <div class="main-menu" :class="{ collapsed: isMenuCollapsed }">
    <nav class="menu-nav">
      <ul>
        <li v-for="category in filteredCategories" :key="category.key" class="menu-category" :data-category="category.key">
          <div 
            class="category-header"
            @click="toggleCategory(category.key, $event)"
            :class="{ 
              active: expandedCategories[category.key],
              'has-active-item': isCategoryActive[category.key]
            }"
            :title="isMenuCollapsed ? category.label : ''"
          >
            <i :class="category.icon"></i>
            <span class="menu-text category-title">{{ category.label }}</span>
            <i 
              v-if="!isMenuCollapsed" 
              class="fas fa-chevron-down chevron-icon"
              :class="{ rotated: expandedCategories[category.key] }"
            ></i>
          </div>
          <ul 
            class="category-items" 
            :class="{ 
              expanded: expandedCategories[category.key]
            }"
            :style="isMenuCollapsed && menuPositions[category.key] ? {
              top: menuPositions[category.key].top + 'px',
              left: menuPositions[category.key].left + 'px'
            } : {}"
          >
            <li v-for="item in category.items" :key="item.route">
              <router-link 
                :to="item.route" 
                class="menu-item" 
                :title="isMenuCollapsed ? item.title : ''"
                @click="handleMenuItemClick"
              >
                <i :class="item.icon"></i>
                <span class="menu-text">{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useCoursesStore } from '../../stores/courses.ts';
import { useCurrentUserStore } from '../../stores/currentUser.ts';
import { useSchedulesStore } from '../../stores/schedules.ts';
import { useThemesStore } from '../../stores/themes.ts';
import { useGenerationsStore } from '../../stores/generations.ts';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
import { useRoute } from 'vue-router';
import { useHelpTranslations } from '../../composables/useHelpTranslations';
import { useFeatureFlags } from '../../composables/useFeatureFlags';
import { usePermissions } from '../../composables/usePermissions';

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

// Load help translations
const { loadHelpTranslations } = useHelpTranslations();

const currentUser = useCurrentUserStore();
const { userRoles, permissions } = storeToRefs(currentUser); // Make roles and permissions reactive
const { t } = useI18n();
const route = useRoute();

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
}

interface MenuCategory {
  key: string
  label: string
  icon: string
  allowedRoles: string[]
  items: MenuItem[]
  featureFlag?: string
}

// État pour gérer l'expansion des catégories et leur position
const expandedCategories = ref<Record<string, boolean>>({
  courses: false,
  terminals: false,
  groups: false,
  organizations: false,
  subscription: false,
  help: false,
  admin: false
});

const menuPositions = ref<Record<string, { top: number; left: number }>>({});

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
      }
    ]
  },
  {
    key: 'groups',
    label: t('navigation.groups'),
    icon: 'fas fa-users',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'class_groups',
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
      }
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
        icon: 'fas fa-shopping-cart'
      },
      {
        route: '/license-management',
        label: t('navigation.manageLicenses'),
        title: t('navigation.manageLicensesTitle'),
        icon: 'fas fa-layer-group'
      }
    ]
  },
  {
    key: 'help',
    label: t('help.title'),
    icon: 'fas fa-question-circle',
    allowedRoles: ['administrator', 'member'],
    featureFlag: 'help_documentation',
    items: [
      {
        route: '/help',
        label: t('help.title'),
        title: t('help.subtitle'),
        icon: 'fas fa-book'
      },
      {
        route: '/help/terminals/getting-started',
        label: t('help.sections.terminals.title'),
        title: t('help.sections.terminals.description'),
        icon: 'fas fa-terminal',
        featureFlag: 'terminal_management'
      },
      {
        route: '/help/courses/structure',
        label: t('help.sections.courses.title'),
        title: t('help.sections.courses.description'),
        icon: 'fas fa-graduation-cap',
        featureFlag: 'course_conception'
      },
      {
        route: '/help/account/subscription',
        label: t('help.sections.account.title'),
        title: t('help.sections.account.description'),
        icon: 'fas fa-user-cog'
      }
    ]
  },
  {
    key: 'admin',
    label: t('navigation.administration'),
    icon: 'fas fa-shield-alt',
    allowedRoles: ['administrator'],
    items: [
      {
        route: '/admin/bulk-import',
        label: t('navigation.bulkImport'),
        title: t('navigation.bulkImportTitle'),
        icon: 'fas fa-file-import'
      },
      {
        route: '/admin/subscription-plans',
        label: t('navigation.adminSubscriptionPlans'),
        title: t('navigation.adminSubscriptionPlansTitle'),
        icon: 'fas fa-cogs'
      },
      {
        route: '/invoices',
        label: t('navigation.allInvoices'),
        title: t('navigation.viewAllSystemInvoices'),
        icon: 'fas fa-file-invoice-dollar'
      },
      {
        route: '/admin/invoice-cleanup',
        label: t('navigation.invoiceCleanup'),
        title: t('navigation.invoiceCleanupTitle'),
        icon: 'fas fa-broom'
      },
      {
        route: '/admin/terminal-metrics',
        label: t('navigation.terminalMetrics'),
        title: t('navigation.terminalMetricsTitle'),
        icon: 'fas fa-chart-line'
      },
      {
        route: '/email-templates',
        label: t('navigation.emailTemplates'),
        title: t('navigation.emailTemplatesTitle'),
        icon: 'fas fa-envelope'
      },
      {
        route: '/debug/feature-flags',
        label: t('navigation.featureFlags'),
        title: t('navigation.featureFlagsTitle'),
        icon: 'fas fa-flag'
      }
    ]
  }
]);

// Custom visibility check for groups menu
// Now powered by backend-calculated permissions
// Backend determines access based on: role + org ownership + group membership
const shouldShowGroupsMenu = computed(() => {
  const result = hasPermission('view_groups')

  console.log('🔐 Groups menu visibility check:', {
    hasViewGroupsPermission: result,
    allPermissions: permissions.value,
    permissionsCount: permissions.value.length,
    userId: currentUser.userId,
    userRoles: userRoles.value
  })

  return result
})

// Catégories filtrées selon le rôle de l'utilisateur et les feature flags
const filteredCategories = computed(() => {
  // Use getCurrentActorRoles to respect admin view mode
  const { getCurrentActor } = useFeatureFlags();
  const actor = getCurrentActor();
  const userRolesList = actor.roles || [];

  console.log('🔄 filteredCategories recomputing:', {
    userRolesList,
    permissionsCount: permissions.value.length,
    hasViewGroups: permissions.value.includes('view_groups')
  });

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
        return shouldShowGroupsMenu.value
      }
      // Check role access - user must have at least ONE of the allowed roles
      if (!hasAnyAllowedRole(category.allowedRoles)) {
        console.log(`  ❌ Category "${category.key}" filtered out: user roles`, userRolesList, 'not in', category.allowedRoles);
        return false
      }
      // Check category-level feature flag
      if (category.featureFlag) {
        const enabled = isFeatureEnabled(category.featureFlag);
        if (!enabled) {
          console.log(`  ❌ Category "${category.key}" filtered out: feature flag "${category.featureFlag}" disabled`);
        }
        return enabled
      }
      console.log(`  ✅ Category "${category.key}" visible`);
      return true
    })
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Check item-level feature flag if it exists
        if (item.featureFlag) {
          return isFeatureEnabled(item.featureFlag)
        }
        // Include items without feature flags
        return true
      })
    }))
    .filter(category => category.items.length > 0) // Remove categories with no visible items
});

// Fonction pour déterminer si une catégorie contient l'élément actif
const isCategoryActive = computed(() => {
  const activeCategories: Record<string, boolean> = {};
  
  menuCategories.value.forEach(category => {
    activeCategories[category.key] = category.items.some(item => 
      route.path === item.route || route.path.startsWith(item.route + '/')
    );
  });
  
  return activeCategories;
});

// Fonction pour basculer l'état d'une catégorie
function toggleCategory(categoryKey: string, event?: Event) {
  console.log('Toggle category:', categoryKey, 'isCollapsed:', props.isMenuCollapsed);
  
  // En mode collapsed, fermer les autres catégories d'abord
  if (props.isMenuCollapsed) {
    Object.keys(expandedCategories.value).forEach(key => {
      if (key !== categoryKey) {
        expandedCategories.value[key] = false;
      }
    });
    
    // Calculer la position du menu contextuel
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      menuPositions.value[categoryKey] = {
        top: rect.top,
        left: rect.right + 5
      };
      console.log('Menu position:', menuPositions.value[categoryKey]);
    }
  }
  
  expandedCategories.value[categoryKey] = !expandedCategories.value[categoryKey];
  console.log('New state:', expandedCategories.value[categoryKey]);
}

// Fermer les catégories quand on clique sur un item en mode collapsed
function handleMenuItemClick() {
  if (props.isMenuCollapsed) {
    Object.keys(expandedCategories.value).forEach(key => {
      expandedCategories.value[key] = false;
    });
  }
}

// Fermer les catégories quand on clique en dehors (seulement en mode collapsed)
function handleOutsideClick(event: Event) {
  if (!props.isMenuCollapsed) return;
  
  const target = event.target as HTMLElement;
  const menuElement = target.closest('.main-menu');
  
  if (!menuElement) {
    Object.keys(expandedCategories.value).forEach(key => {
      expandedCategories.value[key] = false;
    });
  }
}

// Fonction pour ouvrir la catégorie active selon la route courante
function openActiveCategoryOnMount() {
  if (props.isMenuCollapsed) return;

  // Fermer toutes les catégories d'abord
  Object.keys(expandedCategories.value).forEach(key => {
    expandedCategories.value[key] = false;
  });

  // Trouver la catégorie contenant la route active
  let activeCategoryFound = false;
  for (const category of filteredCategories.value) {
    const hasActiveItem = category.items.some(item =>
      route.path === item.route || route.path.startsWith(item.route + '/')
    );

    if (hasActiveItem) {
      expandedCategories.value[category.key] = true;
      activeCategoryFound = true;
      break;
    }
  }

  // Si aucune catégorie active n'est trouvée, ouvrir la première par défaut
  if (!activeCategoryFound && filteredCategories.value.length > 0) {
    expandedCategories.value[filteredCategories.value[0].key] = true;
  }
}

onMounted(async () => {
  // Wait for feature flags to be initialized from backend
  await waitForInitialization();
  featureFlagsReady.value = true;

  await loadHelpTranslations();

  openActiveCategoryOnMount();
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

// Gérer les changements de mode collapsed
watch(() => props.isMenuCollapsed, (isCollapsed) => {
  if (!isCollapsed) {
    openActiveCategoryOnMount();
  }
});

// Gérer les changements de route pour ouvrir la bonne catégorie
watch(() => route.path, () => {
  if (!props.isMenuCollapsed) {
    openActiveCategoryOnMount();
  }
});
</script>

<style scoped>
.main-menu {
  background-color: var(--color-gray-800);
  color: var(--color-white);
  height: 100vh;
  padding: var(--spacing-lg);
  animation: fadeIn 0.5s ease-in-out;
  transition: width var(--transition-slow) ease;
  overflow: hidden;
}

.main-menu.collapsed {
  width: 80px;
}

.menu-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

/* Styles pour les catégories */
.menu-category {
  margin-bottom: var(--spacing-sm);
  position: relative;
}

.category-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-white);
  background-color: var(--color-gray-700);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-slow), transform var(--transition-slow);
  position: relative;
  user-select: none;
  min-height: 50px;
  box-sizing: border-box;
}

.category-header:hover {
  background-color: var(--color-gray-600);
  transform: translateX(3px);
}

.category-header.active {
  background-color: var(--color-gray-600);
}

.category-header i:first-child {
  width: 20px;
  text-align: center;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.category-title {
  flex-grow: 1;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

.chevron-icon {
  margin-left: auto;
  transition: transform var(--transition-slow) ease;
  font-size: var(--font-size-xs);
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Mode collapsed */
.main-menu.collapsed .category-header {
  justify-content: center;
  align-items: center;
  min-height: 50px;
  margin-bottom: var(--spacing-xs);
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  display: flex;
  cursor: pointer;
}

.main-menu.collapsed .category-header:hover {
  transform: none;
  background-color: var(--color-gray-600);
}

.main-menu.collapsed .category-header i:first-child {
  margin: 0;
  width: auto;
}

.main-menu.collapsed .category-title {
  opacity: 0;
  width: 0;
  margin: 0;
  height: 0;
}

.main-menu.collapsed .chevron-icon {
  display: none;
}

.main-menu.collapsed .category-header:hover::after {
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
  opacity: 1;
  z-index: 5000;
  border: var(--border-width-thin) solid var(--color-border-medium);
  box-shadow: var(--shadow-md);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

/* Styles pour les items de catégorie */
.category-items {
  list-style-type: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 4px 4px;
}

.category-items.expanded {
  max-height: 1000px;
}

/* Mode collapsed - menu contextuel */
.main-menu.collapsed .category-items {
  position: fixed !important;
  min-width: 220px;
  background-color: var(--color-bg-dark);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-lg);
  z-index: 9999 !important;
  overflow: visible;
  max-height: none !important;
  transition: none;
}

.main-menu.collapsed .category-items.expanded {
  display: block !important;
}

.main-menu.collapsed .category-items:not(.expanded) {
  display: none !important;
}

.category-items li a {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-gray-400);
  text-decoration: none;
  transition: background-color var(--transition-slow), transform var(--transition-slow), color var(--transition-slow);
  position: relative;
  font-size: var(--font-size-sm);
  min-height: 44px;
  box-sizing: border-box;
}

.category-items li a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-white);
  transform: translateX(5px);
}

.category-items li a i {
  width: 18px;
  text-align: center;
  margin-right: var(--spacing-md);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.category-items li a .menu-text {
  transition: opacity var(--transition-slow) ease;
}

/* Styles spéciaux pour le mode collapsed */
.main-menu.collapsed .category-items li a {
  padding: var(--spacing-md) var(--spacing-md);
  transform: none;
}

.main-menu.collapsed .category-items li a:hover {
  transform: none;
  background-color: var(--color-gray-700);
}

.main-menu.collapsed .category-items li a .menu-text {
  opacity: 1;
  width: auto;
}

.main-menu.collapsed .category-items li a:hover::after {
  display: none;
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

/* Style pour l'élément de menu actif */
.category-items li a.router-link-active,
.category-items li a.router-link-exact-active {
  background-color: var(--color-primary) !important;
  color: var(--color-white) !important;
  font-weight: var(--font-weight-semibold);
  border-left: 4px solid var(--color-primary-hover);
  transform: translateX(0) !important;
}

.category-items li a.router-link-active:hover,
.category-items li a.router-link-exact-active:hover {
  background-color: var(--color-primary-hover) !important;
  transform: translateX(0) !important;
}

/* Style pour l'en-tête de catégorie contenant un élément actif */
.category-header.has-active-item {
  background-color: var(--color-gray-700);
  border-left: 3px solid var(--color-primary);
}

/* Styles spéciaux pour la section Administration */
.menu-category[data-category="admin"] .category-header {
  background: linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-hover) 100%);
  border: var(--border-width-thin) solid var(--color-danger-hover);
  box-shadow: var(--shadow-sm);
}

.menu-category[data-category="admin"] .category-header:hover {
  background: linear-gradient(135deg, var(--color-danger-hover) 0%, #bd2130 100%);
  transform: translateX(3px);
}

.menu-category[data-category="admin"] .category-header.active {
  background: linear-gradient(135deg, #bd2130 0%, #a71e2a 100%);
}

.menu-category[data-category="admin"] .category-items {
  background-color: rgba(220, 53, 69, 0.1);
  border: var(--border-width-thin) solid rgba(220, 53, 69, 0.2);
}

.menu-category[data-category="admin"] .category-items li a {
  color: var(--color-gray-400);
}

.menu-category[data-category="admin"] .category-items li a:hover {
  background-color: rgba(220, 53, 69, 0.2);
  color: var(--color-white);
}

.main-menu.collapsed .menu-category[data-category="admin"] .category-items {
  background-color: var(--color-danger);
  border-color: var(--color-danger-hover);
}

.main-menu.collapsed .menu-category[data-category="admin"] .category-items li a {
  color: var(--color-white);
}

/* Adaptation pour le mode collapsed */
.main-menu.collapsed .category-items li a.router-link-active,
.main-menu.collapsed .category-items li a.router-link-exact-active {
  background-color: var(--color-primary) !important;
  border-left: none;
  border-radius: var(--border-radius-sm);
}
</style>