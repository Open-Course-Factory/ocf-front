import { defineStore } from "pinia"

export const useCurrentUserStore = defineStore('currentUser', {
    state() {
        return {
            secretToken: "",
            userName: "",
            userId: "",
            userRoles: [],
        }
    },
    getters: {
        isAuthenticated: (state) => !!state.secretToken,
    }
})