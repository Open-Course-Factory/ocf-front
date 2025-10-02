<template>
  <div class="main-menu" :class="{ collapsed: isMenuCollapsed }">
    <header class="menu-header">
      <h1>
        <router-link to="/courses">
          <i class="fas fa-book"></i>
          <span class="menu-text">OCF</span>
        </router-link>
      </h1>
      <p class="user-role">{{ currentUser.userRoles[0] }}</p>
    </header>
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
import { useRoute } from 'vue-router';
import { useHelpTranslations } from '../../composables/useHelpTranslations';

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

// Load help translations
const { loadHelpTranslations } = useHelpTranslations();

const currentUser = useCurrentUserStore();
const { t } = useI18n();
const route = useRoute();

// État pour gérer l'expansion des catégories et leur position
const expandedCategories = ref<Record<string, boolean>>({
  courses: false,
  labs: false,
  account: false,
  admin: false
});

const menuPositions = ref<Record<string, { top: number; left: number }>>({});

// Structure des catégories de menu
const menuCategories = computed(() => [
  {
    key: 'courses',
    label: t('navigation.courseDesign'),
    icon: 'fas fa-graduation-cap',
    allowedRoles: ['administrator', 'teacher', 'student'],
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
        icon: 'fas fa-id-card'
      },
      {
        route: '/generations',
        label: t('generations.pageTitle'),
        title: t('generations.pageTitle'),
        icon: 'fas fa-archive'
      }
    ]
  },
  {
    key: 'labs',
    label: t('navigation.practicalWork'),
    icon: 'fas fa-laptop-code',
    allowedRoles: ['administrator', 'teacher', 'student'],
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
        title: t('navigation.manageTerminalSessions'),
        icon: 'fas fa-terminal'
      },
      {
        route: '/terminal-shared',
        label: t('navigation.sharedSessions'),
        title: t('navigation.sessionsSharedWithMe'),
        icon: 'fas fa-share-alt'
      },
      {
        route: '/user-terminal-keys',
        label: t('userTerminalKeys.pageTitle'),
        title: t('userTerminalKeys.pageTitle'),
        icon: 'fas fa-key'
      }
    ]
  },
  {
    key: 'account',
    label: t('navigation.myAccount'),
    icon: 'fas fa-user',
    allowedRoles: ['administrator', 'teacher', 'student'],
    items: [
      {
        route: '/subscription-dashboard',
        label: t('subscriptions.dashboardTitle'),
        title: t('subscriptions.dashboardTitle'),
        icon: 'fas fa-tachometer-alt'
      },
      {
        route: '/subscription-plans',
        label: t('subscriptionPlans.pageTitle'),
        title: t('subscriptionPlans.pageTitle'),
        icon: 'fas fa-calendar'
      },
      {
        route: '/billing-addresses',
        label: t('billingAddresses.pageTitle'),
        title: t('billingAddresses.pageTitle'),
        icon: 'fas fa-city'
      },
      {
        route: '/payment-methods',
        label: t('paymentMethods.pageTitle'),
        title: t('paymentMethods.pageTitle'),
        icon: 'fas fa-credit-card'
      }
    ].concat(
      // Add invoices for non-admin users only
      currentUser.userRoles[0] !== 'administrator' ? [{
        route: '/invoices',
        label: t('invoices.pageTitle'),
        title: t('invoices.pageTitle'),
        icon: 'fas fa-money-bill'
      }] : []
    )
  },
  {
    key: 'help',
    label: t('help.title'),
    icon: 'fas fa-question-circle',
    allowedRoles: ['administrator', 'teacher', 'student'],
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
        icon: 'fas fa-terminal'
      },
      {
        route: '/help/courses/structure',
        label: t('help.sections.courses.title'),
        title: t('help.sections.courses.description'),
        icon: 'fas fa-graduation-cap'
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
      }
    ]
  }
]);

// Catégories filtrées selon le rôle de l'utilisateur
const filteredCategories = computed(() => {
  const userRole = currentUser.userRoles[0];
  return menuCategories.value.filter(category => 
    category.allowedRoles.includes(userRole)
  );
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
  background-color: #343a40;
  color: #e7e7e7;
  height: 100vh;
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
  transition: width 0.3s ease;
  overflow: hidden;
}

.main-menu.collapsed {
  width: 80px;
}

.menu-header {
  margin-bottom: 30px;
}

.menu-header h1 a {
  font-size: 2rem;
  color: #e7e7e7;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.main-menu.collapsed .menu-header {
  margin-bottom: 0px;
}

.menu-header h1 a .menu-text {
  display: inline;
  transition: opacity 0.3s ease;
  margin-left: 20px;
}

.main-menu.collapsed .menu-header h1 a {
  flex-direction: column;
  align-items: center;
}

.main-menu.collapsed .menu-header h1 a .menu-text {
  opacity: 0;
  width: 0;
  height: 0;
}

.user-role {
  font-size: 0.875rem;
  text-transform: uppercase;
  margin-left: 20px;
  transition: opacity 0.3s ease;
}

.main-menu.collapsed .user-role {
  opacity: 0;
  width: 0;
  height: 0;
}

.menu-nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

/* Styles pour les catégories */
.menu-category {
  margin-bottom: 8px;
  position: relative;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 15px;
  color: #e7e7e7;
  background-color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  position: relative;
  user-select: none;
  min-height: 50px;
  box-sizing: border-box;
}

.category-header:hover {
  background-color: #5a6268;
  transform: translateX(3px);
}

.category-header.active {
  background-color: #6c757d;
}

.category-header i:first-child {
  width: 20px;
  text-align: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.category-title {
  flex-grow: 1;
  font-weight: 600;
  font-size: 0.9rem;
}

.chevron-icon {
  margin-left: auto;
  transition: transform 0.3s ease;
  font-size: 0.8rem;
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
  margin-bottom: 5px;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  display: flex;
  cursor: pointer;
}

.main-menu.collapsed .category-header:hover {
  transform: none;
  background-color: #5a6268;
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
  background-color: #343a40;
  color: #e7e7e7;
  padding: 8px 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 1;
  z-index: 5000;
  border: 1px solid #495057;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 0.85rem;
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
  background-color: #343a40;
  border: 1px solid #495057;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
  padding: 12px 25px;
  color: #c8d1d8;
  text-decoration: none;
  transition: background-color 0.3s, transform 0.3s, color 0.3s;
  position: relative;
  font-size: 0.85rem;
  min-height: 44px;
  box-sizing: border-box;
}

.category-items li a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: translateX(5px);
}

.category-items li a i {
  width: 18px;
  text-align: center;
  margin-right: 12px;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.category-items li a .menu-text {
  transition: opacity 0.3s ease;
}

/* Styles spéciaux pour le mode collapsed */
.main-menu.collapsed .category-items li a {
  padding: 12px 15px;
  transform: none;
}

.main-menu.collapsed .category-items li a:hover {
  transform: none;
  background-color: #495057;
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
  background-color: #007bff !important; /* Couleur bleue pour l'élément actif */
  color: #fff !important;
  font-weight: 600;
  border-left: 4px solid #0056b3; /* Bordure gauche pour plus de visibilité */
  transform: translateX(0) !important; /* Éviter le décalage au hover */
}

.category-items li a.router-link-active:hover,
.category-items li a.router-link-exact-active:hover {
  background-color: #0056b3 !important;
  transform: translateX(0) !important;
}

/* Style pour l'en-tête de catégorie contenant un élément actif */
.category-header.has-active-item {
  background-color: #495057;
  border-left: 3px solid #007bff;
}

/* Styles spéciaux pour la section Administration */
.menu-category[data-category="admin"] .category-header {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border: 1px solid #c82333;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

.menu-category[data-category="admin"] .category-header:hover {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
  transform: translateX(3px);
}

.menu-category[data-category="admin"] .category-header.active {
  background: linear-gradient(135deg, #bd2130 0%, #a71e2a 100%);
}

.menu-category[data-category="admin"] .category-items {
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.menu-category[data-category="admin"] .category-items li a {
  color: #f8d7da;
}

.menu-category[data-category="admin"] .category-items li a:hover {
  background-color: rgba(220, 53, 69, 0.2);
  color: #fff;
}

.main-menu.collapsed .menu-category[data-category="admin"] .category-items {
  background-color: #dc3545;
  border-color: #c82333;
}

/* Adaptation pour le mode collapsed */
.main-menu.collapsed .category-items li a.router-link-active,
.main-menu.collapsed .category-items li a.router-link-exact-active {
  background-color: #007bff !important;
  border-left: none;
  border-radius: 4px;
}
</style>