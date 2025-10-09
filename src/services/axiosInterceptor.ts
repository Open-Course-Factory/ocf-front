import axios from 'axios';
import { tokenService } from './tokenService';
import { useCurrentUserStore } from '../stores/currentUser';

export const setupAxiosInterceptors = () => {
  
  // Intercepteur de requête - ajouter automatiquement le token
  axios.interceptors.request.use(
    (config: any) => {
      // Ne pas ajouter de token aux requêtes d'authentification
      if (config.url?.includes('/auth/login')) {
        return config;
      }

      const token = tokenService.getAccessToken();
      if (token && tokenService.hasValidToken()) {
        // Ensure Bearer token format as required by the payment API
        const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        config.headers.Authorization = bearerToken;
        console.debug(`🔑 Request to ${config.url}: Token added (valid: ${tokenService.hasValidToken()})`)
      } else {
        console.debug(`🔑 Request to ${config.url}: No valid token available`)
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
    (error) => {
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