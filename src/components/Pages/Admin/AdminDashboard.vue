<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1><i class="fas fa-tachometer-alt"></i> {{ t('adminDashboard.title') }}</h1>
          <p class="dashboard-description">
            {{ t('adminDashboard.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <div class="dashboard-sections">
      <div class="dashboard-section" v-for="section in dashboardSections" :key="section.id">
        <div class="section-card" @click="toggleSection(section.id)">
          <div class="section-header">
            <div class="section-title">
              <i :class="section.icon"></i>
              <h3>{{ section.title }}</h3>
            </div>
            <div class="section-toggle">
              <i class="fas fa-chevron-down" :class="{ rotated: expandedSections.has(section.id) }"></i>
            </div>
          </div>
        </div>

        <div v-if="expandedSections.has(section.id)" class="section-content">
          <div class="dashboard-items">
            <router-link
              v-for="item in section.items"
              :key="item.route"
              :to="item.route"
              class="dashboard-item"
            >
              <div class="item-icon">
                <i :class="item.icon"></i>
              </div>
              <div class="item-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-arrow">
                <i class="fas fa-arrow-right"></i>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    adminDashboard: {
      title: 'Administration Dashboard',
      subtitle: 'Manage all aspects of the platform from one place',
      sections: {
        billing: {
          title: 'Billing & Payments'
        },
        system: {
          title: 'System Management'
        },
        content: {
          title: 'Content & Scenarios'
        },
        debug: {
          title: 'Debug & Monitoring'
        }
      },
      items: {
        plans: {
          title: 'Plans',
          description: 'Manage subscription plans and pricing'
        },
        features: {
          title: 'Features',
          description: 'Manage plan feature catalog'
        },
        invoices: {
          title: 'Invoices',
          description: 'View all system invoices'
        },
        cleanup: {
          title: 'Cleanup',
          description: 'Manage and cleanup old invoices'
        },
        organizations: {
          title: 'Organizations',
          description: 'Manage organization backends and plans'
        },
        users: {
          title: 'User management',
          description: 'Browse all users with their org and group memberships, and impersonate any user for debugging.'
        },
        backends: {
          title: 'Backends',
          description: 'Manage terminal backend servers'
        },
        security: {
          title: 'Security',
          description: 'RBAC policy overview and health checks'
        },
        import: {
          title: 'Import',
          description: 'Import users and groups to organizations'
        },
        emailTemplates: {
          title: 'Email Templates',
          description: 'Manage email notification templates'
        },
        scenarios: {
          title: 'Scenarios',
          description: 'Manage interactive lab scenarios'
        },
        steps: {
          title: 'Steps',
          description: 'Manage scenario step content'
        },
        sessions: {
          title: 'Sessions',
          description: 'Monitor active scenario sessions'
        },
        featureFlags: {
          title: 'Feature Flags',
          description: 'Manage feature flags'
        },
        designSystem: {
          title: 'Design System',
          description: 'Visual audit of CSS variables and theme'
        }
      }
    }
  },
  fr: {
    adminDashboard: {
      title: 'Tableau de bord d\'administration',
      subtitle: 'Gérez tous les aspects de la plateforme depuis un seul endroit',
      sections: {
        billing: {
          title: 'Facturation & Paiements'
        },
        system: {
          title: 'Gestion du Système'
        },
        content: {
          title: 'Contenu & Scénarios'
        },
        debug: {
          title: 'Débogage & Surveillance'
        }
      },
      items: {
        plans: {
          title: 'Plans',
          description: 'Gérer les plans d\'abonnement et tarifs'
        },
        features: {
          title: 'Fonctionnalités',
          description: 'Gérer le catalogue de fonctionnalités'
        },
        invoices: {
          title: 'Factures',
          description: 'Voir toutes les factures du système'
        },
        cleanup: {
          title: 'Nettoyage',
          description: 'Gérer et nettoyer les anciennes factures'
        },
        organizations: {
          title: 'Organisations',
          description: 'Gérer les backends et plans des organisations'
        },
        users: {
          title: 'Gestion des utilisateurs',
          description: 'Parcourez tous les utilisateurs avec leurs appartenances organisations/groupes, et incarnez n’importe quel utilisateur pour le débogage.'
        },
        backends: {
          title: 'Backends',
          description: 'Gérer les serveurs backend de terminal'
        },
        security: {
          title: 'Sécurité',
          description: 'Vue des politiques RBAC et vérifications'
        },
        import: {
          title: 'Importation',
          description: 'Importer des utilisateurs et groupes'
        },
        emailTemplates: {
          title: 'Modèles d\'Email',
          description: 'Gérer les modèles de notifications email'
        },
        scenarios: {
          title: 'Scénarios',
          description: 'Gérer les scénarios de TP interactifs'
        },
        steps: {
          title: 'Étapes',
          description: 'Gérer le contenu des étapes de scénario'
        },
        sessions: {
          title: 'Sessions',
          description: 'Suivre les sessions de scénario actives'
        },
        featureFlags: {
          title: 'Drapeaux',
          description: 'Gérer les drapeaux de fonctionnalités'
        },
        designSystem: {
          title: 'Système de Design',
          description: 'Audit visuel des variables CSS et du thème'
        }
      }
    }
  }
})

const expandedSections = ref(new Set<string>(['billing', 'system', 'content', 'debug']))

const dashboardSections = computed(() => [
  {
    id: 'billing',
    title: t('adminDashboard.sections.billing.title'),
    icon: 'fas fa-credit-card',
    items: [
      {
        route: '/admin/subscription-plans',
        title: t('adminDashboard.items.plans.title'),
        description: t('adminDashboard.items.plans.description'),
        icon: 'fas fa-tags'
      },
      {
        route: '/admin/plan-features',
        title: t('adminDashboard.items.features.title'),
        description: t('adminDashboard.items.features.description'),
        icon: 'fas fa-puzzle-piece'
      },
      {
        route: '/invoices',
        title: t('adminDashboard.items.invoices.title'),
        description: t('adminDashboard.items.invoices.description'),
        icon: 'fas fa-file-invoice-dollar'
      },
      {
        route: '/admin/invoice-cleanup',
        title: t('adminDashboard.items.cleanup.title'),
        description: t('adminDashboard.items.cleanup.description'),
        icon: 'fas fa-broom'
      }
    ]
  },
  {
    id: 'system',
    title: t('adminDashboard.sections.system.title'),
    icon: 'fas fa-server',
    items: [
      {
        route: '/admin/organizations',
        title: t('adminDashboard.items.organizations.title'),
        description: t('adminDashboard.items.organizations.description'),
        icon: 'fas fa-building'
      },
      {
        route: '/admin/users',
        title: t('adminDashboard.items.users.title'),
        description: t('adminDashboard.items.users.description'),
        icon: 'fas fa-users-cog'
      },
      {
        route: '/admin/terminal-metrics',
        title: t('adminDashboard.items.backends.title'),
        description: t('adminDashboard.items.backends.description'),
        icon: 'fas fa-server'
      },
      {
        route: '/admin/security',
        title: t('adminDashboard.items.security.title'),
        description: t('adminDashboard.items.security.description'),
        icon: 'fas fa-user-shield'
      }
    ]
  },
  {
    id: 'content',
    title: t('adminDashboard.sections.content.title'),
    icon: 'fas fa-edit',
    items: [
      {
        route: '/admin/bulk-import',
        title: t('adminDashboard.items.import.title'),
        description: t('adminDashboard.items.import.description'),
        icon: 'fas fa-file-import'
      },
      {
        route: '/admin/email-templates',
        title: t('adminDashboard.items.emailTemplates.title'),
        description: t('adminDashboard.items.emailTemplates.description'),
        icon: 'fas fa-envelope'
      },
      {
        route: '/admin/scenarios',
        title: t('adminDashboard.items.scenarios.title'),
        description: t('adminDashboard.items.scenarios.description'),
        icon: 'fas fa-flask'
      },
      {
        route: '/admin/scenario-steps',
        title: t('adminDashboard.items.steps.title'),
        description: t('adminDashboard.items.steps.description'),
        icon: 'fas fa-list-ol'
      },
      {
        route: '/admin/scenario-sessions',
        title: t('adminDashboard.items.sessions.title'),
        description: t('adminDashboard.items.sessions.description'),
        icon: 'fas fa-play-circle'
      }
    ]
  },
  {
    id: 'debug',
    title: t('adminDashboard.sections.debug.title'),
    icon: 'fas fa-bug',
    items: [
      {
        route: '/debug/feature-flags',
        title: t('adminDashboard.items.featureFlags.title'),
        description: t('adminDashboard.items.featureFlags.description'),
        icon: 'fas fa-flag'
      },
      {
        route: '/debug/design-system',
        title: t('adminDashboard.items.designSystem.title'),
        description: t('adminDashboard.items.designSystem.description'),
        icon: 'fas fa-palette'
      }
    ]
  }
])

function toggleSection(sectionId: string) {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId)
  } else {
    expandedSections.value.add(sectionId)
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.dashboard-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.dashboard-header h1 {
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.dashboard-header h1 i {
  color: var(--color-primary);
}

.dashboard-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  max-width: 600px;
  margin: 0 auto;
}

.dashboard-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.dashboard-section {
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-sm);
}

.section-card {
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: background-color var(--transition-slow);
}

.section-card:hover {
  background-color: var(--color-bg-secondary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.section-title i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.section-title h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.section-toggle i {
  color: var(--color-text-muted);
  transition: transform var(--transition-slow);
}

.section-toggle i.rotated {
  transform: rotate(180deg);
}

.section-content {
  border-top: var(--border-width-thin) solid var(--color-border-light);
  background-color: var(--color-bg-secondary);
}

.dashboard-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
}

.dashboard-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  text-decoration: none;
  color: inherit;
  background: var(--color-bg-primary);
  transition: all var(--transition-slow);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.dashboard-item:hover {
  background-color: var(--color-primary-light);
  transform: translateX(5px);
}

.item-icon {
  margin-right: var(--spacing-lg);
  flex-shrink: 0;
}

.item-icon i {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  width: 30px;
  text-align: center;
}

.item-content {
  flex-grow: 1;
}

.item-content h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.item-content p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.item-arrow {
  margin-left: var(--spacing-md);
  flex-shrink: 0;
}

.item-arrow i {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: var(--spacing-sm);
  }

  .dashboard-header h1 {
    font-size: var(--font-size-3xl);
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .dashboard-description {
    font-size: var(--font-size-md);
  }

  .section-card {
    padding: var(--spacing-lg);
  }

  .dashboard-items {
    grid-template-columns: 1fr;
  }

  .dashboard-item {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .item-icon {
    margin-right: var(--spacing-md);
  }
}
</style>
