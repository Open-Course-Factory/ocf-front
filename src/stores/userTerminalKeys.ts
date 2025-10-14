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
import { ref } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useUserTerminalKeysStore = defineStore('userTerminalKeys', () => {

    const base = useBaseStore();

    // État spécifique aux clés terminal
    const currentKey = ref(null)
    const isLoading = ref(false)
    const error = ref('')
    const isRegenerating = ref(false)

    const { t } = useStoreTranslations({
        en: {
            userTerminalKeys: {
                pageTitle: 'Terminal Access Keys',
                key_name: 'Key Name',
                is_active: 'Active',
                max_sessions: 'Max Sessions',
                regenerate: 'Regenerate Key',
                noKeyFound: 'No terminal key found',
                keyRegenerated: 'Terminal key regenerated successfully',
                confirmRegenerate: 'Are you sure you want to regenerate your terminal key?',
                keyDetails: 'Key Details',
                securityWarning: 'Keep your terminal key secure.',
                active: 'Active',
                inactive: 'Inactive'
            }
        },
        fr: {
            userTerminalKeys: {
                pageTitle: 'Clés d\'accès Terminal',
                key_name: 'Nom de la clé',
                is_active: 'Active',
                max_sessions: 'Nombre max de sessions',
                regenerate: 'Régénérer la clé',
                noKeyFound: 'Aucune clé terminal trouvée',
                keyRegenerated: 'Clé terminal régénérée avec succès',
                confirmRegenerate: 'Êtes-vous sûr de vouloir régénérer votre clé terminal ?',
                keyDetails: 'Détails de la clé',
                securityWarning: 'Gardez votre clé terminal sécurisée.',
                active: 'Active',
                inactive: 'Inactive'
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', 'ID').input().visible().readonly(),
        field('key_name', t('userTerminalKeys.key_name')).input().visible().readonly(),
        field('is_active', t('userTerminalKeys.is_active')).input().visible().readonly(),
        field('max_sessions', t('userTerminalKeys.max_sessions')).input().visible().readonly(),
        field('created_at', 'Created at').input().visible().readonly(),
    ])

    // Actions spécifiques aux clés terminal
    const getMyTerminalKey = async () => {
        isLoading.value = true
        error.value = ''
        
        try {
            const response = await axios.get('/user-terminal-keys/my-key')
            currentKey.value = response.data
            base.entities = [response.data]
            return response.data
        } catch (err: any) {
            if (err.response?.status === 404) {
                currentKey.value = null
                base.entities = []
            } else {
                error.value = err.response?.data?.error_message || 'Erreur de chargement'
            }
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const regenerateTerminalKey = async () => {
        isRegenerating.value = true
        error.value = ''
        
        try {
            const response = await axios.post('/user-terminal-keys/regenerate')
            await getMyTerminalKey()
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur de régénération'
            throw err
        } finally {
            isRegenerating.value = false
        }
    }

    return {
        ...base, 
        fieldList,
        currentKey,
        isLoading,
        error,
        isRegenerating,
        getMyTerminalKey,
        regenerateTerminalKey
    }
})