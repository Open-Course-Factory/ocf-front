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
import { createApp, Ref } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { piniaPluginPersist } from './piniaPluginPersist'

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
         },
        fr: { 
            empty: 'Rien à afficher ici',
            add: 'Ajouter',
            edit: 'Editer',
            delete: 'Supprimer',
        }
    }
})

declare module 'pinia' {
    export interface PiniaCustomProperties {
      // by using a setter we can allow both strings and refs
      set setEntity(value: any | Ref<any>)
      
      
  
      // you can define simpler values too
      entities: any
  

    }
  }

const pinia = createPinia()
pinia.use(piniaPluginPersist)

createApp(App)
    .use(ElementPlus)
    .use(router)
    .use(pinia)
    .use(i18n)
    .mount('#app')