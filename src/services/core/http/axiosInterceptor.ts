import axios, { InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../../auth/tokenService';
import { useCurrentUserStore } from '../../../stores/currentUser';
import { useImpersonationStore } from '../../../stores/impersonation';
import router from '../../../router';

export const setupAxiosInterceptors = () => {

  // Intercepteur de requête - ajouter automatiquement le token
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Ne pas ajouter de token aux requêtes d'authentification
      if (config.url?.includes('/auth/login')) {
        return config;
      }

      const token = tokenService.getAccessToken();
      if (token && tokenService.hasValidToken()) {
        // Ensure Bearer token format as required by the payment API
        const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = bearerToken;
      }

      // Add X-Impersonate-User header when an admin is actively impersonating.
      // Skip for the impersonation endpoints themselves — the backend reads the
      // impersonator from the auth context for /stop, and /start refuses to
      // chain impersonations server-side, so we keep those calls clean.
      const url = config.url || '';
      const isImpersonationEndpoint = url.startsWith('admin/impersonate/') || url.startsWith('/admin/impersonate/');
      if (!isImpersonationEndpoint) {
        try {
          const store = useImpersonationStore();
          if (store.targetUserId) {
            config.headers['X-Impersonate-User'] = store.targetUserId;
          }
        } catch (_e) {
          // Pinia not yet initialized (e.g. during early bootstrap) — skip silently
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse - gérer les erreurs 401
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle impersonation-specific 401s BEFORE the generic auto-logout:
      // when the backend reports the impersonation session expired or is
      // invalid, we silently clear the impersonation state but keep the
      // admin's real session intact.
      const errKey = error.response?.data?.error;
      if (
        error.response?.status === 401 &&
        (errKey === 'impersonation_expired' || errKey === 'impersonation_invalid')
      ) {
        try {
          const { useImpersonationStore } = await import('../../../stores/impersonation');
          const store = useImpersonationStore();
          await store.stop(true); // silent — backend already closed it
        } catch (_e) {
          // ignore — best-effort cleanup
        }
        return Promise.reject(error);
      }

      // Si on reçoit une 401, déconnecter automatiquement
      if (error.response?.status === 401) {
        const userStore = useCurrentUserStore();
        userStore.autoLogout();
      }

      // Log 503 errors for backend capacity issues
      if (error.response?.status === 503) {
        console.warn('503 Service Unavailable:', error.response?.data?.error_message || error.message);
      }

      // Handle email verification required error - redirect to verify page
      if (error.response?.status === 403 && error.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        const currentRoute = router.currentRoute.value;
        if (currentRoute.name !== 'VerifyEmail') {
          router.push({ name: 'VerifyEmail', query: { redirect: currentRoute.fullPath } });
        }
      }

      return Promise.reject(error);
    }
  );
};

// Configuration de base d'Axios
export const setupAxiosDefaults = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const protocol = import.meta.env.VITE_PROTOCOL;
  
  axios.defaults.baseURL = `${protocol}://${apiUrl}/api/v1`;
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.timeout = 30000; // 30 secondes
};