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
            _isAuthenticated: false, // Internal reactive flag
        }
    },
    getters: {
        isAuthenticated(): boolean {
            // Use the internal reactive flag instead of calling tokenService
            return this._isAuthenticated;
        },
        secretToken(): string {
            return tokenService.getAccessToken() || "";
        }
    },
    actions: {
        // Modifier la méthode de sauvegarde du token
        setSecretToken(token: string, rememberMe: boolean = false) {
            tokenService.setAccessToken(token, rememberMe);
            this._isAuthenticated = true; // Update reactive flag
        },

        autoLogout() {
            this._isAuthenticated = false; // Clear auth flag immediately
            this.$reset();
            // Rediriger vers landing page seulement si on n'y est pas déjà
            if (router.currentRoute.value.name !== 'LandingPage') {
                router.push({ name: 'LandingPage' });
            }
        },

        async logout() {
            console.log('🔐 logout() called');
            this.$reset();
            console.log('🔐 After $reset, isAuthenticated:', this.isAuthenticated);
            // Use nextTick to ensure reactivity has updated before navigation
            await new Promise(resolve => setTimeout(resolve, 0));
            console.log('🔐 After delay, isAuthenticated:', this.isAuthenticated);
            await router.push({ name: 'LandingPage' });
        },
        
        // Modifier le reset pour utiliser tokenService
        $reset() {
            this._isAuthenticated = false; // Clear auth flag immediately
            this.userName = "";
            this.userDisplayName = "";
            this.userId = "";
            this.userRoles = [];
            tokenService.clearTokens();
        },

        // Initialize authentication state from stored token
        initializeAuth() {
            const hasValidToken = tokenService.hasValidToken();
            this._isAuthenticated = hasValidToken;
            console.log('🔐 initializeAuth: hasValidToken=', hasValidToken);
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