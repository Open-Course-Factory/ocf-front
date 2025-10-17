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
                maxMembersHelp: "Maximum number of members allowed in this group",
                expiresAtHelp: "Optional expiration date for the group",
                statusActive: "Active",
                statusInactive: "Inactive",
                statusFull: "FULL",
                statusExpired: "EXPIRED"
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
                maxMembersHelp: "Nombre maximum de membres autorisés dans ce groupe",
                expiresAtHelp: "Date d'expiration optionnelle pour le groupe",
                statusActive: "Actif",
                statusInactive: "Inactif",
                statusFull: "COMPLET",
                statusExpired: "EXPIRÉ"
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('classGroups.id')).input().hidden().readonly(),
        field('name', t('classGroups.name')).input().visible().readonly(), // Auto-generated from display_name
        field('display_name', t('classGroups.display_name')).input().visible().editable(),
        field('description', t('classGroups.description')).textarea().visible().editable(),
        field('max_members', t('classGroups.max_members')).number().visible().editable(),
        field('expires_at', t('classGroups.expires_at')).date().visible().editable().withDateFormat(),
        field('is_active', t('classGroups.is_active')).checkbox().visible().editable(),
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
        return data
    })

    // Hook to auto-generate slug from display_name before updating (if display_name changed)
    base.setBeforeUpdateHook(async (data: any) => {
        if (data.display_name && !data.name) {
            data.name = generateSlug(data.display_name)
        }
        return data
    })

    // Override loadEntities to use correct endpoint
    const loadEntities = async () => {
        return await base.loadEntities('/class-groups')
    }

    // Override getOne to use correct endpoint
    const getOne = async (groupId: string) => {
        return await base.getOne('/class-groups', groupId)
    }

    return {
        ...base,
        fieldList,
        loadEntities,
        getOne
    }
})
