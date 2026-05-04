<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <NavMenuShell
    :isMenuCollapsed="isMenuCollapsed"
    :headerTitle="t('admin.title')"
    :showHeader="true"
    @back="goBack"
  >
    <ul :class="{ collapsed: isMenuCollapsed }">
      <NavCategory
        v-for="category in adminCategories"
        :key="category.key"
        :categoryKey="category.key"
        :label="category.label"
        :icon="category.icon"
        :expanded="expandedCategories[category.key] ?? false"
        :hasActiveItem="isCategoryActive[category.key] ?? false"
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
          :tooltip="isMenuCollapsed ? item.label : ''"
          @click="handleMenuItemClick"
        />
      </NavCategory>
    </ul>
  </NavMenuShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { useMenuCategories } from '../../composables/useMenuCategories'
import type { MenuCategory } from '../../composables/useMenuCategories'
import NavMenuShell from './NavMenuShell.vue'
import NavCategory from './NavCategory.vue'
import NavMenuItem from './NavMenuItem.vue'

const props = withDefaults(defineProps<{
  isMenuCollapsed?: boolean
}>(), {
  isMenuCollapsed: false
})

const router = useRouter()

const { t } = useTranslations({
  en: {
    admin: {
      title: 'Administration',
      categories: {
        billing: 'Billing & Payments',
        system: 'System Management',
        content: 'Content Management',
        scenarios: 'Scenarios',
        debug: 'Debug & Monitoring'
      },
      items: {
        subscriptionPlans: 'Subscription Plans',
        planFeatures: 'Plan Features',
        allInvoices: 'All Invoices',
        invoiceCleanup: 'Invoice Cleanup',
        organizations: 'Organizations',
        users: 'Users & Impersonation',
        terminalBackends: 'Terminal Backends',
        infrastructure: 'Infrastructure',
        security: 'Security',
        feedbackSettings: 'Feedback Settings',
        bulkImport: 'Bulk Import',
        emailTemplates: 'Email Templates',
        scenarios: 'Scenarios',
        scenarioSteps: 'Scenario Steps',
        scenarioStepHints: 'Scenario Step Hints',
        scenarioSessions: 'Scenario Sessions',
        projectFiles: 'Project Files',
        featureFlags: 'Feature Flags',
        designSystem: 'Design System'
      }
    }
  },
  fr: {
    admin: {
      title: 'Administration',
      categories: {
        billing: 'Facturation & Paiements',
        system: 'Gestion du Système',
        content: 'Gestion du Contenu',
        scenarios: 'Scénarios',
        debug: 'Débogage & Surveillance'
      },
      items: {
        subscriptionPlans: 'Plans d\'Abonnement',
        planFeatures: 'Fonctionnalités des Plans',
        allInvoices: 'Toutes les Factures',
        invoiceCleanup: 'Nettoyage des Factures',
        organizations: 'Organisations',
        users: 'Utilisateurs & Incarnation',
        terminalBackends: 'Backends Terminal',
        infrastructure: 'Infrastructure',
        security: 'Sécurité',
        feedbackSettings: 'Paramètres de Feedback',
        bulkImport: 'Importation Groupée',
        emailTemplates: 'Modèles d\'Email',
        scenarios: 'Scénarios',
        scenarioSteps: 'Étapes de Scénario',
        scenarioStepHints: 'Indices des Étapes',
        scenarioSessions: 'Sessions de Scénario',
        projectFiles: 'Fichiers Projet',
        featureFlags: 'Drapeaux de Fonctionnalités',
        designSystem: 'Système de Design'
      }
    }
  }
})

const adminCategories = computed<MenuCategory[]>(() => [
  {
    key: 'billing',
    label: t('admin.categories.billing'),
    icon: 'fas fa-credit-card',
    items: [
      {
        route: '/admin/subscription-plans',
        label: t('admin.items.subscriptionPlans'),
        icon: 'fas fa-tags'
      },
      {
        route: '/admin/plan-features',
        label: t('admin.items.planFeatures'),
        icon: 'fas fa-puzzle-piece'
      },
      {
        route: '/invoices',
        label: t('admin.items.allInvoices'),
        icon: 'fas fa-file-invoice-dollar'
      },
      {
        route: '/admin/invoice-cleanup',
        label: t('admin.items.invoiceCleanup'),
        icon: 'fas fa-broom'
      }
    ]
  },
  {
    key: 'system',
    label: t('admin.categories.system'),
    icon: 'fas fa-server',
    items: [
      {
        route: '/admin/organizations',
        label: t('admin.items.organizations'),
        icon: 'fas fa-building'
      },
      {
        route: '/admin/users',
        label: t('admin.items.users'),
        icon: 'fas fa-users-cog'
      },
      {
        route: '/admin/terminal-metrics',
        label: t('admin.items.terminalBackends'),
        icon: 'fas fa-server'
      },
      {
        route: '/admin/infrastructure',
        label: t('admin.items.infrastructure'),
        icon: 'fas fa-network-wired'
      },
      {
        route: '/admin/security',
        label: t('admin.items.security'),
        icon: 'fas fa-user-shield'
      },
      {
        route: '/admin/feedback-settings',
        label: t('admin.items.feedbackSettings'),
        icon: 'fas fa-comment-dots'
      }
    ]
  },
  {
    key: 'content',
    label: t('admin.categories.content'),
    icon: 'fas fa-book-open',
    items: [
      {
        route: '/admin/bulk-import',
        label: t('admin.items.bulkImport'),
        icon: 'fas fa-file-import'
      },
      {
        route: '/admin/email-templates',
        label: t('admin.items.emailTemplates'),
        icon: 'fas fa-envelope'
      }
    ]
  },
  {
    key: 'scenarios',
    label: t('admin.categories.scenarios'),
    icon: 'fas fa-flask',
    items: [
      {
        route: '/admin/scenarios',
        label: t('admin.items.scenarios'),
        icon: 'fas fa-flask'
      },
      {
        route: '/admin/scenario-steps',
        label: t('admin.items.scenarioSteps'),
        icon: 'fas fa-list-ol'
      },
      {
        route: '/admin/scenario-step-hints',
        label: t('admin.items.scenarioStepHints'),
        icon: 'fas fa-lightbulb'
      },
      {
        route: '/admin/scenario-sessions',
        label: t('admin.items.scenarioSessions'),
        icon: 'fas fa-play-circle'
      },
      {
        route: '/admin/project-files',
        label: t('admin.items.projectFiles'),
        icon: 'fas fa-file-code'
      }
    ]
  },
  {
    key: 'debug',
    label: t('admin.categories.debug'),
    icon: 'fas fa-bug',
    items: [
      {
        route: '/debug/feature-flags',
        label: t('admin.items.featureFlags'),
        icon: 'fas fa-flag'
      },
      {
        route: '/debug/design-system',
        label: t('admin.items.designSystem'),
        icon: 'fas fa-palette'
      }
    ]
  }
])

const {
  expandedCategories,
  menuPositions,
  toggleCategory,
  isCategoryActive,
  handleMenuItemClick
} = useMenuCategories(
  () => adminCategories.value,
  {
    isCollapsed: () => props.isMenuCollapsed,
    menuSelector: '.nav-menu-shell'
  }
)

function goBack() {
  router.push('/terminal-sessions')
}
</script>

<style scoped>
/* Admin theme — refined indigo accent on dark base */
.nav-menu-shell {
  --admin-accent: var(--color-purple);
  --admin-accent-hover: #5558e6;
  --admin-items-bg: rgba(99, 102, 241, 0.06);
  --admin-items-border: rgba(99, 102, 241, 0.12);
  --admin-items-hover: rgba(99, 102, 241, 0.15);
}

/* Category headers — dark gray with indigo left accent */
:deep(.nav-category .category-header) {
  background-color: var(--color-gray-700);
  border: var(--border-width-thin) solid var(--color-gray-600);
  border-left: 3px solid var(--admin-accent);
  box-shadow: var(--shadow-sm);
}

:deep(.nav-category .category-header:hover) {
  background-color: var(--color-gray-600);
  transform: translateX(3px);
}

:deep(.nav-category .category-header.active) {
  background-color: var(--color-gray-600);
  border-left-color: var(--admin-accent-hover);
}

/* Submenu items — subtle indigo tint */
:deep(.nav-category .category-items) {
  background-color: var(--admin-items-bg);
  border: var(--border-width-thin) solid var(--admin-items-border);
}

:deep(.nav-category .category-items li a) {
  color: var(--color-gray-400);
}

:deep(.nav-category .category-items li a:hover) {
  background-color: var(--admin-items-hover);
  color: var(--color-white);
}

/* Collapsed popup — solid dark background with indigo hover */
:deep(.collapsed .nav-category .category-items) {
  background-color: var(--color-gray-900) !important;
  border-color: var(--color-gray-600) !important;
  --collapsed-popup-text: var(--color-white);
  --collapsed-popup-hover-bg: var(--admin-items-hover);
}
</style>
