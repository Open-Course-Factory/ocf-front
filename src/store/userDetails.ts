import { defineStore } from "pinia"

export const useUserDetailsStore = defineStore('UserDetails', {
    state() {
        return {
            secretToken: "",
            userId: "",
            userRoles: [],
        }
    }
})