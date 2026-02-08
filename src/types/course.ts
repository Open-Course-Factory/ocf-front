/**
 * Course hierarchy type definitions
 */

import type { BaseEntity } from './base'

/**
 * Course entity
 */
export interface Course extends BaseEntity {
  name: string
  version: string
  title: string
  subtitle?: string
  header?: string
  footer?: string
  description?: string
  learning_objectives?: string
  format?: string
  author_email?: string
  category?: string
  logo?: string
  prelude?: string
  user_id?: string
  owner_id?: string
  is_published?: boolean
  slug?: string
  chapters?: Chapter[]
}

/**
 * Chapter entity
 */
export interface Chapter extends BaseEntity {
  course_id: string
  course?: Course  // Optional: full course object if loaded
  title: string
  description?: string
  order?: number
  sections?: Section[]
}

/**
 * Section entity
 */
export interface Section extends BaseEntity {
  chapter_id: string
  chapter?: Chapter  // Optional: full chapter object if loaded
  title: string
  content?: string
  order?: number
  pages?: Page[]
}

/**
 * Page entity
 */
export interface Page extends BaseEntity {
  section_id: string
  section?: Section  // Optional: full section object if loaded
  title: string
  content?: string
  order?: number
}

/**
 * Generation entity (AI course generation)
 */
export interface Generation extends BaseEntity {
  user_id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
}
