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
import { useBaseStore } from "./baseStore"
import { ref } from 'vue'
import axios from 'axios'

export const useTerminalsStore = defineStore('terminals', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    // État spécifique aux terminaux
    const activeSessions = ref([])
    const isLoading = ref(false)
    const error = ref('')

    useI18n().mergeLocaleMessage('en', { terminals : { 
        pageTitle: 'Terminal Sessions',
        session_id: 'Session ID',
        status: 'Status',
        expires_at: 'Expires at',
        terms: 'Terms of Service',
        expiry: 'Expiry (seconds)',
        add: 'Start a terminal session',
        start: 'Start Session',
        stop: 'Stop Session',
        connect: 'Connect to Console'
    }})
    
    useI18n().mergeLocaleMessage('fr', { terminals : { 
        pageTitle: 'Sessions Terminal',
        session_id: 'ID de session',
        status: 'Statut',
        expires_at: 'Expire le',
        terms: 'Conditions d\'utilisation',
        expiry: 'Expiration (secondes)',
        add: 'Démarrer une session terminal',
        start: 'Démarrer une session',
        stop: 'Arrêter la session',
        connect: 'Se connecter à la console'
    }})

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["session_id", { label: t('terminals.session_id'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["status", { label: t('terminals.status'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["expires_at", { label: t('terminals.expires_at'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["terms", { label: t('terminals.terms'), type: "textarea", display: false, toBeSet: true, toBeEdited: false, required: true }],
        ["expiry", { label: t('terminals.expiry'), type: "input", display: false, toBeSet: true, toBeEdited: false }],
        ["created_at", { label: "Created at", type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    // Actions spécifiques aux terminaux
    const startTerminalSession = async (sessionData: { terms: string, expiry?: number }) => {
        isLoading.value = true
        error.value = ''
        
        try {
            const response = await axios.post('/terminals/start-session', sessionData)
            await getUserSessions()
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors du démarrage'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const stopTerminalSession = async (terminalId: string) => {
        isLoading.value = true
        error.value = ''
        
        try {
            await axios.post(`/terminals/${terminalId}/stop`)
            await getUserSessions()
            return true
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors de l\'arrêt'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const getUserSessions = async () => {
        isLoading.value = true
        error.value = ''
        
        try {
            const response = await axios.get('/terminals/user-sessions')
            activeSessions.value = response.data || []
            base.entities = activeSessions.value
            return activeSessions.value
        } catch (err: any) {
            error.value = err.response?.data?.error_message || 'Erreur lors du chargement'
            activeSessions.value = []
            base.entities = []
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // const getConsoleWebSocketUrl = (terminalId: string, width?: number, height?: number) => {
    //     const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
    //     const apiUrl = import.meta.env.VITE_API_URL
    //     let url = `${protocol}://${apiUrl}/api/v1/terminals/${terminalId}/console`
        
    //     const params = new URLSearchParams()
    //     if (width) params.append('width', width.toString())
    //     if (height) params.append('height', height.toString())
        
    //     if (params.toString()) {
    //         url += `?${params.toString()}`
    //     }
        
    //     return url
    // }

    return {
        ...base, 
        fieldList,
        activeSessions,
        isLoading,
        error,
        startTerminalSession,
        stopTerminalSession,
        getUserSessions,
        //getConsoleWebSocketUrl
    }
})