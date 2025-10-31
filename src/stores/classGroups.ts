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

import { defineStore } from "pinia"
import axios from "axios"
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

/**
 * Generate URL-friendly slug from display name
 * Converts: "My Class 2024" → "my-class-2024"
 */
function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

export const useClassGroupsStore = defineStore('classGroups', () => {
    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            classGroups: {
                id: "ID",
                pageTitle: "Groups",
                name: "URL slug (auto-generated)",
                display_name: "Display name",
                description: "Description",
                owner_user_id: "Owner",
                subscription_plan_id: "Subscription plan",
                parent_group_id: "Parent group",
                max_members: "Maximum members",
                member_count: "Current members",
                expires_at: "Expiration date",
                is_active: "Active",
                is_full: "Full",
                is_expired: "Expired",
                metadata: "Metadata",
                created_at: "Created",
                updated_at: "Updated",
                modify: "Modify group",
                add: "Create a group",
                delete: "Delete group",
                manageMembers: "Manage members",
                noGroups: "No groups found",
                loading: "Loading groups...",
                saving: "Saving...",
                createSuccess: "Group created successfully",
                updateSuccess: "Group updated successfully",
                deleteSuccess: "Group deleted successfully",
                loadError: "Failed to load groups",
                createError: "Failed to create group",
                updateError: "Failed to update group",
                deleteError: "Failed to delete group",
                groupInfo: "Manage your classes and teams",
                nameHelp: "Auto-generated from display name (lowercase, hyphens only)",
                displayNameHelp: "Human-readable name for the group",
                parentGroupHelp: "Optional parent group for hierarchical organization",
                maxMembersHelp: "Maximum number of members allowed in this group",
                expiresAtHelp: "Optional expiration date for the group",
                statusActive: "Active",
                statusInactive: "Inactive",
                statusFull: "FULL",
                statusExpired: "EXPIRED",
                noneParentGroup: "None (top-level group)",
                subgroupNames: "Subgroups (one per line)",
                subgroupNamesHelp: "Enter subgroup names, one per line. They will be created automatically."
            }
        },
        fr: {
            classGroups: {
                id: "ID",
                pageTitle: "Groupes",
                name: "Slug URL (auto-généré)",
                display_name: "Nom d'affichage",
                description: "Description",
                owner_user_id: "Propriétaire",
                subscription_plan_id: "Plan d'abonnement",
                parent_group_id: "Groupe parent",
                max_members: "Membres maximum",
                member_count: "Membres actuels",
                expires_at: "Date d'expiration",
                is_active: "Actif",
                is_full: "Complet",
                is_expired: "Expiré",
                metadata: "Métadonnées",
                created_at: "Créé",
                updated_at: "Modifié",
                modify: "Modifier le groupe",
                add: "Créer un groupe",
                delete: "Supprimer le groupe",
                manageMembers: "Gérer les membres",
                noGroups: "Aucun groupe trouvé",
                loading: "Chargement des groupes...",
                saving: "Enregistrement...",
                createSuccess: "Groupe créé avec succès",
                updateSuccess: "Groupe mis à jour avec succès",
                deleteSuccess: "Groupe supprimé avec succès",
                loadError: "Échec du chargement des groupes",
                createError: "Échec de la création du groupe",
                updateError: "Échec de la mise à jour du groupe",
                deleteError: "Échec de la suppression du groupe",
                groupInfo: "Gérez vos classes et équipes",
                nameHelp: "Auto-généré depuis le nom d'affichage (minuscules, tirets uniquement)",
                displayNameHelp: "Nom lisible pour le groupe",
                parentGroupHelp: "Groupe parent optionnel pour une organisation hiérarchique",
                maxMembersHelp: "Nombre maximum de membres autorisés dans ce groupe",
                expiresAtHelp: "Date d'expiration optionnelle pour le groupe",
                statusActive: "Actif",
                statusInactive: "Inactif",
                statusFull: "COMPLET",
                statusExpired: "EXPIRÉ",
                noneParentGroup: "Aucun (groupe de niveau supérieur)",
                subgroupNames: "Sous-groupes (un par ligne)",
                subgroupNamesHelp: "Entrez les noms des sous-groupes, un par ligne. Ils seront créés automatiquement."
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('classGroups.id')).input().hidden().readonly(),
        field('name', t('classGroups.name')).input().visible().readonly(), // Auto-generated from display_name
        field('display_name', t('classGroups.display_name')).input().visible().editable(),
        field('description', t('classGroups.description')).textarea().visible().editable(),
        field('parent_group_id', t('classGroups.parent_group_id'))
            .searchableSelect()
            .visible()
            .editable()
            .withOptionsLoader(async () => {
                try {
                    const groups = await base.loadEntities('/class-groups')
                    return [
                        { id: null, display_name: t('classGroups.noneParentGroup') },
                        ...groups
                    ]
                } catch (error) {
                    console.error('Failed to load parent groups:', error)
                    return [{ id: null, display_name: t('classGroups.noneParentGroup') }]
                }
            })
            .withItemValue('id')
            .withItemText('display_name')
            .placeholder(t('classGroups.parentGroupHelp')),
        field('max_members', t('classGroups.max_members')).number().visible().editable(),
        field('expires_at', t('classGroups.expires_at')).date().visible().editable().withDateFormat(),
        field('is_active', t('classGroups.is_active')).checkbox().visible().editable(),
        field('subgroup_names', t('classGroups.subgroupNames'))
            .textarea()
            .visible()
            .creatable()  // Only show during creation, not editing
            .placeholder(t('classGroups.subgroupNamesHelp'))
            .hint(t('classGroups.subgroupNamesHelp')),
        field('member_count', t('classGroups.member_count')).number().visible().readonly(),
        field('owner_user_id', t('classGroups.owner_user_id')).input().hidden().readonly(),
        field('created_at', t('classGroups.created_at')).input().visible().readonly().withDateTimeFormat(),
        field('updated_at', t('classGroups.updated_at')).input().visible().readonly().withDateTimeFormat(),
    ])

    // Hook to auto-generate slug from display_name before creating
    base.setBeforeCreateHook(async (data: any) => {
        if (data.display_name && !data.name) {
            data.name = generateSlug(data.display_name)
        }
        // Handle parent_group_id conversion to backend camelCase
        if (data.parent_group_id !== undefined) {
            data.parentGroupID = data.parent_group_id
        }
        // Remove subgroup_names from data sent to backend (it's UI-only)
        const { subgroup_names, ...cleanData } = data
        return cleanData
    })

    // Hook to create subgroups after parent group is created
    base.setAfterCreateHook(async (createdGroup: any, originalData: any) => {
        // Check if subgroup names were provided
        if (originalData.subgroup_names && typeof originalData.subgroup_names === 'string') {
            const subgroupNames = originalData.subgroup_names
                .split('\n')
                .map((name: string) => name.trim())
                .filter((name: string) => name.length > 0)

            // Create each subgroup
            for (const displayName of subgroupNames) {
                try {
                    await base.createEntity('/class-groups', {
                        display_name: displayName,
                        name: generateSlug(displayName),
                        parent_group_id: createdGroup.id,
                        parentGroupID: createdGroup.id,
                        max_members: originalData.max_members || 30,
                        is_active: true
                    })
                } catch (error) {
                    console.error(`Failed to create subgroup "${displayName}":`, error)
                }
            }
        }
    })

    // Hook to auto-generate slug from display_name before updating (if display_name changed)
    base.setBeforeUpdateHook(async (data: any) => {
        if (data.display_name && !data.name) {
            data.name = generateSlug(data.display_name)
        }
        // Handle parent_group_id conversion to backend camelCase
        if (data.parent_group_id !== undefined) {
            data.parentGroupID = data.parent_group_id
        }
        return data
    })

    // Override loadEntities to use correct endpoint
    const loadEntities = async () => {
        return await base.loadEntities('/class-groups')
    }

    // Override getOne to use correct endpoint with optional includes
    const getOne = async (groupId: string, includes?: string[]) => {
        if (!includes || includes.length === 0) {
            return await base.getOne('/class-groups', groupId)
        }

        // Custom implementation with includes parameter
        try {
            base.isLoading.value = true
            base.error.value = ''

            const includeParam = includes.join(',')
            const url = `/class-groups/${groupId}?include=${includeParam}`

            const response = await axios.get(url)
            return response.data
        } catch (err: any) {
            base.error.value = err.response?.data?.error_message ||
                               err.response?.data?.message ||
                               t('classGroups.loadError')
            throw err
        } finally {
            base.isLoading.value = false
        }
    }

    return {
        ...base,
        fieldList,
        loadEntities,
        getOne
    }
})
