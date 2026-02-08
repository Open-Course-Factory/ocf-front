/**
 * Base entity types shared across all domains
 */

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

/**
 * Role entity (Phase 3 - simplified system)
 */
export interface Role {
  id: string
  name: 'member' | 'administrator' // Only 2 system roles
  description?: string
}

/**
 * User Summary (simplified user info from API responses)
 */
export interface UserSummary {
  id: string
  name: string
  display_name: string
  email: string
}
