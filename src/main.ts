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

import { createI18n } from 'vue-i18n'
import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { piniaPluginPersist } from './piniaPluginPersist'
import { useCurrentUserStore } from './stores/currentUser'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'fr',
    fallbackLocale: 'en',
    messages: {
        en: { 
            empty: 'Nothing to display here',
            add: 'Add',
            edit: 'Edit',
            delete: 'Delete',
            created_at: 'Created at',
            updated_at: 'Updated at',
         },
        fr: { 
            empty: 'Rien à afficher ici',
            add: 'Ajouter',
            edit: 'Editer',
            delete: 'Supprimer',
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

createApp(App)
    .use(ElementPlus)
    .use(router)
    .use(pinia)
    .use(i18n)
    .use(vuetify)
    .mount('#app')

const userStore = useCurrentUserStore()
if (userStore.isAuthenticated) {
    userStore.startTokenExpiryCheck()
}