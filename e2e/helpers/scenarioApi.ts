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

/**
 * First team org the user owns (marc → marc-corp), with the name the org
 * switcher shows — specs that have to put the UI in that org context need the
 * label, not just the id.
 */
export async function findOwnedTeamOrg(
  session: ApiSession
): Promise<{ id: string; displayName: string } | null> {
  const response = await session.api.get(`${API_BASE}/organizations`, { headers: authHeaders(session) });
  if (!response.ok()) throw new Error(`GET /organizations failed: ${response.status()}`);
  const body = await response.json();
  const orgs = Array.isArray(body) ? body : body.data || [];
  const me = orgs.find((o: any) => o.organization_type === 'personal')?.owner_user_id;
  const owned = orgs.find((o: any) => o.organization_type !== 'personal' && o.owner_user_id === me);
  return owned ? { id: owned.id, displayName: owned.display_name || owned.name } : null;
}

export async function findOwnedTeamOrgId(session: ApiSession): Promise<string | null> {
  return (await findOwnedTeamOrg(session))?.id ?? null;
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

/** Delete a scenario that has no owning org in the caller's reach (group-scoped, platform). */
export async function deleteScenarioById(session: ApiSession, scenarioId: string): Promise<void> {
  await session.api
    .delete(`${API_BASE}/scenarios/${scenarioId}`, { headers: authHeaders(session) })
    .catch(() => {});
}

export async function deleteScenario(session: ApiSession, orgId: string, scenarioId: string): Promise<void> {
  await session.api
    .delete(`${API_BASE}/organizations/${orgId}/scenarios/${scenarioId}`, { headers: authHeaders(session) })
    .catch(() => {});
}

/**
 * The launcher card for a scenario title, as the learner sees it.
 *
 * `orgId` matters for anything reached through a GROUP assignment: the endpoint
 * scopes those to the org context, exactly as the launcher page does. Public
 * scenarios come back in any context, org or personal.
 */
export async function getAvailableScenario(
  session: ApiSession,
  title: string,
  orgId?: string
): Promise<any | null> {
  const response = await session.api.get(`${API_BASE}/scenario-sessions/available`, {
    headers: authHeaders(session),
    ...(orgId ? { params: { organization_id: orgId } } : {}),
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

export async function getUserId(session: ApiSession): Promise<string> {
  const response = await session.api.get(`${API_BASE}/users/me`, { headers: authHeaders(session) });
  if (!response.ok()) throw new Error(`GET /users/me failed: ${response.status()}`);
  const body = await response.json();
  return body.id || body.user_id;
}

/**
 * Make a user a member of an org if they are not one already, and say whether
 * the membership was created — the caller removes only what it added.
 *
 * Needed because adding someone to a CLASS does not make them a member of the
 * org that class belongs to, while bulk start resolves each member's plan
 * against the SCENARIO's org and fails outright for a non-member.
 */
export async function ensureOrgMembership(
  session: ApiSession,
  orgId: string,
  userId: string
): Promise<string | null> {
  const existing = await session.api.get(`${API_BASE}/organizations/${orgId}/members`, {
    headers: authHeaders(session),
  });
  if (existing.ok()) {
    const members = await existing.json();
    if ((Array.isArray(members) ? members : []).some((m: any) => m.user_id === userId)) return null;
  }
  const response = await session.api.post(`${API_BASE}/organization-members`, {
    headers: authHeaders(session),
    data: { organization_id: orgId, user_id: userId, role: 'member' },
  });
  if (!response.ok()) {
    throw new Error(`POST /organization-members failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()).id;
}

export async function removeOrgMembership(session: ApiSession, membershipId: string): Promise<void> {
  await session.api
    .delete(`${API_BASE}/organization-members/${membershipId}`, { headers: authHeaders(session) })
    .catch(() => {});
}

export interface TeacherGroup {
  group_id: string;
  display_name: string;
  organization_id: string;
  learner_count: number;
}

/**
 * A class the caller teaches, matched on its displayed name. The dev database
 * carries same-named classes, so `minLearners` picks the populated one — specs
 * that bulk-start need the class that actually has learners in it.
 */
export async function findTeacherGroup(
  session: ApiSession,
  namePattern: RegExp,
  minLearners = 0
): Promise<TeacherGroup | null> {
  const response = await session.api.get(`${API_BASE}/teacher/groups`, { headers: authHeaders(session) });
  if (!response.ok()) return null;
  const rows: TeacherGroup[] = await response.json();
  return (
    rows.find((g) => namePattern.test(g.display_name || '') && (g.learner_count ?? 0) >= minLearners) || null
  );
}

/**
 * Assign a scenario to a class. Group managers may do this themselves — the
 * ScenarioAssignment BeforeCreate hook accepts anyone who passes
 * CanUserManageGroup, so no admin credentials are involved.
 */
export async function createGroupAssignment(
  session: ApiSession,
  scenarioId: string,
  groupId: string,
  extra: { start_date?: string; deadline?: string } = {}
): Promise<{ id: string }> {
  const response = await session.api.post(`${API_BASE}/scenario-assignments`, {
    headers: authHeaders(session),
    data: { scenario_id: scenarioId, group_id: groupId, scope: 'group', is_active: true, ...extra },
  });
  if (!response.ok()) {
    throw new Error(`POST /scenario-assignments failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function updateAssignment(
  session: ApiSession,
  assignmentId: string,
  patch: { start_date?: string; deadline?: string; is_active?: boolean }
): Promise<void> {
  const response = await session.api.patch(`${API_BASE}/scenario-assignments/${assignmentId}`, {
    headers: authHeaders(session),
    data: patch,
  });
  if (!response.ok()) {
    throw new Error(`PATCH /scenario-assignments/${assignmentId} failed: ${response.status()}`);
  }
}

export async function deleteAssignment(session: ApiSession, assignmentId: string): Promise<void> {
  await session.api
    .delete(`${API_BASE}/scenario-assignments/${assignmentId}`, { headers: authHeaders(session) })
    .catch(() => {});
}

/**
 * Launch a scenario for the calling user and provision its container — the same
 * endpoint the launcher page posts to. Setup only: specs that are ABOUT the
 * launch drive it through the UI. Returns null when the backend refuses (a
 * busy host answers 503), so callers can skip rather than fail.
 */
export async function launchScenarioSession(
  session: ApiSession,
  scenarioId: string,
  orgId?: string
): Promise<{ scenario_session_id: string; terminal_session_id: string } | null> {
  const response = await session.api.post(`${API_BASE}/scenario-sessions/launch`, {
    headers: authHeaders(session),
    data: { scenario_id: scenarioId, ...(orgId ? { organization_id: orgId } : {}) },
    timeout: 240_000,
  });
  if (!response.ok()) return null;
  return response.json();
}

/** One row per learner who has a session on this scenario, as the teacher sees it. */
export async function getGroupScenarioResults(
  session: ApiSession,
  groupId: string,
  scenarioId: string
): Promise<any[]> {
  const response = await session.api.get(
    `${API_BASE}/teacher/groups/${groupId}/scenarios/${scenarioId}/results`,
    { headers: authHeaders(session) }
  );
  if (!response.ok()) return [];
  const body = await response.json();
  // The endpoint answers the paginated shape { items, total, ... }.
  return Array.isArray(body) ? body : body.items || body.data || [];
}

/** The caller's terminal record for a tt-backend session id, or null. */
export async function getTerminalSession(session: ApiSession, sessionId?: string): Promise<any | null> {
  if (!sessionId) return null;
  const response = await session.api.get(`${API_BASE}/terminals/user-sessions`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) return null;
  const body = await response.json();
  const rows = Array.isArray(body) ? body : body.data || [];
  return rows.find((t: any) => t.session_id === sessionId) || null;
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
