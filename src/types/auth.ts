/**
 * Authentication and email verification type definitions
 */

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
  verified: boolean
}

export interface ResendVerificationRequest {
  email: string
}

export interface ResendVerificationResponse {
  success: boolean
  message: string
}

export interface VerificationStatus {
  verified: boolean
  verified_at?: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: import('./entities').User
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  user?: import('./entities').User
}
