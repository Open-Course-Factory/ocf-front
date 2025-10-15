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

import { createI18n } from 'vue-i18n'
import { createApp } from 'vue'
import './style.css'
import './assets/styles/main.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { piniaPluginPersist } from './piniaPluginPersist'
import { useCurrentUserStore } from './stores/currentUser'
import { setupAxiosInterceptors, setupAxiosDefaults } from './services/core/http'
import { getSavedLocale } from './services/core/storage'
import { featureFlagService } from './services/features'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: getSavedLocale(), // Use saved user preference
    fallbackLocale: 'en',
    messages: {
        en: {
            empty: 'Nothing to display here',
            add: 'Add',
            edit: 'Edit',
            delete: 'Delete',
            save: 'Save',
            cancel: 'Cancel',
            confirmDelete: 'Are you sure you want to delete this item?',
            created_at: 'Created at',
            updated_at: 'Updated at',
         },
        fr: {
            empty: 'Rien à afficher ici',
            add: 'Ajouter',
            edit: 'Editer',
            delete: 'Supprimer',
            save: 'Enregistrer',
            cancel: 'Annuler',
            confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            created_at: 'Date de création',
            updated_at: 'Date de modification',
        }
    }
})

declare module 'pinia' {
  export interface PiniaCustomProperties {
    entities: any
    selectDatas: any
    fieldList: Map<string, any>
    subEntitiesStores: Map<string, any>
    getSelectDatas(any): any
    executeAfterCreateHook,
    executeBeforeCreateHook,
    executeAfterUpdateHook,
    executeAfterDeleteHook
  }
}


const pinia = createPinia()
pinia.use(piniaPluginPersist)

const vuetify = createVuetify({
    components,
    directives,
  })

setupAxiosDefaults()
setupAxiosInterceptors()

// CRITICAL: Initialize app in correct order to prevent race conditions
// 1. Create app instance
// 2. Register Pinia (so stores can access localStorage/tokens)
// 3. Fetch feature flags (which needs token from Pinia store)
// 4. Mount app
console.log('🏴 Starting app initialization...')

async function initializeApp() {
    // Step 1: Create app instance and register Pinia FIRST
    // This allows tokenService and stores to work properly
    const app = createApp(App)
        .use(ElementPlus)
        .use(router)
        .use(pinia)  // ← Pinia must be registered before feature flags are fetched!
        .use(i18n)
        .use(vuetify)

    // Step 2: Now that Pinia is registered, stores can access persisted data
    // Initialize currentUser store to ensure token is loaded from localStorage
    const userStore = useCurrentUserStore()
    userStore.initializeAuth() // Initialize auth state from stored token
    console.log('🏴 Current user authenticated:', userStore.isAuthenticated)

    // Step 3: Clear any stale localStorage flags to prevent conflicts with backend
    // Backend is the source of truth, localStorage is only for emergency fallback
    const storedFlags = localStorage.getItem('ocf_feature_flags')
    if (storedFlags) {
        console.log('🏴 Clearing stale localStorage feature flags before initialization')
        localStorage.removeItem('ocf_feature_flags')
    }

    // Step 4: Fetch feature flags (now token is available if user is authenticated)
    try {
        console.log('🏴 Fetching feature flags from backend...')
        await featureFlagService.waitForInitialization()
        console.log('✅ Feature flags initialized successfully')
    } catch (err: any) {
        console.warn('⚠️ Feature flags initialization failed, using defaults:', err?.message || err)
    }

    // Step 5: Mount the app
    app.mount('#app')
    console.log('✅ App mounted successfully')

    // Step 6: Start token expiry monitoring if authenticated
    if (userStore.isAuthenticated) {
        userStore.startTokenExpiryCheck()
        console.log('🏴 Token expiry monitoring started')
    }
}

// Start app initialization
initializeApp()