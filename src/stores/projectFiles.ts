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
import { computed } from 'vue'
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useProjectFilesStore = defineStore('project-files', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            projectFiles: {
                pageTitle: 'Project Files',
                name: 'Name',
                relPath: 'Relative Path',
                contentType: 'Content Type',
                content: 'Content',
                storageType: 'Storage Type',
                sizeBytes: 'Size (bytes)',
                createdAt: 'Created At',
                updatedAt: 'Updated At',
                typeScript: 'Script',
                typeMarkdown: 'Markdown',
                typeText: 'Text'
            }
        },
        fr: {
            projectFiles: {
                pageTitle: 'Fichiers Projet',
                name: 'Nom',
                relPath: 'Chemin relatif',
                contentType: 'Type de contenu',
                content: 'Contenu',
                storageType: 'Type de stockage',
                sizeBytes: 'Taille (octets)',
                createdAt: 'Date de création',
                updatedAt: 'Date de modification',
                typeScript: 'Script',
                typeMarkdown: 'Markdown',
                typeText: 'Texte'
            }
        }
    })

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('name', t('projectFiles.name')).input().visible().creatable().updatable().required(),
        field('rel_path', t('projectFiles.relPath')).input().visible().creatable().updatable(),
        field('content_type', t('projectFiles.contentType')).select().visible().creatable().updatable().required().withOptions([
            { value: 'script', text: t('projectFiles.typeScript') },
            { value: 'markdown', text: t('projectFiles.typeMarkdown') },
            { value: 'text', text: t('projectFiles.typeText') }
        ]),
        field('content', t('projectFiles.content')).textarea().visible().creatable().updatable().required(),
        field('storage_type', t('projectFiles.storageType')).input().visible().readonly(),
        field('size_bytes', t('projectFiles.sizeBytes')).input().visible().readonly(),
        field('created_at', t('projectFiles.createdAt')).input().visible().readonly(),
        field('updated_at', t('projectFiles.updatedAt')).input().visible().readonly()
    ]))

    return { ...base, fieldList }
})
