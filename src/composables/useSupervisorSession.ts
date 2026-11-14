/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

/**
 * The session page in supervisor mode: a class manager watching one learner's
 * terminal. One read of the class finds who holds the terminal, its state and
 * the run on it; one more read gives that run's progress. Every learner-scoped
 * read of the normal page is left out.
 */

import { ref } from 'vue'
import { participantControlsService } from '../services/domain/terminal/participantControlsService'
import { teacherService } from '../services/domain/scenario'
import type { SessionDetailResponse } from '../services/domain/scenario'

export function useSupervisorSession(groupId: string, sessionId: string) {
  const learnerName = ref('')
  const terminalState = ref('')
  const progress = ref<SessionDetailResponse | null>(null)

  /** False when the class refuses the caller or none of its learners holds the terminal. */
  async function load(): Promise<boolean> {
    let participants
    try {
      participants = await participantControlsService.getParticipantControls(groupId)
    } catch {
      return false
    }

    for (const participant of participants) {
      const terminal = participant.sessions?.find(s => s.session_id === sessionId)
      if (!terminal) continue

      learnerName.value = participant.user_name || participant.user_id
      terminalState.value = terminal.state
      if (terminal.scenario_session_id) {
        try {
          progress.value = await teacherService.getSessionDetail(groupId, terminal.scenario_session_id)
        } catch {
          // The screen and the name stand without the progress.
        }
      }
      return true
    }
    return false
  }

  return { learnerName, terminalState, progress, load }
}
