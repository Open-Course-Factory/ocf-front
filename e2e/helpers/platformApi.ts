import { apiLogin, type ApiSession } from './paymentApi';

/**
 * Read-only ocf-core API helpers used to derive test expectations from live
 * data instead of hardcoding the dev database's roster.
 *
 * The dev database is a shared, long-lived environment: org memberships, plans
 * and size catalogs change whenever a campaign touches them. Specs that pin
 * "Karim sees 2 orgs" or "XL is locked" rot silently. These helpers let a spec
 * ask the API what the truth is right now and assert the RULE against it.
 */

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

export { apiLogin, type ApiSession };

export interface ApiOrganization {
  id: string;
  name: string;
  display_name: string;
  organization_type: 'personal' | 'team';
}

export interface ApiDistribution {
  name: string;
  prefix: string;
  description: string;
  is_global: boolean;
  default_size_key?: string;
}

export interface ApiSizeOption {
  key: string;
  name: string;
  memory: string;
  cpu_mcpu?: number;
  allowed: boolean;
  reason?: string;
  remaining_count: number;
}

export interface ApiFeatureOption {
  key: string;
  name: string;
  description?: string;
  allowed: boolean;
  reason?: string;
}

export interface ApiSessionOptions {
  distribution: ApiDistribution;
  allowed_sizes: ApiSizeOption[];
  allowed_features: ApiFeatureOption[];
  quota?: { scope?: string };
}

function authHeaders(session: ApiSession) {
  return { Authorization: `Bearer ${session.token}` };
}

async function getJson(session: ApiSession, path: string): Promise<any> {
  const response = await session.api.get(`${API_BASE}${path}`, { headers: authHeaders(session) });
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function getOrganizations(session: ApiSession): Promise<ApiOrganization[]> {
  const body = await getJson(session, '/organizations');
  return Array.isArray(body) ? body : body.data || [];
}

/** Display name as the org switcher renders it (`display_name || name`). */
export function orgDisplayName(org: ApiOrganization): string {
  return org.display_name || org.name;
}

export async function getDistributions(session: ApiSession): Promise<ApiDistribution[]> {
  const body = await getJson(session, '/terminals/distributions');
  return Array.isArray(body) ? body : body.data || [];
}

export async function getSessionOptions(
  session: ApiSession,
  distribution: string,
  organizationId: string
): Promise<ApiSessionOptions> {
  return getJson(
    session,
    `/terminals/session-options?distribution=${encodeURIComponent(distribution)}` +
      `&organization_id=${encodeURIComponent(organizationId)}`
  );
}

export interface ApiTerminalUsage {
  plan_name: string;
  max_cpu: number;
  max_memory_mb: number;
  used_cpu: number;
  used_memory_mb: number;
}

/**
 * Terminal budget as TerminalUsagePanel reads it for an org context, or null
 * when the context has no usable subscription (the panel renders nothing then).
 */
export async function getTerminalUsage(
  session: ApiSession,
  organizationId: string
): Promise<ApiTerminalUsage | null> {
  const response = await session.api.get(
    `${API_BASE}/terminals/my-usage?organization_id=${encodeURIComponent(organizationId)}`,
    { headers: authHeaders(session) }
  );
  if (response.status() === 403 || response.status() === 404) return null;
  if (!response.ok()) {
    throw new Error(`GET /terminals/my-usage failed: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

/**
 * `GET /users/me/features` for an org context — the source the nav gating and
 * the org-switch redirect read. An org with no resolvable plan answers 404,
 * reported here as null.
 */
async function getMeFeatures(session: ApiSession, organizationId: string): Promise<any | null> {
  const response = await session.api.get(
    `${API_BASE}/users/me/features?organization_id=${encodeURIComponent(organizationId)}`,
    { headers: authHeaders(session) }
  );
  return response.ok() ? response.json() : null;
}

/**
 * The backend's verdict on whether classrooms can be run in an org context.
 * This — not the `multiple_groups` plan feature — is what gates the groups nav
 * category and the /class-groups page: a personal org never qualifies, whatever
 * its plan holds, and an org member without a teaching role doesn't either.
 */
export async function canRunClassrooms(
  session: ApiSession,
  organizationId: string
): Promise<boolean> {
  const body = await getMeFeatures(session, organizationId);
  return body?.can_run_classrooms === true;
}

/** Name of the plan effective in an org context, empty when none resolves. */
export async function getEffectivePlanName(
  session: ApiSession,
  organizationId: string
): Promise<string> {
  const plan = (await getMeFeatures(session, organizationId))?.effective_features;
  return plan?.is_active ? plan.name || '' : '';
}

// ---------------------------------------------------------------------------
// Size capacity ordering — xl is the largest, xs the smallest.
// ---------------------------------------------------------------------------
const CAPACITY_DESCENDING = ['xl', 'l', 'm', 's', 'xs'];

function capacityIndex(key: string): number {
  const idx = CAPACITY_DESCENDING.indexOf(key.toLowerCase());
  return idx === -1 ? CAPACITY_DESCENDING.length : idx;
}

/** Sizes the composer renders, largest first (min_size ones don't exist for the distro). */
export function visibleSizes(options: ApiSessionOptions): ApiSizeOption[] {
  return options.allowed_sizes
    .filter((s) => s.reason !== 'min_size')
    .sort((a, b) => capacityIndex(a.key) - capacityIndex(b.key));
}

/**
 * A size can be launched when the plan allows it and budget remains. Under an
 * unlimited plan `remaining_count` is always 0 and carries no meaning.
 */
export function isLaunchable(options: ApiSessionOptions, size: ApiSizeOption): boolean {
  const unlimited = options.quota?.scope === 'unlimited';
  return size.allowed && (unlimited || size.remaining_count > 0);
}

/** The size the composer is expected to preselect: the largest launchable one. */
export function expectedPreselectedSize(options: ApiSessionOptions): ApiSizeOption | undefined {
  return visibleSizes(options).find((s) => isLaunchable(options, s));
}

/**
 * Feature chips the composer renders. `persistence` and `network` are owned by
 * the launcher's dedicated toggles and are deliberately never shown as chips.
 */
export function chipFeatures(options: ApiSessionOptions): ApiFeatureOption[] {
  return options.allowed_features.filter((f) => f.key !== 'persistence' && f.key !== 'network');
}
