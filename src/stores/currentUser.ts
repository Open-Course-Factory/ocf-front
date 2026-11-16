/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
import { clearPersistedStores } from "../piniaPluginPersist"
import axios from "axios"
import { useToast } from "../composables/useToast"
import { useStoreTranslations } from "../composables/useTranslations"
import { useUserMembershipsStore } from "./userMemberships"

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

            /**
             * Whether this user's PLAN lets them own a teaching organization —
             * ocf-core's `can_create_organization`, which resolves through the
             * same `CanRunClassrooms(userID, nil)` call that the create endpoint
             * itself applies (core #476), so the two cannot drift.
             *
             * null until /auth/permissions answers. Callers must keep that apart
             * from false: absent data is not a refusal.
             */
            canCreateOrganization: null as boolean | null,
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
        clearForcePasswordChange() {
            this.mustChangePassword = false;
        },

        // Modifier la méthode de sauvegarde du token
        setSecretToken(token: string, rememberMe: boolean = false) {
            tokenService.setAccessToken(token, rememberMe);
            this._isAuthenticated = true; // Update reactive flag
        },

        autoLogout() {
            this._isAuthenticated = false; // Clear auth flag immediately
            this.$reset();
            // Only redirect if on a protected page — don't kick users off public pages
            const currentRoute = router.currentRoute.value;
            if (currentRoute.meta.requiresAuth !== false) {
                router.push({ name: 'Login' });
            }
        },

        async logout() {
            this.$reset();
            // Nothing saved under this account may greet the next one on this browser.
            clearPersistedStores();
            // Use nextTick to ensure reactivity has updated before navigation
            await new Promise(resolve => setTimeout(resolve, 0));
            await router.push({ name: 'Login' });
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
            this.canCreateOrganization = null; // Unknown again, not refused
            this.emailVerified = false;
            this.emailVerifiedAt = null;
            this.mustChangePassword = false;
            tokenService.clearTokens();
        },

        // Initialize authentication state from stored token
        initializeAuth() {
            const hasValidToken = tokenService.hasValidToken();
            this._isAuthenticated = hasValidToken;
        },

        /**
         * Load user data from backend (for page refresh with existing token)
         * This reloads userName, userDisplayName, userId, and userRoles
         */
        async loadUserData() {
            try {

                // Try /auth/me first (should return user_roles like /auth/login does)
                let response;
                let userData;

                try {
                    response = await axios.get('/auth/me');
                    userData = response.data.data || response.data;
                } catch (authMeError: any) {
                    // If /auth/me doesn't exist (404), fall back to /users/me
                    if (authMeError.response?.status === 404) {
                        response = await axios.get('/users/me');
                        userData = response.data.data || response.data;
                    } else {
                        throw authMeError;
                    }
                }

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
                } else if (userData.roles && Array.isArray(userData.roles)) {
                    // Roles may be strings (from /auth/me) or objects with .name (from /users/me)
                    this.userRoles = userData.roles.map((role: any) =>
                        typeof role === 'string' ? role : role.name
                    );
                } else {
                    console.warn('⚠️ No roles found in user data!');
                    this.userRoles = [];
                }

                // Sync impersonation state from the same /auth/me payload so
                // the impersonation banner reflects the authoritative server
                // view (including detecting silent server-side expiry).
                try {
                    const { useImpersonationStore } = await import('./impersonation');
                    useImpersonationStore().applyAuthMeData(userData);
                } catch (impErr: any) {
                    console.warn('⚠️ Failed to sync impersonation state:', impErr?.message || impErr);
                }

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
            return result;
        },

        /**
         * Load user permissions from backend
         * This should be called after authentication
         */
        async loadPermissions() {
            try {

                const response = await axios.get('/auth/permissions');

                // Extract user ID if not already set
                if (response.data.user_id && !this.userId) {
                    this.userId = response.data.user_id;
                }

                // Extract user roles from response
                if (response.data.roles && Array.isArray(response.data.roles)) {
                    this.userRoles = response.data.roles;
                }

                // Only a real boolean counts. A backend that does not send the
                // field leaves the answer unknown, which reads as "carry on" —
                // never as a refusal invented by the client.
                this.canCreateOrganization = typeof response.data.can_create_organization === 'boolean'
                    ? response.data.can_create_organization
                    : null;

                // Transform resource permissions to action permissions
                this.permissions = this.transformResourcePermissions(response.data);

                // Eager-load memberships so the scenario-editor gate (#213) and
                // any other surface reading /me/memberships gets a stable
                // answer on first paint. Fire-and-forget: the store keeps
                // empty arrays on failure, so the UI hides scoped actions
                // instead of flickering.
                useUserMembershipsStore().ensureLoaded().catch(() => null);

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

        /**
         * Load the permissions payload only if it is not already here.
         *
         * main.ts loads it before the app mounts, so this normally resolves
         * without a request. It exists for the screens that must decide on
         * `canCreateOrganization` rather than on its absence, and would otherwise
         * have nothing to await when that first load failed.
         */
        async ensurePermissionsLoaded() {
            if (this.canCreateOrganization !== null) return this.permissions;
            return this.loadPermissions();
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
                        t('session.expiryWarning', { minutes: minutesLeft }),
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
                    toast.update(warningToastId, t('session.expiryWarning', { minutes: minutesLeft }))
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
                return status;
            } catch (error: any) {
                console.error('❌ Failed to refresh verification status:', error);
                throw error;
            }
        }
    }
})