/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import axios from 'axios'
import type { User } from '../../../types/entities'

export const userService = {
  async getUserById(userId: string): Promise<User> {
    const response = await axios.get(`/users/${userId}`)
    return response.data
  },

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return []

    // Use POST to send multiple IDs
    const response = await axios.post('/users/batch', { user_ids: userIds })
    return response.data
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return []

    const response = await axios.get(`/users/search`, {
      params: { q: query }
    })
    return response.data
  }
}