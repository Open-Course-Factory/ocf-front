/**
 * A terminal session whose machine runs in the learner's browser, as ocf-core
 * names it (models.LocalSessionIDPrefix). The same prefix is matched by the
 * mirror's location (nginx/local-machine-mirror.locations) and Vite's proxy.
 * Kept apart from localMachine.ts so that pages which only ask this, some in
 * the entry chunk, do not load the machine's code.
 */
export const LOCAL_SESSION_PREFIX = 'local-'

export function isLocalSessionId(sessionId: string | null | undefined): boolean {
  return !!sessionId && sessionId.startsWith(LOCAL_SESSION_PREFIX)
}
