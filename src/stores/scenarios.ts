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

import { defineStore } from "pinia"
import { computed } from 'vue'
import { useBaseStore } from "./baseStore"
import { useProjectFilesStore } from "./projectFiles"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import axios from 'axios'

export const useScenariosStore = defineStore('scenarios', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            scenarios: {
                pageTitle: 'Scenarios',
                name: 'Name',
                title: 'Title',
                description: 'Description',
                difficulty: 'Difficulty',
                estimatedTime: 'Estimated Time',
                estimated_time: 'Estimated Time',
                instanceType: 'Machine Size',
                instance_type: 'Machine Size',
                machineSize: 'Minimum Machine Size',
                sourceType: 'Source Type',
                source_type: 'Source Type',
                gitRepository: 'Git Repository',
                git_repository: 'Git Repository',
                gitBranch: 'Git Branch',
                git_branch: 'Git Branch',
                flagsEnabled: 'Flags Enabled',
                flags_enabled: 'Flags Enabled',
                gshEnabled: 'GSH Enabled',
                gsh_enabled: 'GSH Enabled',
                crashTraps: 'Crash Traps',
                crash_traps: 'Crash Traps',
                introText: 'Introduction Text',
                intro_text: 'Introduction Text',
                finishText: 'Finish Text',
                finish_text: 'Finish Text',
                setupScriptId: 'Setup Script',
                setup_script_id: 'Setup Script',
                introFileId: 'Intro File',
                intro_file_id: 'Intro File',
                finishFileId: 'Finish File',
                finish_file_id: 'Finish File',
                createdById: 'Created By',
                created_by_id: 'Created By',
                createdAt: 'Created At',
                created_at: 'Created At',
                updatedAt: 'Updated At',
                updated_at: 'Updated At',
                difficultyBeginner: 'Beginner',
                difficultyIntermediate: 'Intermediate',
                difficultyAdvanced: 'Advanced',
                sourceTypeGit: 'Git',
                sourceTypeUpload: 'Upload',
                sourceTypeBuiltin: 'Builtin',
                sourceTypeSeed: 'Seed',
                os_type: 'OS Type',
                osTypeDeb: 'Debian-based (apt)',
                osTypeRpm: 'RPM-based (dnf/yum)',
                osTypeApk: 'Alpine (apk)',
                osTypePacman: 'Arch-based (pacman)',
                isPublic: 'Public (available to all users)',
                is_public: 'Public',
                requiredFeatures: 'Required Features',
                requiredFeaturesHelp: 'Comma-separated list of required distribution features (e.g., docker,python3)',
                hostname: 'Container Hostname',
                hostnameHelp: 'Custom hostname displayed in the terminal prompt (e.g., webserver)',
                organization_id: 'Organization',
                allowed_flag_paths: 'Allowed Flag Paths',
                allowedFlagPathsHelp: 'Comma-separated list of allowed paths for flag deployment (e.g., /tmp/,/home/). Leave empty for defaults.',
                objectives: 'Objectives',
                prerequisites: 'Prerequisites'
            }
        },
        fr: {
            scenarios: {
                pageTitle: 'Scénarios',
                name: 'Nom',
                title: 'Titre',
                description: 'Description',
                difficulty: 'Difficulté',
                estimatedTime: 'Temps estimé',
                estimated_time: 'Temps estimé',
                instanceType: 'Taille machine',
                instance_type: 'Taille machine',
                machineSize: 'Taille machine minimum',
                sourceType: 'Type de source',
                source_type: 'Type de source',
                gitRepository: 'Dépôt Git',
                git_repository: 'Dépôt Git',
                gitBranch: 'Branche Git',
                git_branch: 'Branche Git',
                flagsEnabled: 'Drapeaux activés',
                flags_enabled: 'Drapeaux activés',
                gshEnabled: 'GSH activé',
                gsh_enabled: 'GSH activé',
                crashTraps: 'Pièges de crash',
                crash_traps: 'Pièges de crash',
                introText: 'Texte d\'introduction',
                intro_text: 'Texte d\'introduction',
                finishText: 'Texte de fin',
                finish_text: 'Texte de fin',
                setupScriptId: 'Script d\'installation',
                setup_script_id: 'Script d\'installation',
                introFileId: 'Fichier d\'introduction',
                intro_file_id: 'Fichier d\'introduction',
                finishFileId: 'Fichier de fin',
                finish_file_id: 'Fichier de fin',
                createdById: 'Créé par',
                created_by_id: 'Créé par',
                createdAt: 'Date de création',
                created_at: 'Date de création',
                updatedAt: 'Date de modification',
                updated_at: 'Date de modification',
                difficultyBeginner: 'Débutant',
                difficultyIntermediate: 'Intermédiaire',
                difficultyAdvanced: 'Avancé',
                sourceTypeGit: 'Git',
                sourceTypeUpload: 'Upload',
                sourceTypeBuiltin: 'Intégré',
                sourceTypeSeed: 'Seed',
                os_type: 'Type d\'OS',
                osTypeDeb: 'Debian (apt)',
                osTypeRpm: 'RPM (dnf/yum)',
                osTypeApk: 'Alpine (apk)',
                osTypePacman: 'Arch (pacman)',
                isPublic: 'Public (disponible pour tous les utilisateurs)',
                is_public: 'Public',
                requiredFeatures: 'Fonctionnalités requises',
                requiredFeaturesHelp: 'Liste de fonctionnalités de distribution requises, séparées par des virgules (ex. docker,python3)',
                hostname: 'Nom d\'hôte du conteneur',
                hostnameHelp: 'Nom d\'hôte personnalisé affiché dans le terminal (ex. webserver)',
                organization_id: 'Organisation',
                allowed_flag_paths: 'Chemins de drapeaux autorisés',
                allowedFlagPathsHelp: 'Liste de chemins autorisés pour le déploiement des drapeaux, séparés par des virgules (ex. /tmp/,/home/). Laisser vide pour les valeurs par défaut.',
                objectives: 'Objectifs',
                prerequisites: 'Prérequis'
            }
        }
    })

    const projectFilesStore = useProjectFilesStore()
    base.parentEntitiesStores = new Map<string, any>([
        ["setup_script_id", projectFilesStore],
        ["intro_file_id", projectFilesStore],
        ["finish_file_id", projectFilesStore],
    ])

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('name', t('scenarios.name')).input().visible().creatable().required(),
        field('title', t('scenarios.title')).input().visible().creatable().updatable().required(),
        field('description', t('scenarios.description')).textarea().visible().creatable().updatable(),
        field('objectives', t('scenarios.objectives')).textarea().visible().creatable().updatable(),
        field('prerequisites', t('scenarios.prerequisites')).textarea().visible().creatable().updatable(),
        field('difficulty', t('scenarios.difficulty')).select().visible().creatable().updatable().withOptions([
            { value: 'beginner', text: t('scenarios.difficultyBeginner') },
            { value: 'intermediate', text: t('scenarios.difficultyIntermediate') },
            { value: 'advanced', text: t('scenarios.difficultyAdvanced') }
        ]),
        field('estimated_time', t('scenarios.estimatedTime')).input().visible().creatable().updatable(),
        field('os_type', t('scenarios.os_type')).select().visible().creatable().updatable().required().withOptions([
            { value: 'deb', text: t('scenarios.osTypeDeb') },
            { value: 'rpm', text: t('scenarios.osTypeRpm') },
            { value: 'apk', text: t('scenarios.osTypeApk') },
            { value: 'pacman', text: t('scenarios.osTypePacman') }
        ]),
        field('instance_type', t('scenarios.machineSize'))
            .searchableSelect()
            .visible()
            .creatable()
            .updatable()
            .required()
            .withOptionsLoader(async () => {
                try {
                    const response = await axios.get('/terminals/sizes')
                    const sizes: string[] = response.data || []
                    return sizes.map(s => ({ value: s, text: s, id: s }))
                } catch {
                    return []
                }
            })
            .withItemValue('value')
            .withItemText('text'),
        field('required_features', t('scenarios.requiredFeatures')).input().visible().creatable().updatable()
            .hint(t('scenarios.requiredFeaturesHelp')),
        field('hostname', t('scenarios.hostname')).input().visible().creatable().updatable(),
        field('source_type', t('scenarios.sourceType')).select().visible().creatable().updatable().withOptions([
            { value: 'git', text: t('scenarios.sourceTypeGit') },
            { value: 'upload', text: t('scenarios.sourceTypeUpload') },
            { value: 'builtin', text: t('scenarios.sourceTypeBuiltin') },
            { value: 'seed', text: t('scenarios.sourceTypeSeed') }
        ]),
        field('git_repository', t('scenarios.gitRepository')).input().visible().creatable().updatable(),
        field('git_branch', t('scenarios.gitBranch')).input().visible().creatable().updatable(),
        field('is_public', t('scenarios.isPublic')).checkbox().visible().creatable().updatable(),
        field('flags_enabled', t('scenarios.flagsEnabled')).checkbox().visible().creatable().updatable(),
        field('gsh_enabled', t('scenarios.gshEnabled')).checkbox().visible().creatable().updatable(),
        field('crash_traps', t('scenarios.crashTraps')).checkbox().visible().creatable().updatable(),
        field('allowed_flag_paths', t('scenarios.allowed_flag_paths')).input().visible().creatable().updatable()
            .hint(t('scenarios.allowedFlagPathsHelp')),
        field('setup_script_id', t('scenarios.setupScriptId')).type('multi-select').visible().creatable().updatable(),
        field('intro_file_id', t('scenarios.introFileId')).type('multi-select').visible().creatable().updatable(),
        field('finish_file_id', t('scenarios.finishFileId')).type('multi-select').visible().creatable().updatable(),
        field('intro_text', t('scenarios.introText')).textarea().hidden(),
        field('finish_text', t('scenarios.finishText')).textarea().hidden(),
        field('created_by_id', t('scenarios.createdById')).input().visible().readonly(),
        field('created_at', t('scenarios.createdAt')).input().visible().readonly(),
        field('updated_at', t('scenarios.updatedAt')).input().visible().readonly()
    ]))

    return { ...base, fieldList }
})
