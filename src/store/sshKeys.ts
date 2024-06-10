import { defineStore } from "pinia"

export const useSshKeysStore = defineStore('SshKeys', {
    state() {
        return {
            sshKeys: [],
        }
    },
    actions: {
        setSshKeys(sshKeys) {
            this.sshKeys = sshKeys
        }
    }
})
