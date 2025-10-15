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

import { defineStore } from "pinia"
import { tokenService } from "../services/auth"
import router from "../router/index"

export const useCurrentUserStore = defineStore('currentUser', {
    state() {
        return {
            userName: "",
            userDisplayName: "",
            userId: "",
            userRoles: [],
        }
    },
    getters: {
        isAuthenticated(): boolean {
            // Vérifier si le token est valide ET non expiré
            const hasToken = tokenService.hasValidToken();
            
            // Si le token est expiré, déconnecter automatiquement
            if (!hasToken && this.userName) {
                console.log('Token expiré, déconnexion automatique');
                this.autoLogout();
            }
            
            return hasToken;
        },
        secretToken(): string {
            return tokenService.getAccessToken() || "";
        }
    },
    actions: {
        // Modifier la méthode de sauvegarde du token
        setSecretToken(token: string, rememberMe: boolean = false) {
            tokenService.setAccessToken(token, rememberMe);
        },

        autoLogout() {
            this.$reset();
            // Rediriger vers login seulement si on n'y est pas déjà
            if (router.currentRoute.value.name !== 'Login') {
                router.push({ name: 'Login' });
            }
        },

        logout() {
            this.$reset();
            router.push({ name: 'Login' });
        },
        
        // Modifier le reset pour utiliser tokenService
        $reset() {
            this.userName = "";
            this.userDisplayName = "";
            this.userId = "";
            this.userRoles = [];
            tokenService.clearTokens();
        },

        startTokenExpiryCheck() {
            // Vérifier toutes les minutes
            const interval = setInterval(() => {
                if (!tokenService.hasValidToken() && this.userName) {
                    console.log('Token expiré détecté lors de la vérification périodique');
                    this.autoLogout();
                    clearInterval(interval);
                }
            }, 60000); // 60 secondes
            
            return interval;
        }
    }
})