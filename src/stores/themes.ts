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
import {useBaseStore} from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'


export const useThemesStore = defineStore('themes', () => {

    const base = useBaseStore();

    const { t } = useStoreTranslations({
        en: {
            themes: {
                id: "id",
                pageTitle: "Themes",
                name: 'Theme Name',
                repository: 'Repository',
                repositoryBranch: 'Branch',
                size: 'Size',
                modify: 'Modify the theme',
                add: 'Add a theme',
            }
        },
        fr: {
            themes: {
                id: "id",
                pageTitle: "Themes",
                name: 'Nom du theme',
                repository: 'Adresse du dépôt',
                repositoryBranch: 'Branche',
                size: 'Taille',
                modify: 'Modifier le theme',
                add: 'Ajouter le theme',
            }
        }
    })

    
    const fieldList = buildFieldList([
        field('id', t('themes.id')).input().hidden().readonly(),
        field('name', t('themes.name')).input().visible().editable(),
        field('repository', t('themes.repository')).input().visible().editable(),
        field('repositoryBranch', t('themes.repositoryBranch')).input().visible().editable(),
        field('size', t('themes.size')).input().visible().editable(),
    ])

    
    return {...base, fieldList}
})