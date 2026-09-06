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

import { PiniaPlugin } from 'pinia'

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    /**
     * `false` keeps the store out of localStorage. Default is to persist.
     *
     * Persist preferences; never persist what the backend decides for the
     * signed-in user. A restored decision reads as "already loaded" and is
     * never asked again, and localStorage outlives the session, so the
     * snapshot may belong to whoever signed in last on this browser.
     */
    persist?: boolean
  }
}

const STORAGE_PREFIX = 'pinia_state_'

export const piniaPluginPersist: PiniaPlugin = (context) => {
    if (context.options.persist === false) {
        return
    }
    const store = context.store

    const persistedState = localStorage.getItem(`${STORAGE_PREFIX}${store.$id}`)

    if (persistedState) {
        store.$patch(JSON.parse(persistedState))
    }

    store.$subscribe(() => {
        localStorage.setItem(`${STORAGE_PREFIX}${store.$id}`, JSON.stringify(store.$state))
    })
}

/**
 * Forget every persisted store. Called on logout so nothing saved under one
 * account is restored for the next one signing in on the same browser.
 */
export function clearPersistedStores(): void {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(key)
        }
    }
}
