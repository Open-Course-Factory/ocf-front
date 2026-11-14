/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

/**
 * A class's participants and their terminals, in one read: what a class
 * manager needs to watch a learner's terminal or act on it — stop it, cut its
 * internet, block the learner from starting sessions (#384).
 */

import axios from 'axios'

/** One of a participant's terminals. */
export interface ParticipantTerminal {
  session_id: string
  state: string
  network_feature: boolean
  network_disabled: boolean
  /** The scenario run living on this terminal, when there is one. */
  scenario_session_id?: string
  scenario_title?: string
}

/** A session block in one scope: who set it, when, and why. */
export interface ParticipantBlock {
  reason: string
  blocked_by: string
  created_at: string
}

export type ParticipantRole = 'member' | 'manager' | 'owner'

export interface ParticipantControls {
  user_id: string
  user_name: string
  /** The participant's role in the class. */
  role: ParticipantRole
  class_block: ParticipantBlock | null
  org_block: ParticipantBlock | null
  /** Blocked by the platform. */
  global_block: boolean
  sessions: ParticipantTerminal[]
}

/** Sets or lifts a block; `stop_running` also stops the sessions now running. */
export interface BlockChange {
  blocked: boolean
  reason?: string
  stop_running?: boolean
}

/** One session's outcome in a per-session action. */
export interface ParticipantActionResult {
  session_id: string
  ok: boolean
  skipped?: boolean
  code?: string
}

/** What a per-session action answers; a block answers no results. */
export interface ParticipantActionResponse {
  results?: ParticipantActionResult[]
}

function participantPath(groupId: string, userId: string): string {
  return `/class-groups/${groupId}/participants/${userId}`
}

export const participantControlsService = {
  /** GET /class-groups/:groupId/participant-controls — class managers only. */
  async getParticipantControls(groupId: string): Promise<ParticipantControls[]> {
    const response = await axios.get(`/class-groups/${groupId}/participant-controls`)
    return Array.isArray(response.data) ? response.data : []
  },

  /** Stops the participant's sessions in the class — all of them unless named. */
  async stopSessions(groupId: string, userId: string, sessionIds?: string[]): Promise<ParticipantActionResponse> {
    const body = sessionIds ? { session_ids: sessionIds } : {}
    const response = await axios.post(`${participantPath(groupId, userId)}/stop-sessions`, body)
    return response.data
  },

  /** Cuts or restores the internet of the participant's sessions — all unless named. */
  async setNetwork(groupId: string, userId: string, enabled: boolean, sessionIds?: string[]): Promise<ParticipantActionResponse> {
    const body = sessionIds ? { enabled, session_ids: sessionIds } : { enabled }
    const response = await axios.put(`${participantPath(groupId, userId)}/network`, body)
    return response.data
  },

  /** Blocks or unblocks the participant from starting sessions in the class. */
  async setClassBlock(groupId: string, userId: string, change: BlockChange): Promise<ParticipantActionResponse> {
    const response = await axios.put(`${participantPath(groupId, userId)}/session-block`, change)
    return response.data
  },

  /** Blocks or unblocks the member from starting sessions in the whole organisation. */
  async setOrgBlock(orgId: string, userId: string, change: BlockChange): Promise<ParticipantActionResponse> {
    const response = await axios.put(`/organizations/${orgId}/members/${userId}/session-block`, change)
    return response.data
  }
}
