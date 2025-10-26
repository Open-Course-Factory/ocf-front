/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  IncludeParams
} from '../../../types'

const BASE_URL = '/organizations'

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
  async addMember(organizationId: string, userId: string, role: 'owner' | 'manager' | 'member' = 'member'): Promise<OrganizationMember> {
    const response = await axios.post(`${BASE_URL}/${organizationId}/members`, {
      user_id: userId,
      role
    })
    return response.data.data || response.data
  },

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, userId: string, role: 'owner' | 'manager' | 'member'): Promise<OrganizationMember> {
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
}
