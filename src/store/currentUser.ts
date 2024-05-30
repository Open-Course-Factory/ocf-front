import { defineStore } from "pinia"

export const useCurrentUserStore = defineStore('currentUser', {
    state() {
        return {
            secretToken: "",
            userId: "",
            userRoles: [],
        }
    }
})