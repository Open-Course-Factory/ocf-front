import type { LaunchScenarioResponse } from '../services/domain/scenario/scenarioSessionService'

/**
 * The run page of a launched or previewed run. Why the run went where it did
 * (machine_reason) is known only from the launch's answer, so it rides along
 * for the page's notice (TerminalSessionView.vue).
 */
export function runPageRoute(result: Pick<LaunchScenarioResponse, 'terminal_session_id' | 'machine_reason'>, query: Record<string, string> = {}) {
  return {
    name: 'TerminalSessionView',
    params: { sessionId: result.terminal_session_id },
    ...(result.machine_reason || Object.keys(query).length
      ? { query: { ...query, ...(result.machine_reason ? { machine_reason: result.machine_reason } : {}) } }
      : {})
  }
}
