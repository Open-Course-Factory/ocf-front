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
            :popupStyle="isMenuCollapsed && menuPositions[category.key] ? {
              top: menuPositions[category.key].top + 'px',
              left: menuPositions[category.key].left + 'px'
            } : undefined"
            @toggle="toggleCategory"
          >
            <NavMenuItem
              v-for="item in category.items"
              :key="item.route"
              :to="item.route"
              :label="item.label"
              :icon="item.icon"
              :tooltip="isMenuCollapsed ? item.title : ''"
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
            :popupStyle="isMenuCollapsed && menuPositions[category.key] ? {
              top: menuPositions[category.key].top + 'px',
              left: menuPositions[category.key].left + 'px'
            } : undefined"
            @toggle="toggleCategory"
          >
            <NavMenuItem
              v-for="item in category.items"
              :key="item.route"
              :to="item.route"
              :label="item.label"
              :icon="item.icon"
              :tooltip="isMenuCollapsed ? item.title : ''"
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

// Check if user has only assigned subscriptions (no personal/self-paid)
const subscriptionsStore = useSubscriptionsStore();
const hasOnlyAssignedSubscription = computed(() => {
  const current = subscriptionsStore.currentSubscription
  if (!current) return false
  return current.subscription_type === 'assigned' || !!current.subscription_batch_id
});

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
  hideForAssignedOnly?: boolean
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

const isBottomCollapsed = ref(true);
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
    }))
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
      // Auto-expand bottom section if the active route is in a bottom category
      if (bottomCategoryKeys.has(category.key)) {
        isBottomCollapsed.value = false;
      }
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

/* Hide menu-text in collapsed mode */
.main-menu.collapsed :deep(.menu-text) {
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