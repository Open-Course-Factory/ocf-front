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

import { PiniaPlugin } from 'pinia'

export const piniaPluginPersist: PiniaPlugin = (context) => {
    const store = context.store

    const persistedState = localStorage.getItem(`pinia_state_${store.$id}`)

    if (persistedState) {
        store.$patch(JSON.parse(persistedState))
    }

    store.$subscribe(() => {
        localStorage.setItem(`pinia_state_${store.$id}`, JSON.stringify(store.$state))
    })
}