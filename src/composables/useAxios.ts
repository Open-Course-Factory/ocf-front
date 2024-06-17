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

import { toRefs, ref, reactive, Ref } from 'vue';
import axios, { AxiosRequestConfig } from 'axios';

interface FetchState {
    error: any;
    loading: boolean;
}

export function useAxios(url: string, options?: AxiosRequestConfig) {
    const data: Ref<any> = ref(null);
    const state = reactive<FetchState>({
        error: null,
        loading: false
    });

    const fetchData = async () => {
        state.loading = true;
        try {
            const res = await axios(url, options);
            data.value = res.data;
        } catch (e) {
            state.error = e;
        } finally {
            state.loading = false;
        }
    };

    fetchData();

    return { data, ...toRefs(state) };
}
