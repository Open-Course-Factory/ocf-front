import axios from 'axios'
import type {
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  VerificationStatus,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../../types/auth'

const API_BASE = '/auth'

export class AuthService {
  /**
   * Verify email with token from verification email
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const response = await axios.post<VerifyEmailResponse>(
      `${API_BASE}/verify-email`,
      { token } as VerifyEmailRequest
    )
    return response.data
  }

  /**
   * Resend verification email to user
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const response = await axios.post<ResendVerificationResponse>(
      `${API_BASE}/resend-verification`,
      { email } as ResendVerificationRequest
    )
    return response.data
  }

  /**
   * Get current user's email verification status
   */
  async getVerificationStatus(): Promise<VerificationStatus> {
    const response = await axios.get<VerificationStatus>(`${API_BASE}/verify-status`)
    return response.data
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(
      `${API_BASE}/login`,
      { email, password } as LoginRequest
    )
    return response.data
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name?: string): Promise<RegisterResponse> {
    const response = await axios.post<RegisterResponse>(
      `${API_BASE}/register`,
      { email, password, name } as RegisterRequest
    )
    return response.data
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await axios.post(`${API_BASE}/logout`)
  }
}

export const authService = new AuthService()
