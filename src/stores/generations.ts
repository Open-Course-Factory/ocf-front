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
import { useI18n } from "vue-i18n"
import { useBaseStore } from "./baseStore"
import { useSchedulesStore } from "./schedules";
import { useThemesStore } from "./themes";
import { useCoursesStore } from "./courses";
import { ref } from 'vue';
import { nextTick } from 'vue';
import axios from 'axios';

export const useGenerationsStore = defineStore('generations', () => {

    const base = useBaseStore();
    
    // État pour le polling des statuts
    const pollingIntervals = ref(new Map<string, NodeJS.Timeout>());

    useI18n().mergeLocaleMessage('en', { generations : { 
        id : "id",
        pageTitle : "Generations",
        name: 'Generation Name',
        courses: 'Course',
        themes: 'Theme',
        schedules: 'Schedule',
        format: 'Format',
        status: 'Status',
        progress: 'Progress',
        started_at: 'Started at',
        completed_at: 'Completed at',
        error_message: 'Error message',
        worker_job_id: 'Job ID',
        result_urls: 'Results',
        modify: 'Modify the generation', 
        add: 'Add a generation',
        download: 'Download',
        retry: 'Retry',
        checkStatus: 'Check Status',
        generating: 'Generating...',
        completed: 'Completed',
        failed: 'Failed',
        pending: 'Pending',
    }})
    useI18n().mergeLocaleMessage('fr', { generations : { 
        id : "id",
        pageTitle : "Générations",
        name: 'Nom de la génération',
        courses: 'Cours',
        themes: 'Thème',
        schedules: 'Emploi du temps',
        format: 'Format',
        status: 'Statut',
        progress: 'Progression',
        started_at: 'Démarré le',
        completed_at: 'Terminé le',
        error_message: 'Message d\'erreur',
        worker_job_id: 'ID du job',
        result_urls: 'Résultats',
        modify: 'Modifier la génération', 
        add: 'Ajouter une génération',
        download: 'Télécharger',
        retry: 'Réessayer',
        checkStatus: 'Vérifier le statut',
        generating: 'Génération en cours...',
        completed: 'Terminé',
        failed: 'Échec',
        pending: 'En attente',
     }})

    const { t } = useI18n()

    const fieldList = new Map<string, any>([
        ["id", { label: t('generations.id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["name", { label: t('generations.name'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["format", { label: t('generations.format'), type: "input", display: true, toBeSet: true, toBeEdited: true, required: true }],
        ["courses", { label: t('generations.courses'), type: "subentity", display: true, toBeSet: true, toBeEdited: false, required: true }],
        ["themes", { label: t('generations.themes'), type: "subentity", display: true, toBeSet: true, toBeEdited: false, required: true }],
        ["schedules", { label: t('generations.schedules'), type: "subentity", display: true, toBeSet: true, toBeEdited: false, required: true }],
        ["status", { label: t('generations.status'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["progress", { label: t('generations.progress'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["started_at", { label: t('generations.started_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["completed_at", { label: t('generations.completed_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["error_message", { label: t('generations.error_message'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["worker_job_id", { label: t('generations.worker_job_id'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["result_urls", { label: t('generations.result_urls'), type: "input", display: false, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["courses", useCoursesStore()],
        ["themes", useThemesStore()],
        ["schedules", useSchedulesStore()],
    ])

    const startStatusPolling = (generationId: string, initialInterval: number = 2000) => {
        if (pollingIntervals.value.has(generationId)) {
            clearInterval(pollingIntervals.value.get(generationId));
        }
        
        let currentInterval = initialInterval;
        let consecutiveUnchanged = 0;
        let lastStatus = '';
        
        const poll = async () => {
            try {
                const statusData = await checkGenerationStatus(generationId);
                
                if (statusData) {
                    // Si le statut n'a pas changé, augmenter l'intervalle
                    if (statusData.status === lastStatus) {
                        consecutiveUnchanged++;
                        // Augmenter progressivement l'intervalle : 2s -> 5s -> 10s -> 15s max
                        if (consecutiveUnchanged >= 3) {
                            currentInterval = Math.min(15000, currentInterval + 3000);
                        }
                    } else {
                        // Status a changé, revenir à l'intervalle initial
                        consecutiveUnchanged = 0;
                        currentInterval = initialInterval;
                        lastStatus = statusData.status;
                    }
                    
                    // Arrêter le polling si terminé
                    if (['completed', 'failed', 'client_error', 'tunnel_error'].includes(statusData.status?.toLowerCase())) {
                        stopStatusPolling(generationId);
                        return;
                    }
                }
            } catch (error) {
                console.error('Erreur lors du polling:', error);
                // En cas d'erreur, augmenter l'intervalle pour éviter le spam
                currentInterval = Math.min(30000, currentInterval * 2);
            }
            
            // Programmer le prochain poll avec l'intervalle mis à jour
            const intervalId = setTimeout(poll, currentInterval);
            pollingIntervals.value.set(generationId, intervalId);
        };
        
        // Démarrer immédiatement
        poll();
    };

    const stopStatusPolling = (generationId: string) => {
        if (pollingIntervals.value.has(generationId)) {
            const intervalId = pollingIntervals.value.get(generationId);
            clearTimeout(intervalId); // Utiliser clearTimeout au lieu de clearInterval
            pollingIntervals.value.delete(generationId);
        }
    };

    // Fonction pour vérifier le statut d'une génération
    const checkGenerationStatus = async (generationId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const protocol = import.meta.env.VITE_PROTOCOL;
            const { useCurrentUserStore } = await import('./currentUser');
            const currentUserStore = useCurrentUserStore();
            
            const response = await fetch(`${protocol}://${apiUrl}/api/v1/generations/${generationId}/status`, {
                headers: {
                    'Authorization': currentUserStore.secretToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const statusData = await response.json();
                
                console.log(`[Polling] Génération ${generationId}: ${statusData.status} (${statusData.progress || 0}%)`);
                
                // Trouver l'index de l'entité
                const entityIndex = base.entities.findIndex(e => e.id === generationId);
                if (entityIndex !== -1) {
                    // MÉTHODE 1: Remplacement complet de l'objet (plus sûr pour la réactivité)
                    const updatedEntity = {
                        ...base.entities[entityIndex],
                        ...statusData,
                        // S'assurer que les champs critiques sont présents
                        id: generationId, // Préserver l'ID
                        name: base.entities[entityIndex].name || statusData.name, // Préserver le nom local
                    };
                    
                    // Remplacer l'entité dans le tableau
                    base.entities.splice(entityIndex, 1, updatedEntity);
                    
                    // MÉTHODE 2: Alternative si la méthode 1 ne fonctionne pas
                    // Force Vue à détecter le changement
                    await nextTick();
                    
                    console.log(`[Polling] Entité mise à jour:`, updatedEntity);
                } else {
                    console.warn(`[Polling] Génération ${generationId} non trouvée dans le store`);
                }
                
                return statusData;
            } else {
                console.error(`[Polling] Erreur HTTP ${response.status} pour génération ${generationId}`);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            // Ne pas arrêter le polling en cas d'erreur réseau temporaire
            // stopStatusPolling(generationId);
        }
        
        return null;
    };

    // Fonction spécifique pour déclencher une génération après création
    const triggerGeneration = async (entity: any, originalData: any) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const protocol = import.meta.env.VITE_PROTOCOL;
            const { useCurrentUserStore } = await import('./currentUser');
            const { useLoginStore } = await import('./login');
            const currentUserStore = useCurrentUserStore();
            const loginStore = useLoginStore();

            // Préparer les données pour l'API de génération
            const generatePayload = {
                authorEmail: loginStore.email || currentUserStore.userName + '@example.com',
                format: parseInt(originalData.format) || 0,
                generationId: entity.id
            };

            console.log('Déclenchement de la génération avec:', generatePayload);

            const generateResponse = await axios.post(`${protocol}://${apiUrl}/api/v1/courses/generate`, generatePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': currentUserStore.secretToken,
                },
            });

            if (generateResponse.status === 202) {
                const generationResult = generateResponse.data;
                
                // Mettre à jour l'entité avec les informations de génération
                const entityIndex = base.entities.findIndex(e => e.id === entity.id);
                if (entityIndex !== -1) {
                    base.entities[entityIndex] = {
                        ...base.entities[entityIndex],
                        status: generationResult.status || 'pending',
                        worker_job_id: generationResult.generation_id,
                        started_at: new Date().toISOString()
                    };
                }

                // Démarrer le polling pour suivre le statut
                startStatusPolling(entity.id);

                console.log('Génération déclenchée avec succès:', generationResult);
            }
        } catch (error) {
            console.error('Erreur lors du déclenchement de la génération:', error);
            
            // Mettre à jour le statut comme échoué
            const entityIndex = base.entities.findIndex(e => e.id === entity.id);
            if (entityIndex !== -1) {
                base.entities[entityIndex] = {
                    ...base.entities[entityIndex],
                    status: 'failed',
                    error_message: 'Erreur lors du déclenchement de la génération: ' + (error.response?.data?.message || error.message)
                };
            }
        }
    };

    // Nettoyer les intervals quand le store est détruit
    const cleanup = () => {
        pollingIntervals.value.forEach((interval) => {
            clearInterval(interval);
        });
        pollingIntervals.value.clear();
    };

    // Configurer le hook afterCreate pour déclencher automatiquement la génération
    base.setAfterCreateHook(triggerGeneration);

    return {
        ...base, 
        fieldList,
        startStatusPolling,
        stopStatusPolling,
        checkGenerationStatus,
        cleanup
    }
})