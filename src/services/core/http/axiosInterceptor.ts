import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../../auth/tokenService';
import { useCurrentUserStore } from '../../../stores/currentUser';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

// Generate a unique key for request deduplication
function getRequestKey(config: AxiosRequestConfig): string {
  const { method, url, params } = config;
  return `${method}:${url}:${JSON.stringify(params || {})}`;
}

export const setupAxiosInterceptors = () => {

  // Intercepteur de requête - ajouter automatiquement le token et dédupliquer
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

      // Request deduplication - only for GET requests
      if (config.method?.toLowerCase() === 'get' && !(config as any).skipDeduplication) {
        const requestKey = getRequestKey(config);

        if (pendingRequests.has(requestKey)) {
          // Return the existing promise instead of making a new request
          if (import.meta.env.DEV) {
            console.debug(`🔄 Deduplicating request: ${requestKey}`);
          }
          return pendingRequests.get(requestKey)!.then(() => config);
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse - gérer les erreurs 401 et nettoyer le cache
  axios.interceptors.response.use(
    (response) => {
      // Clean up request from pending cache
      if (response.config.method?.toLowerCase() === 'get') {
        const requestKey = getRequestKey(response.config);
        pendingRequests.delete(requestKey);
      }
      return response;
    },
    (error) => {
      // Clean up request from pending cache on error
      if (error.config?.method?.toLowerCase() === 'get') {
        const requestKey = getRequestKey(error.config);
        pendingRequests.delete(requestKey);
      }

      // Si on reçoit une 401, déconnecter automatiquement
      if (error.response?.status === 401) {
        console.log('Erreur 401 détectée, déconnexion automatique');
        const userStore = useCurrentUserStore();
        userStore.autoLogout();
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