import { defineStore } from "pinia"

export const useLoginStore = defineStore('login', {
    state() {
        return {
            email: "",
            password: ""
        }
    }
})