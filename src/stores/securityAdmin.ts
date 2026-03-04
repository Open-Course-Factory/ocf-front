/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'

// Types
export interface PolicyRule {
  resource: string
  methods: string[]
}

export interface PolicySubject {
  subject: string
  policies: PolicyRule[]
}

export interface PolicyOverview {
  role_policies: PolicySubject[]
  user_policies: PolicySubject[]
  total_policies: number
}

export interface EntityRoleEntry {
  entity_name: string
  role_methods: Record<string, string[]>
}

export interface EntityRoleMatrix {
  entities: EntityRoleEntry[]
}

export interface HealthFinding {
  severity: string
  category: string
  description: string
  details?: string
}

export interface HealthSummary {
  high_count: number
  medium_count: number
  low_count: number
  info_count: number
}

export interface PolicyHealthCheck {
  findings: HealthFinding[]
  summary: HealthSummary
}

export interface UserPermissionLookup {
  user_id: string
  permissions: { resource: string; methods: string[] }[]
  roles: string[]
  is_system_admin: boolean
  entity_memberships: Record<string, any[]>
  aggregated_features: string[]
  can_create_organization: boolean
  can_create_group: boolean
  has_any_subscription: boolean
}

export const useSecurityAdminStore = defineStore('securityAdmin', () => {
  // State
  const policyOverview = ref<PolicyOverview | null>(null)
  const userPermissions = ref<UserPermissionLookup | null>(null)
  const entityRoleMatrix = ref<EntityRoleMatrix | null>(null)
  const healthChecks = ref<PolicyHealthCheck | null>(null)
  const isLoading = ref(false)
  const error = ref('')

  // Translations
  useStoreTranslations({
    en: {
      securityAdmin: {
        pageTitle: 'Security Administration',
        pageDescription: 'View and inspect Casbin permission policies, user permissions, and system health.',
        policyOverview: 'Policy Overview',
        userPermissions: 'User Permission Lookup',
        entityRoles: 'Entity Role Matrix',
        healthChecks: 'Policy Health Checks',
        rolePolicies: 'Role-Based Policies',
        userPolicies: 'User-Specific Policies',
        totalPolicies: 'Total Policies',
        resource: 'Resource',
        methods: 'Methods',
        searchUser: 'Search by name or email...',
        search: 'Search',
        searchingUsers: 'Searching...',
        noUserFound: 'No user found',
        roles: 'Roles',
        permissions: 'Permissions',
        memberships: 'Memberships',
        systemAdmin: 'System Administrator',
        entity: 'Entity',
        role: 'Role',
        severity: 'Severity',
        category: 'Category',
        description: 'Description',
        details: 'Details',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        info: 'Info',
        noData: 'No data available',
        loading: 'Loading...',
        errorLoading: 'Failed to load data',
        refresh: 'Refresh',
        noPolicies: 'No policies found',
        noFindings: 'No issues found - all checks passed',
        subject: 'Subject',
        findings: 'Findings',
        features: 'Features',
        canCreateOrg: 'Can Create Organization',
        canCreateGroup: 'Can Create Group',
        hasSubscription: 'Has Subscription',
        yes: 'Yes',
        no: 'No'
      },
      navigation: {
        securityAdmin: 'Security',
        securityAdminTitle: 'View Casbin security policies and permissions'
      }
    },
    fr: {
      securityAdmin: {
        pageTitle: 'Administration Sécurité',
        pageDescription: 'Consulter et inspecter les politiques Casbin, les permissions utilisateur et la santé du système.',
        policyOverview: 'Vue des Politiques',
        userPermissions: 'Recherche Permissions Utilisateur',
        entityRoles: 'Matrice Entité/Rôle',
        healthChecks: 'Vérifications de Santé',
        rolePolicies: 'Politiques par Rôle',
        userPolicies: 'Politiques par Utilisateur',
        totalPolicies: 'Total des Politiques',
        resource: 'Ressource',
        methods: 'Méthodes',
        searchUser: 'Rechercher par nom ou email...',
        search: 'Rechercher',
        searchingUsers: 'Recherche...',
        noUserFound: 'Aucun utilisateur trouvé',
        roles: 'Rôles',
        permissions: 'Permissions',
        memberships: 'Appartenances',
        systemAdmin: 'Administrateur Système',
        entity: 'Entité',
        role: 'Rôle',
        severity: 'Sévérité',
        category: 'Catégorie',
        description: 'Description',
        details: 'Détails',
        high: 'Élevée',
        medium: 'Moyenne',
        low: 'Faible',
        info: 'Info',
        noData: 'Aucune donnée disponible',
        loading: 'Chargement...',
        errorLoading: 'Erreur de chargement',
        refresh: 'Actualiser',
        noPolicies: 'Aucune politique trouvée',
        noFindings: 'Aucun problème trouvé - toutes les vérifications sont passées',
        subject: 'Sujet',
        findings: 'Résultats',
        features: 'Fonctionnalités',
        canCreateOrg: 'Peut Créer une Organisation',
        canCreateGroup: 'Peut Créer un Groupe',
        hasSubscription: 'A un Abonnement',
        yes: 'Oui',
        no: 'Non'
      },
      navigation: {
        securityAdmin: 'Sécurité',
        securityAdminTitle: 'Voir les politiques de sécurité Casbin et les permissions'
      }
    }
  })

  // Actions
  async function fetchPolicyOverview() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await axios.get('/admin/security/policies')
      policyOverview.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserPermissions(userId: string) {
    isLoading.value = true
    error.value = ''
    try {
      const response = await axios.get('/admin/security/user-permissions', { params: { userId } })
      userPermissions.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEntityRoleMatrix() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await axios.get('/admin/security/entity-roles')
      entityRoleMatrix.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHealthChecks() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await axios.get('/admin/security/health-checks')
      healthChecks.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    policyOverview, userPermissions, entityRoleMatrix, healthChecks,
    isLoading, error,
    fetchPolicyOverview, fetchUserPermissions, fetchEntityRoleMatrix, fetchHealthChecks
  }
})
