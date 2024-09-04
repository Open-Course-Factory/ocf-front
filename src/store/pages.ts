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
import { Ref } from "vue"
import { useI18n } from "vue-i18n"


export const usePagesStore = defineStore('pages', () => {

    useI18n().mergeLocaleMessage('en', { pages : { 
        title : 'Pages list',
        name: 'Page Name',
        number: 'Page number',
        parent_section_title: 'Parent section title',
        toc: 'Table of Content',
        content: 'Content',
        hide: 'Hide page',
        modify: 'Modify the page', 
        add: 'Add a page',
    }})
    useI18n().mergeLocaleMessage('fr', { pages : { 
        title : 'Liste des pages',
        name: 'Nom de la page',
        number: 'Numéro de la page',
        parent_section_title: 'Titre de la section parente',
        toc: 'Table des contenus',
        content: 'Contenu',
        hide: 'Cacher la page',
        modify: 'Modifier la page', 
        add: 'Ajouter une page',
     }})

    const { t } = useI18n()

    const entities = []
    const fieldList = new Map<string, any>([
        ["id", { label: t('pages.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["number", { label: t('pages.number'), type: "input", display: true, toBeSet: false, toBeEdited: true }],
        ["parentSectionTitle", { label: t('pages.parent_section_title'), type: "input", display: true, toBeSet: false, toBeEdited: true }],
        ["toc", { label: t('pages.toc'), type: "input", display: true, toBeSet: false, toBeEdited: true }],
        ["content", { label: t('pages.content'), type: "advanced-textarea", display: true, toBeSet: true, toBeEdited: true }],
        ["hide", { label: t('pages.hide'), type: "input", display: true, toBeSet: false, toBeEdited: true }],
        ["created_at", { label: t('pages.created_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["updated_at", { label: t('pages.updated_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    const subEntitiesStores = new Map<string, any>([
    ])
    
    function setEntities(entities: any | Ref<any>) {
        this.entities = entities
    }

    function getNames(){
        let res = []
        
        this.entities.forEach( (value) => {
            res.push(value.name)
        })
        return res
    }

    function getIds(){
        let res = []
        
        this.entities.forEach( (value) => {
            res.push(value.id)
        })
        return res
    }

    return {entities, fieldList, subEntitiesStores, setEntities, getNames, getIds}
})