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
