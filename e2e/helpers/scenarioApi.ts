import { apiLogin, type ApiSession } from './paymentApi';

/**
 * ocf-core API helpers for the Tier B scenario suite (real containers).
 *
 * Fixtures are created through POST /organizations/:id/scenarios/import-json —
 * the one endpoint that creates a scenario WITH its steps/questions in a
 * single call and that an org owner (marc) may use; plain POST /scenarios is
 * platform-admin-only. Fixture titles are unique per run because a terminal
 * can only ever carry one scenario and a (user, scenario) pair admits a
 * single active session — reusing a scenario across runs would wedge reruns.
 *
 * Setup/teardown goes through the API; the behavior under test stays in the UI.
 */

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

export { apiLogin, type ApiSession };

function authHeaders(session: ApiSession) {
  return { Authorization: `Bearer ${session.token}` };
}

/** First team org the user owns (marc → marc-corp). */
export async function findOwnedTeamOrgId(session: ApiSession): Promise<string | null> {
  const response = await session.api.get(`${API_BASE}/organizations`, { headers: authHeaders(session) });
  if (!response.ok()) throw new Error(`GET /organizations failed: ${response.status()}`);
  const body = await response.json();
  const orgs = Array.isArray(body) ? body : body.data || [];
  const me = orgs.find((o: any) => o.organization_type === 'personal')?.owner_user_id;
  const owned = orgs.find((o: any) => o.organization_type !== 'personal' && o.owner_user_id === me);
  return owned ? owned.id : null;
}

export interface SeedQuestion {
  order: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'free_text';
  options?: string; // JSON-encoded array for multiple_choice
  correct_answer: string;
  explanation?: string;
  points?: number;
}

export interface SeedStep {
  title: string;
  step_type: 'terminal' | 'flag' | 'info' | 'quiz';
  text_content?: string;
  hint_content?: string;
  verify_script?: string; // empty/absent = auto-pass
  has_flag?: boolean;
  show_immediate_feedback?: boolean;
  questions?: SeedQuestion[];
}

export interface SeedScenario {
  title: string;
  description?: string;
  difficulty?: string;
  estimated_time?: string;
  instance_type?: string;
  os_type?: string;
  is_public?: boolean;
  flags_enabled?: boolean;
  crash_traps?: boolean;
  setup_script?: string;
  intro_text?: string;
  finish_text?: string;
  steps: SeedStep[];
}

/** Import a fixture scenario into an org; returns the created scenario. */
export async function importScenario(
  session: ApiSession,
  orgId: string,
  seed: SeedScenario
): Promise<{ id: string; name: string; title: string }> {
  const response = await session.api.post(
    `${API_BASE}/organizations/${orgId}/scenarios/import-json`,
    {
      headers: authHeaders(session),
      data: {
        difficulty: 'beginner',
        estimated_time: '10m',
        instance_type: 'xs',
        os_type: 'apk',
        ...seed,
      },
    }
  );
  if (!response.ok()) {
    throw new Error(`import-json failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function deleteScenario(session: ApiSession, orgId: string, scenarioId: string): Promise<void> {
  await session.api
    .delete(`${API_BASE}/organizations/${orgId}/scenarios/${scenarioId}`, { headers: authHeaders(session) })
    .catch(() => {});
}

/** The launcher card for a scenario title, as the learner sees it. */
export async function getAvailableScenario(session: ApiSession, title: string): Promise<any | null> {
  const response = await session.api.get(`${API_BASE}/scenario-sessions/available`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) return null;
  const body = await response.json();
  const rows = Array.isArray(body) ? body : body.data || [];
  return rows.find((s: any) => s.title === title) || null;
}

export async function getMyScenarioSessions(session: ApiSession): Promise<any[]> {
  const response = await session.api.get(`${API_BASE}/scenario-sessions/my`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) return [];
  const body = await response.json();
  return Array.isArray(body) ? body : body.data || [];
}

/** Abandon the learner's scenario session and destroy its terminal (teardown). */
export async function cleanupScenarioSession(session: ApiSession, scenarioId: string): Promise<void> {
  const mine = await getMyScenarioSessions(session);
  for (const s of mine) {
    if (s.scenario_id !== scenarioId) continue;
    if (s.status === 'active' || s.status === 'provisioning') {
      await session.api
        .post(`${API_BASE}/scenario-sessions/${s.id}/abandon`, { headers: authHeaders(session) })
        .catch(() => {});
    }
    if (s.terminal_session_id) {
      await session.api
        .delete(`${API_BASE}/terminals/${s.terminal_session_id}`, { headers: authHeaders(session) })
        .catch(() => {});
    }
  }
}
