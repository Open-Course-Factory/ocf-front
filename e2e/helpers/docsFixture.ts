import { apiLogin, getCatalogPlans, type ApiSession } from './paymentApi';
import { getOrganizations, type ApiOrganization } from './platformApi';
import { createGroupAssignment, findTeacherGroup, getMyScenarioSessions, getUserId, launchScenarioSession } from './scenarioApi';
import { verifyEmailViaToken } from './freshUsers';

/**
 * The "Université Labinux" fixture behind the documentation screenshots.
 *
 * Screenshots must show a plausible school, not `shared-test-org` and
 * `e2e-roundtrip-msi999o2`. This builds one through the same API calls the
 * product itself makes — signup, plan assignment, org creation, CSV import,
 * scenario assignment — and is idempotent: every step looks before it creates,
 * so `npm run docs:screenshots` can be rerun on the same database forever.
 *
 * Nothing here is ever torn down. The fixture is meant to stay in the dev
 * database, exactly like demo-iris stays in prod.
 */

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '1.supervisor@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'test';

export const DOCS_PASSWORD = 'OcfDocs2026!';

export const TRAINER = {
  email: 'claire.martin@universite-labinux.example',
  userName: 'claire.martin',
  firstName: 'Claire',
  lastName: 'Martin',
  displayName: 'Claire Martin',
};

export const LEARNERS = [
  { email: 'karim.benali@universite-labinux.example', firstName: 'Karim', lastName: 'Benali' },
  { email: 'lea.dupont@universite-labinux.example', firstName: 'Léa', lastName: 'Dupont' },
  { email: 'mehdi.haddad@universite-labinux.example', firstName: 'Mehdi', lastName: 'Haddad' },
  { email: 'sofia.rossi@universite-labinux.example', firstName: 'Sofia', lastName: 'Rossi' },
  { email: 'thomas.nguyen@universite-labinux.example', firstName: 'Thomas', lastName: 'Nguyen' },
  { email: 'ines.moreau@universite-labinux.example', firstName: 'Inès', lastName: 'Moreau' },
  { email: 'lucas.petit@universite-labinux.example', firstName: 'Lucas', lastName: 'Petit' },
  { email: 'amina.diallo@universite-labinux.example', firstName: 'Amina', lastName: 'Diallo' },
  { email: 'hugo.lambert@universite-labinux.example', firstName: 'Hugo', lastName: 'Lambert' },
  { email: 'chloe.garcia@universite-labinux.example', firstName: 'Chloé', lastName: 'Garcia' },
  { email: 'yanis.bouchard@universite-labinux.example', firstName: 'Yanis', lastName: 'Bouchard' },
  { email: 'emma.fontaine@universite-labinux.example', firstName: 'Emma', lastName: 'Fontaine' },
];
/** Enough live sessions to fill the class wall; the last two learners stay "not started" on purpose. */
const LIVE_LEARNERS = 10;

export const ORG = { name: 'universite-labinux', displayName: 'Université Labinux', description: 'Université — département informatique' };
export const CLASS = { name: 'L3 Informatique — Groupe A', description: 'Licence 3 — groupe de TP A' };
const TRAINER_PLAN = 'Formateur'; // personal plan: what lets her create a team organisation
const ORG_PLAN = 'École / OF (sur devis)'; // a lycée is on the school offer; its budget carries ten live learners
const ASSIGNED_SCENARIOS = ['gameshell-basics-unix-shell-adventure', 'linux-rogue-lite'];

function auth(session: ApiSession) {
  return { Authorization: `Bearer ${session.token}` };
}

async function getJson(session: ApiSession, path: string): Promise<any> {
  const res = await session.api.get(`${API_BASE}${path}`, { headers: auth(session) });
  if (!res.ok()) throw new Error(`GET ${path} failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

async function postJson(session: ApiSession, path: string, data: unknown): Promise<any> {
  const res = await session.api.post(`${API_BASE}${path}`, { headers: auth(session), data });
  if (!res.ok()) throw new Error(`POST ${path} failed: ${res.status()} ${await res.text()}`);
  return res.json().catch(() => ({}));
}

function rows(body: any): any[] {
  return Array.isArray(body) ? body : body?.data || [];
}

/** Log the trainer in, registering her first when the database has never seen her. */
async function ensureTrainer(): Promise<ApiSession> {
  const existing = await apiLogin(TRAINER.email, DOCS_PASSWORD).catch(() => null);
  if (existing) return existing;

  const now = new Date().toISOString();
  const anonymous = await apiLogin(ADMIN_EMAIL, ADMIN_PASSWORD); // any request context will do
  const res = await anonymous.api.post(`${API_BASE}/users`, {
    data: {
      ...TRAINER,
      password: DOCS_PASSWORD,
      tosAcceptedAt: now,
      tosVersion: now.slice(0, 10),
    },
  });
  if (!res.ok()) throw new Error(`POST /users failed: ${res.status()} ${await res.text()}`);
  await verifyEmailViaToken(TRAINER.email);
  return apiLogin(TRAINER.email, DOCS_PASSWORD);
}

async function ensureTrainerPlan(admin: ApiSession, trainer: ApiSession, planId: string): Promise<void> {
  const current = await getJson(trainer, '/user-subscriptions/current').catch(() => null);
  if (current?.subscription_plan_id === planId || current?.subscription_plan?.id === planId) return;
  const userId = await getUserId(trainer);
  await postJson(admin, '/user-subscriptions/admin-assign', { user_id: userId, plan_id: planId, duration_days: 0 });
}

async function ensureOrg(admin: ApiSession, trainer: ApiSession, planId: string): Promise<string> {
  const orgs: Array<ApiOrganization & { subscription_plan_id?: string }> = await getOrganizations(trainer);
  let org = orgs.find((o) => o.name === ORG.name);
  if (!org) {
    org = await postJson(trainer, '/organizations', {
      name: ORG.name,
      display_name: ORG.displayName,
      description: ORG.description,
    });
  }
  if (!org?.id) throw new Error('organization creation returned no id');
  if (org.subscription_plan_id !== planId) {
    await postJson(admin, `/organizations/${org.id}/subscribe`, { subscription_plan_id: planId });
  }
  return org.id;
}

/** The class and its roster arrive together, the way a school's CSV export does. */
async function ensureClass(trainer: ApiSession, orgId: string): Promise<string> {
  const existing = await findTeacherGroup(trainer, new RegExp(`^${CLASS.name}$`));
  if (existing && existing.learner_count >= LEARNERS.length) return existing.group_id;

  const csv = (header: string, lines: string[]) => Buffer.from([header, ...lines].join('\n'));
  const file = (name: string, buffer: Buffer) => ({ name, mimeType: 'text/csv', buffer });
  const res = await trainer.api.post(`${API_BASE}/organizations/${orgId}/import`, {
    headers: auth(trainer),
    multipart: {
      users: file(
        'users.csv',
        csv(
          'email,first_name,last_name,password,role,force_reset',
          LEARNERS.map((l) => `${l.email},${l.firstName},${l.lastName},${DOCS_PASSWORD},member,false`)
        )
      ),
      groups: file(
        'groups.csv',
        csv('group_name,display_name,description,max_members', [
          `${CLASS.name},${CLASS.name},${CLASS.description},50`,
        ])
      ),
      memberships: file(
        'memberships.csv',
        csv(
          'user_email,group_name,role',
          LEARNERS.map((l) => `${l.email},${CLASS.name},member`)
        )
      ),
      dry_run: 'false',
    },
  });
  if (!res.ok()) throw new Error(`import failed: ${res.status()} ${await res.text()}`);

  const created = await findTeacherGroup(trainer, new RegExp(`^${CLASS.name}$`));
  if (!created) throw new Error(`import succeeded but ${CLASS.name} is not among the trainer's groups`);
  return created.group_id;
}

async function ensureAssignments(trainer: ApiSession, groupId: string): Promise<void> {
  const scenarios = rows(await getJson(trainer, '/scenarios'));
  // Filtered like the class page does it — the unfiltered list is every assignment the caller may see, paginated.
  const assigned = rows(await getJson(trainer, `/scenario-assignments?group_id=${groupId}`).catch(() => []));
  for (const name of ASSIGNED_SCENARIOS) {
    const scenario = scenarios.find((s) => s.name === name);
    if (!scenario) continue; // the catalogue is seeded separately; a missing one is not this fixture's problem
    if (assigned.some((a) => a.scenario_id === scenario.id)) continue;
    await createGroupAssignment(trainer, scenario.id, groupId);
  }
}

/**
 * Ten learners in the middle of the GameShell scenario, so the class page has
 * something live to show and the player screenshot is a real container, not an
 * empty frame. Sessions are reused while open and relaunched once they expire.
 * A host that refuses the launch (capacity, no Incus) leaves the id undefined
 * and the screens that need it are skipped, not failed.
 */
async function ensureLearnerSessions(orgId: string): Promise<string[]> {
  const terminals: string[] = [];
  for (const learner of LEARNERS.slice(0, LIVE_LEARNERS)) {
    const session = await apiLogin(learner.email, DOCS_PASSWORD);
    const scenario = rows(await getJson(session, '/scenarios')).find((s) => s.name === LIVE_SCENARIO);
    if (!scenario) return terminals;
    const open = (await getMyScenarioSessions(session)).find(
      (s) => s.scenario_id === scenario.id && OPEN_STATUSES.has(s.status)
    );
    const terminalId = open?.terminal_session_id ?? (await launchScenarioSession(session, scenario.id, orgId))?.terminal_session_id;
    await session.api.dispose();
    if (!terminalId) {
      console.warn(`docs fixture: no live session for ${learner.email} — live screens will be skipped`);
      return terminals;
    }
    terminals.push(terminalId);
  }
  return terminals;
}

const LIVE_SCENARIO = 'gameshell-basics-unix-shell-adventure';
// Mirrors models.OpenSessionStatuses in ocf-core, minus setup_failed: a failed build is not something to photograph.
const OPEN_STATUSES = new Set(['active', 'in_progress', 'provisioning']);

/**
 * A plain Debian terminal for the trainer, so "my sessions" and the terminal
 * view are not photographed empty. Same call the composer makes; reused while
 * the session is still running.
 */
async function ensureTrainerTerminal(trainer: ApiSession, orgId: string): Promise<string | undefined> {
  const running = rows(await getJson(trainer, '/terminals/user-sessions').catch(() => [])).find(
    (t) => t.status === 'running' || t.status === 'active'
  );
  if (running) return running.session_id;
  // The composed-session path does not create the terminal-trainer key on demand.
  await postJson(trainer, '/user-terminal-keys/regenerate', {}).catch(() => {});
  const res = await trainer.api.post(`${API_BASE}/terminals/start-composed-session`, {
    headers: auth(trainer),
    data: {
      distribution: 'debian',
      size: 's',
      features: { network: true },
      terms: "J'accepte les conditions d'utilisation du service terminal.",
      name: 'Atelier réseau — préparation',
      organization_id: orgId,
    },
    timeout: 120_000,
  });
  if (!res.ok()) {
    console.warn(`docs fixture: trainer terminal refused (${res.status()}) — terminal screens will be skipped`);
    return undefined;
  }
  return (await res.json()).session_id;
}

export interface DocsFixture {
  orgId: string;
  classId: string;
  /** Terminal session of the first learner, when the host could provision one. */
  learnerTerminalId?: string;
  /** One per live learner, in LEARNERS order — the first two get warmed up by the spec. */
  learnerTerminalIds: string[];
  /** The trainer's own plain terminal, same caveat. */
  trainerTerminalId?: string;
}

export async function ensureDocsFixture(): Promise<DocsFixture> {
  const admin = await apiLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  const plans = await getCatalogPlans(admin);
  const planId = (name: string) => {
    const plan = plans.find((p) => p.name === name);
    if (!plan) throw new Error(`no "${name}" plan in the catalogue — is the database seeded?`);
    return plan.id;
  };

  const trainer = await ensureTrainer();
  await ensureTrainerPlan(admin, trainer, planId(TRAINER_PLAN));
  const orgId = await ensureOrg(admin, trainer, planId(ORG_PLAN));
  const classId = await ensureClass(trainer, orgId);
  await ensureAssignments(trainer, classId);
  const learnerTerminalIds = await ensureLearnerSessions(orgId);
  const trainerTerminalId = await ensureTrainerTerminal(trainer, orgId);
  return { orgId, classId, learnerTerminalId: learnerTerminalIds[0], learnerTerminalIds, trainerTerminalId };
}
