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