/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
import { useI18n } from "vue-i18n"
import { usePagesStore } from "./pages"
import { useBaseStore } from "./baseStore"


export const useSectionsStore = defineStore('sections', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { sections : { 
        fileName : 'File name',
        title: 'Sections',
        number: 'Number',
        intro: 'Introduction',
        conclusion: 'Conclusion',
        pages: 'Pages',
        hiddenPages: 'Hidden pages',
        modify: 'Modify the page', 
        add: 'Add a page',
    }})
    useI18n().mergeLocaleMessage('fr', { sections : { 
        fileName : 'Nom du fichier',
        title: 'Sections',
        number: 'Numero',
        intro: 'Introduction',
        conclusion: 'Conclusion',
        pages: 'Pages',
        hiddenPages: 'Pages cachées',
        modify: 'Modifier la page', 
        add: 'Ajouter une page',
     }})

    const fieldList = new Map<string, any>([
        ["id", { label: t('sections.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["fileName", { label: t('sections.fileName'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["title", { label: t('sections.title'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["intro", { label: t('sections.intro'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["conclusion", { label: t('sections.conclusion'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["number", { label: t('sections.number'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["pages", { label: t('connections.pages'), type: "advanced-textarea", display: true, toBeSet: false, toBeEdited: false }],
        ["hiddenPages", { label: t('connections.hiddenPages'), type: "advanced-textarea", display: true, toBeSet: false, toBeEdited: false }],
        ["created_at", { label: t('sections.created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('sections.updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["Pages", usePagesStore()],
    ])

    return {...base, fieldList}
})