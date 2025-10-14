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
import { useBaseStore } from "./baseStore";
import { useStoreTranslations } from '../composables/useTranslations'

export const useSshKeysStore = defineStore('SshKeys', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            sshkeys: {
                id: "id",
                pageTitle: "Ssh Keys list",
                name: 'Key name',
                value: 'Key value (PRIVATE)',
                modify: 'Modify SSH key name',
                add: 'Add a SSH key',
                description: 'Manage your SSH keys for terminal access',
                noKeys: 'No SSH keys configured yet',
                loading: 'Loading...',
                saving: 'Saving...',
                unknown: 'Unknown'
            }
        },
        fr: {
            sshkeys: {
                id: "id",
                pageTitle: "Liste des clés SSH",
                name: 'Nom de la clé',
                value: 'Valeur de la clé (PRIVEE)',
                modify: 'Modifier le nom de la clé SSH',
                add: 'Ajouter une clé SSH',
                description: 'Gérez vos clés SSH pour l\'accès aux terminaux',
                noKeys: 'Aucune clé SSH configurée pour le moment',
                loading: 'Chargement...',
                saving: 'Enregistrement...',
                unknown: 'Inconnu'
            }
        }
    })
    
    const fieldList = new Map<string, any>([
        ["id", { label: t('sshkeys.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('sshkeys.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["private_key", { label: t('sshkeys.value'), type: "textarea", display: false, toBeSet: true, toBeEdited: false }],
        ["created_at", { label: t('created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    // Enable prevention of last object deletion for SSH keys
    base.preventLastObjectDeletion.value = true

    // Override loadEntities to use correct endpoint
    const loadEntities = async () => {
        return await base.loadEntities('/ssh-keys')
    }

    return {
        ...base,
        fieldList,
        loadEntities
    }
})