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
import { tokenService, authService } from "../services/auth"
import router from "../router/index"
import axios from "axios"
import { useToast } from "../composables/useToast"
import { useStoreTranslations } from "../composables/useTranslations"

const { t } = useStoreTranslations({
    en: {
        session: {
            expiryWarning: 'Your session expires in {minutes} minutes.',
            expiryUrgent: 'Your session expires in less than 1 minute!',
            extendSession: 'Sign in again'
        }
    },
    fr: {
        session: {
            expiryWarning: 'Votre session expire dans {minutes} minutes.',
            expiryUrgent: 'Votre session expire dans moins d\'une minute !',
            extendSession: 'Se reconnecter'
        }
    }
})

export const useCurrentUserStore = defineStore('currentUser', {
    state() {
        return {
            userName: "",
            userDisplayName: "",
            userId: "",
            userEmail: "",
            userRoles: [] as string[],
            permissions: [] as string[], // User permissions from backend
            _isAuthenticated: false, // Internal reactive flag
            emailVerified: false,
            emailVerifiedAt: null as string | null,
            mustChangePassword: false as boolean
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
        },
        /**
         * Check if user's email is verified
         */
        isEmailVerified(): boolean {
            return this.emailVerified;
        },
        /**
         * Check if user needs email verification (logged in but not verified)
         */
        needsEmailVerification(): boolean {
            return this._isAuthenticated && !this.emailVerified;
        },
        needsPasswordChange(): boolean {
            return this._isAuthenticated && this.mustChangePassword;
        }
    },
    actions: {
        // Modifier la méthode de sauvegarde du token
        setSecretToken(token: string, rememberMe: boolean = false) {
            tokenService.setAccessToken(token, rememberMe);
            this._isAuthenticated = true; // Update reactive flag
        },

        clearForcePasswordChange() {
            this.mustChangePassword = false;
        },

        autoLogout() {
            this._isAuthenticated = false; // Clear auth flag immediately
            this.$reset();
            // Only redirect if on a protected page — don't kick users off public pages
            const currentRoute = router.currentRoute.value;
            if (currentRoute.meta.requiresAuth !== false && currentRoute.name !== 'LandingPage') {
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
            this.userEmail = "";
            this.userRoles = [];
            this.permissions = []; // Clear permissions
            this.emailVerified = false;
            this.emailVerifiedAt = null;
            this.mustChangePassword = false;
            tokenService.clearTokens();
        },

        // Initialize authentication state from stored token
        initializeAuth() {
            const hasValidToken = tokenService.hasValidToken();
            this._isAuthenticated = hasValidToken;
            console.log('🔐 initializeAuth: hasValidToken=', hasValidToken);
        },

        /**
         * Load user data from backend (for page refresh with existing token)
         * This reloads userName, userDisplayName, userId, and userRoles
         */
        async loadUserData() {
            try {
                console.log('🔐 Loading user data from backend...');

                // Try /auth/me first (should return user_roles like /auth/login does)
                let response;
                let userData;

                try {
                    response = await axios.get('/auth/me');
                    userData = response.data.data || response.data;
                    console.log('🔐 Using /auth/me endpoint');
                } catch (authMeError: any) {
                    // If /auth/me doesn't exist (404), fall back to /users/me
                    if (authMeError.response?.status === 404) {
                        console.log('🔐 /auth/me not found, trying /users/me');
                        response = await axios.get('/users/me');
                        userData = response.data.data || response.data;
                    } else {
                        throw authMeError;
                    }
                }

                console.log('🔐 Raw backend response:', JSON.stringify(response.data, null, 2));
                console.log('🔐 User data received:', userData);
                console.log('🔐 userData.roles:', userData.roles);
                console.log('🔐 userData.user_roles:', userData.user_roles);

                // Populate user store from backend response
                this.userId = userData.id || userData.user_id;
                this.userName = userData.username || userData.user_name || userData.name || userData.email;
                this.userDisplayName = userData.display_name || this.userName;
                this.userEmail = userData.email || "";
                this.emailVerified = userData.email_verified || false;
                this.emailVerifiedAt = userData.email_verified_at || null;
                this.mustChangePassword = userData.force_password_reset || false;

                // Extract role names from roles array or user_roles field
                if (userData.user_roles && Array.isArray(userData.user_roles)) {
                    // Direct user_roles field (from /auth/me or /auth/login)
                    this.userRoles = userData.user_roles;
                    console.log('🔐 Using user_roles field directly:', this.userRoles);
                } else if (userData.roles && Array.isArray(userData.roles)) {
                    // Roles as objects (from /users/me)
                    this.userRoles = userData.roles.map((role: any) => role.name);
                    console.log('🔐 Extracted userRoles from roles array:', this.userRoles);
                } else {
                    console.warn('⚠️ No roles found in user data! userData:', userData);
                    this.userRoles = [];
                }

                console.log('✅ User data loaded:', {
                    userId: this.userId,
                    userName: this.userName,
                    userDisplayName: this.userDisplayName,
                    userRoles: this.userRoles
                });

                return userData;
            } catch (error: any) {
                console.error('❌ Failed to load user data:', error);
                console.error('❌ Error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });

                // If we can't load user data, the token might be invalid
                // Clear authentication state
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.warn('⚠️ Unauthorized - clearing auth state');
                    this.autoLogout();
                }

                throw error;
            }
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

                // Extract user ID if not already set
                if (response.data.user_id && !this.userId) {
                    this.userId = response.data.user_id;
                    console.log('🔐 User ID extracted from /auth/permissions:', this.userId);
                }

                // Extract user roles from response
                if (response.data.roles && Array.isArray(response.data.roles)) {
                    this.userRoles = response.data.roles;
                    console.log('🔐 User roles extracted from /auth/permissions:', this.userRoles);
                }

                // Transform resource permissions to action permissions
                this.permissions = this.transformResourcePermissions(response.data);

                console.log('✅ User permissions loaded (transformed):', this.permissions);
                console.log('✅ Permissions count:', this.permissions.length);
                console.log('✅ User roles:', this.userRoles);
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
            const toast = useToast()
            let warningToastId: number | null = null
            let urgentToastId: number | null = null
            let currentInterval = 60000
            let intervalHandle: ReturnType<typeof setInterval>

            const redirectToLogin = () => {
                const currentPath = router.currentRoute.value.fullPath
                router.push({ name: 'Login', query: { redirect: currentPath } })
            }

            const check = () => {
                if (!this.userName) return

                if (!tokenService.hasValidToken()) {
                    clearInterval(intervalHandle)
                    if (warningToastId !== null) toast.remove(warningToastId)
                    if (urgentToastId !== null) toast.remove(urgentToastId)
                    this.autoLogout()
                    return
                }

                const timeLeft = tokenService.getTimeUntilExpiry()
                const minutesLeft = Math.floor(timeLeft / 60000)

                // Adaptive polling: speed up when close to expiry
                if (timeLeft <= 10 * 60 * 1000 && currentInterval !== 15000) {
                    currentInterval = 15000
                    clearInterval(intervalHandle)
                    intervalHandle = setInterval(check, currentInterval)
                }

                // Urgent warning: less than 1 minute
                if (timeLeft <= 60 * 1000 && urgentToastId === null) {
                    if (warningToastId !== null) {
                        toast.remove(warningToastId)
                        warningToastId = null
                    }
                    urgentToastId = toast.show(
                        t('session.expiryUrgent'),
                        'error',
                        0,
                        {
                            persistent: true,
                            action: {
                                label: t('session.extendSession'),
                                callback: redirectToLogin
                            }
                        }
                    )
                }
                // Warning: less than 5 minutes
                else if (timeLeft <= 5 * 60 * 1000 && warningToastId === null && urgentToastId === null) {
                    warningToastId = toast.show(
                        t('session.expiryWarning').replace('{minutes}', String(minutesLeft)),
                        'warning',
                        0,
                        {
                            persistent: true,
                            action: {
                                label: t('session.extendSession'),
                                callback: redirectToLogin
                            }
                        }
                    )
                }
                // Update warning message with remaining minutes
                else if (warningToastId !== null && timeLeft > 60 * 1000) {
                    toast.update(warningToastId, t('session.expiryWarning').replace('{minutes}', String(minutesLeft)))
                }
            }

            intervalHandle = setInterval(check, currentInterval)
            return intervalHandle
        },

        /**
         * Refresh email verification status from backend
         */
        async refreshVerificationStatus() {
            try {
                const status = await authService.getVerificationStatus();
                this.emailVerified = status.verified;
                this.emailVerifiedAt = status.verified_at || null;
                this.userEmail = status.email;
                console.log('✅ Email verification status refreshed:', {
                    verified: this.emailVerified,
                    verifiedAt: this.emailVerifiedAt
                });
                return status;
            } catch (error: any) {
                console.error('❌ Failed to refresh verification status:', error);
                throw error;
            }
        }
    }
})