/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

/**
 * A class's participants and their terminals, in one read: what a class
 * manager needs to watch a learner's terminal or act on it.
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

export interface ParticipantControls {
  user_id: string
  user_name: string
  class_block: Record<string, unknown> | null
  org_block: Record<string, unknown> | null
  global_block: Record<string, unknown> | null
  sessions: ParticipantTerminal[]
}

export const participantControlsService = {
  /** GET /class-groups/:groupId/participant-controls — class managers only. */
  async getParticipantControls(groupId: string): Promise<ParticipantControls[]> {
    const response = await axios.get(`/class-groups/${groupId}/participant-controls`)
    return response.data || []
  }
}
