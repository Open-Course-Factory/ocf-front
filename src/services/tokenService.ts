export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'ocf_access_token';
  private static readonly EXPIRES_AT_KEY = 'ocf_expires_at';
  private static readonly REMEMBER_ME_KEY = 'ocf_remember_me';

  getAccessToken(): string | null {
    // Check both localStorage and sessionStorage
    return localStorage.getItem(TokenService.ACCESS_TOKEN_KEY) ||
           sessionStorage.getItem(TokenService.ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(TokenService.ACCESS_TOKEN_KEY, token);

    // Calculer la date d'expiration (1h par défaut si on ne peut pas parser le JWT)
    const expiresAt = this.extractExpirationFromToken(token);
    storage.setItem(TokenService.EXPIRES_AT_KEY, expiresAt.toString());

    // Store remember me preference
    if (rememberMe) {
      localStorage.setItem(TokenService.REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(TokenService.REMEMBER_ME_KEY);
    }
  }

  clearTokens(): void {
    localStorage.removeItem(TokenService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TokenService.EXPIRES_AT_KEY);
    localStorage.removeItem(TokenService.REMEMBER_ME_KEY);
    sessionStorage.removeItem(TokenService.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(TokenService.EXPIRES_AT_KEY);
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    return !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    // Check both localStorage and sessionStorage for expiration
    const expiresAtStr = localStorage.getItem(TokenService.EXPIRES_AT_KEY) ||
                        sessionStorage.getItem(TokenService.EXPIRES_AT_KEY);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr);
    // Ajouter une marge de 5 minutes avant l'expiration
    const marginMs = 5 * 60 * 1000; // 5 minutes

    return Date.now() >= (expiresAt - marginMs);
  }

  getTimeUntilExpiry(): number {
    // Check both localStorage and sessionStorage for expiration
    const expiresAtStr = localStorage.getItem(TokenService.EXPIRES_AT_KEY) ||
                        sessionStorage.getItem(TokenService.EXPIRES_AT_KEY);
    if (!expiresAtStr) return 0;

    const expiresAt = parseInt(expiresAtStr);
    return Math.max(0, expiresAt - Date.now());
  }

  private extractExpirationFromToken(token: string): number {
    try {
      // Décoder le JWT pour extraire la date d'expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return payload.exp * 1000; // Conversion en millisecondes
      }
    } catch (error) {
      console.warn('Impossible de décoder le token JWT:', error);
    }
    
    // Fallback: 1 heure à partir de maintenant
    return Date.now() + (60 * 60 * 1000);
  }
}

export const tokenService = new TokenService();