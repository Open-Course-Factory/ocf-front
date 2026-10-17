/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import axios from 'axios'
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  IncludeParams,
  MemberRole
} from '../../../types'

const BASE_URL = '/organizations'

/**
 * The organization's own AI-assisted scenario authoring config. The API key
 * itself is never part of this shape — has_api_key is the only signal that
 * one is already set.
 */
export interface OrganizationAiConfig {
  enabled: boolean
  endpoint: string
  model: string
  has_api_key: boolean
}

/**
 * api_key is optional on purpose: the frontend never holds the real value
 * to send back, so omitting it means "keep whatever is stored". Sending ""
 * explicitly clears it.
 */
export interface UpdateOrganizationAiConfigInput {
  enabled: boolean
  endpoint: string
  model: string
  api_key?: string
}

/**
 * What the backend applies when an organization sets no retention delay
 * (OCF_DEFAULT_RETENTION_DAYS, ocf-core#492). Display only — the backend
 * never reads it from here.
 */
export const PLATFORM_DEFAULT_RETENTION_DAYS = 365

/**
 * Organization Service
 * Handles organization management operations
 */
export const organizationService = {
  /**
   * Get all organizations for current user
   */
  async getAllOrganizations(params?: IncludeParams): Promise<Organization[]> {
    const response = await axios.get(BASE_URL, { params })
    return response.data.data || response.data
  },

  /**
   * Get single organization by ID
   */
  async getOrganization(id: string, params?: IncludeParams): Promise<Organization> {
    const response = await axios.get(`${BASE_URL}/${id}`, { params })
    return response.data.data || response.data
  },

  /**
   * Create new organization
   */
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await axios.post(BASE_URL, data)
    return response.data.data || response.data
  },

  /**
   * Update organization
   */
  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = await axios.patch(`${BASE_URL}/${id}`, data)
    return response.data.data || response.data
  },

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const response = await axios.get(`${BASE_URL}/${organizationId}`, {
      params: { includes: 'members' }
    })
    const organization = response.data.data || response.data
    return organization.members || []
  },

  /**
   * Add member to organization
   */
  async addMember(organizationId: string, userId: string, role: MemberRole = 'member'): Promise<OrganizationMember> {
    const response = await axios.post(`${BASE_URL}/${organizationId}/members`, {
      user_id: userId,
      role
    })
    return response.data.data || response.data
  },

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, userId: string, role: MemberRole): Promise<OrganizationMember> {
    const response = await axios.patch(`${BASE_URL}/${organizationId}/members/${userId}`, {
      role
    })
    return response.data.data || response.data
  },

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    await axios.delete(`${BASE_URL}/${organizationId}/members/${userId}`)
  },

  /**
   * Offboard members (ocf-core#492): access ends now, the accounts are erased
   * after the organization's retention delay. Manager or owner. Errors carry
   * the backend's reason (an owner cannot be offboarded, 409) and propagate.
   */
  async offboardMembers(organizationId: string, userIds: string[]): Promise<void> {
    await axios.post(`${BASE_URL}/${organizationId}/members/offboard`, { user_ids: userIds })
  },

  /** Reverses an offboarding: the member is active again, erasure cancelled. */
  async reinstateMember(organizationId: string, userId: string): Promise<void> {
    await axios.post(`${BASE_URL}/${organizationId}/members/${userId}/reinstate`)
  },

  /**
   * Erases an offboarded member's account now instead of at the scheduled
   * date. Owner only; a 409 names why it cannot happen (still active elsewhere,
   * owns organizations or groups).
   */
  async eraseMember(organizationId: string, userId: string): Promise<void> {
    await axios.post(`${BASE_URL}/${organizationId}/members/${userId}/erase`)
  },

  /** Reads the organization's AI-assisted authoring config. Never includes the API key. */
  async getAiConfig(organizationId: string): Promise<OrganizationAiConfig> {
    const response = await axios.get<OrganizationAiConfig>(`${BASE_URL}/${organizationId}/ai-config`)
    return response.data
  },

  /** Manager and owner only. Omit api_key to keep the stored one; send "" to clear it. */
  async updateAiConfig(organizationId: string, input: UpdateOrganizationAiConfigInput): Promise<OrganizationAiConfig> {
    const response = await axios.put<OrganizationAiConfig>(`${BASE_URL}/${organizationId}/ai-config`, input)
    return response.data
  },

  /**
   * Calls the organization's configured AI assistant with the given prompt
   * and returns its raw completion text — the same text a teacher would
   * otherwise paste in manually into ScenarioAiModal. Throws (409) if the
   * organization has no usable configuration.
   */
  async generateWithAi(organizationId: string, prompt: string): Promise<string> {
    const response = await axios.post<{ answer: string }>(`${BASE_URL}/${organizationId}/ai-config/generate`, { prompt })
    return response.data.answer
  },
}
