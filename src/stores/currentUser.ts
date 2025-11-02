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
import axios from "axios"

export const useCurrentUserStore = defineStore('currentUser', {
    state() {
        return {
            userName: "",
            userDisplayName: "",
            userId: "",
            userRoles: [] as string[],
            permissions: [] as string[], // User permissions from backend
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
        },
        /**
         * Check if user has a specific permission
         */
        hasPermission(): (permission: string) => boolean {
            return (permission: string) => {
                return this.permissions.includes(permission);
            }
        },
        /**
         * Check if user has any of the specified permissions
         */
        hasAnyPermission(): (permissions: string[]) => boolean {
            return (permissions: string[]) => {
                return permissions.some(p => this.permissions.includes(p));
            }
        },
        /**
         * Check if user has all specified permissions
         */
        hasAllPermissions(): (permissions: string[]) => boolean {
            return (permissions: string[]) => {
                return permissions.every(p => this.permissions.includes(p));
            }
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
            this.permissions = []; // Clear permissions
            tokenService.clearTokens();
        },

        // Initialize authentication state from stored token
        initializeAuth() {
            const hasValidToken = tokenService.hasValidToken();
            this._isAuthenticated = hasValidToken;
            console.log('🔐 initializeAuth: hasValidToken=', hasValidToken);
        },

        /**
         * Generic HTTP method to action mapping
         * Converts resource-based permissions to action-based permissions
         */
        transformResourcePermissions(backendData: any): string[] {
            const permissions = new Set<string>();
            const resourcePermissions = backendData.permissions || [];

            console.log('🔐 Transforming', resourcePermissions.length, 'resource permissions...');

            resourcePermissions.forEach((perm: any) => {
                const resource = perm.resource || '';
                const methods = perm.methods || [];

                // Extract resource name from path
                // Examples:
                //   "/api/v1/class-groups/*" → "groups"
                //   "/api/v1/terminals/*" → "terminals"
                //   "/api/v1/courses/*" → "courses"
                const pathParts = resource.split('/').filter((p: string) => p && p !== 'api' && p !== 'v1' && p !== '*');
                if (pathParts.length === 0) return;

                const resourceName = pathParts[pathParts.length - 1]
                    .replace('class-', '')  // "class-groups" → "groups"
                    .replace('user-', '')   // "user-terminal-keys" → "terminal-keys"
                    .replace(/-/g, '_');    // "terminal-keys" → "terminal_keys"

                // Map HTTP methods to CRUD actions
                if (methods.includes('GET')) {
                    permissions.add(`view_${resourceName}`);
                }
                if (methods.includes('POST')) {
                    permissions.add(`create_${resourceName}`);
                }
                if (methods.includes('PATCH') || methods.includes('PUT')) {
                    permissions.add(`update_${resourceName}`);
                    permissions.add(`manage_${resourceName}`);
                }
                if (methods.includes('DELETE')) {
                    permissions.add(`delete_${resourceName}`);
                }
            });

            const result = Array.from(permissions);
            console.log('🔐 Generated', result.length, 'action permissions:', result.slice(0, 10), '...');
            return result;
        },

        /**
         * Load user permissions from backend
         * This should be called after authentication
         */
        async loadPermissions() {
            try {
                console.log('🔐 Loading user permissions from backend...');
                console.log('🔐 Request URL: /auth/permissions');
                console.log('🔐 Current user:', {
                    userId: this.userId,
                    userName: this.userName,
                    userRoles: this.userRoles
                });

                const response = await axios.get('/auth/permissions');

                console.log('🔐 Backend response status:', response.status);
                console.log('🔐 Backend response data (raw):', JSON.stringify(response.data, null, 2));

                // Transform resource permissions to action permissions
                this.permissions = this.transformResourcePermissions(response.data);

                console.log('✅ User permissions loaded (transformed):', this.permissions);
                console.log('✅ Permissions count:', this.permissions.length);
                console.log('✅ Has view_groups permission:', this.permissions.includes('view_groups'));

                return this.permissions;
            } catch (error: any) {
                console.error('❌ Failed to load permissions:', error);
                console.error('❌ Error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });

                // If endpoint doesn't exist yet, silently continue with empty permissions
                if (error.response?.status === 404) {
                    console.warn('⚠️ Permissions endpoint not available yet, using empty permissions');
                    this.permissions = [];
                } else {
                    // For other errors, rethrow
                    throw error;
                }
                return [];
            }
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