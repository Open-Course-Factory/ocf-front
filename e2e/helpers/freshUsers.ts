import { type Page, expect, request as playwrightRequest } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { apiLogin, type ApiSession } from './paymentApi';
import { demoPause } from './demo';

/**
 * Fresh-account plumbing for the full trainer journey.
 *
 * Every other spec in this suite borrows the seeded dev personas (marc, karim,
 * lea…). This one must not: it buys a subscription, converts an organization
 * and imports learners, and all three are one-way changes that would leave the
 * shared roster in a state the next spec does not expect. So the journey
 * creates every account it touches, names them with a per-run stamp, and
 * deletes them again on the way out.
 *
 * The trainer is registered through the real /register form — it is the first
 * act of the demo. The learners are created by the CSV bulk import, which is
 * the feature under test, so there is no API shortcut for them either.
 */

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

/**
 * Satisfies the register form's three stated rules (8 chars, an uppercase, a
 * digit) and Casdoor's own policy. Shared by the trainer and the imported
 * learners so the spec never has to carry two password constants.
 */
export const FRESH_PASSWORD = 'OcfE2E2026!';

/**
 * Platform administrator, used for exactly one thing: deleting the accounts
 * this run created. DELETE /users/:id is AdminOnly, and no account the spec
 * creates can delete itself.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '1.supervisor@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'test';

export interface FreshUser {
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  displayName: string;
  password: string;
}

/**
 * A run-unique identity. Base36 of the clock keeps the local part short enough
 * to stay readable in the member search, which is how the seat assignment step
 * finds these people.
 */
export function freshUser(role: string, stamp: string, index?: number): FreshUser {
  const suffix = index === undefined ? role : `${role}${index}`;
  const local = `e2e-${suffix}-${stamp}`;
  return {
    email: `${local}@test.ocf`,
    firstName: 'E2E',
    lastName: `${suffix}-${stamp}`,
    // Casdoor requires a unique username; underscores keep it a valid handle.
    userName: `e2e_${suffix}_${stamp}`,
    displayName: `E2E ${suffix} ${stamp}`,
    password: FRESH_PASSWORD,
  };
}

/**
 * Register an account through the real form, the way a visitor arriving from
 * the public site would.
 *
 * /register is outside the product (it is what you see when you are not logged
 * in), so goto is legitimate here — the suite's no-goto rule governs navigation
 * BETWEEN authenticated pages, and /login already has the same exemption.
 */
export async function registerViaUi(page: Page, user: FreshUser): Promise<void> {
  await page.goto('/register', { waitUntil: 'networkidle' });

  await page.locator('#firstName').fill(user.firstName);
  await page.locator('#lastName').fill(user.lastName);
  await page.locator('#userName').fill(user.userName);
  await page.locator('#displayName').fill(user.displayName);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#confirmPassword').fill(user.password);

  // The form refuses to submit until the ToS box is ticked — the checkbox is
  // required and gates isFormValid, so this is not decoration.
  await page.locator('#tosAccepted').check();
  await demoPause(page);

  await page.locator('button[type="submit"]').click();

  // The handler shows a success alert and only then routes to /login after 2s.
  // Waiting on the alert rather than the URL distinguishes "created" from
  // "rejected" — a 409 leaves the form in place with an error alert instead.
  await expect(page.locator('.alert-success')).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
}

/**
 * Container holding ocf-core's Postgres, and the role/database to read it with.
 * Overridable because neither is guaranteed across machines — the WSL box uses
 * go_user/go_db where this one uses ocf/ocf.
 */
const PG_CONTAINER = process.env.E2E_PG_CONTAINER || 'ocf-core-postgres-1';
const PG_USER = process.env.E2E_PG_USER || 'ocf';
const PG_DATABASE = process.env.E2E_PG_DATABASE || 'ocf';

/**
 * Complete the email verification a real trainer would complete by clicking the
 * link in their inbox.
 *
 * This is NOT a shortcut past the product: it calls POST /auth/verify-email
 * with a genuine token, exactly as the link does. What it skips is the mail
 * hop, which dev has no server for — so the token is read out of the table the
 * registration wrote it to, the way you would read a test mailbox.
 *
 * It matters because the gate is real and invisible until you hit it: a
 * brand-new account may browse the catalogue but the paid plan's button is
 * disabled, and /bulk-license-purchase refuses to route at all
 * (requiresEmailVerification). A journey that starts at signup therefore
 * cannot buy anything until this runs.
 */
export async function verifyEmailViaToken(email: string): Promise<void> {
  // The address is always one this module minted, but the value is spliced
  // into SQL, so refuse anything that is not the plain shape we generate.
  expect(email, 'refusing to splice an unexpected address into SQL').toMatch(
    /^[a-z0-9._-]+@[a-z0-9.-]+$/i
  );

  const sql =
    `SELECT token FROM email_verification_tokens ` +
    `WHERE email = '${email}' AND used_at IS NULL ` +
    `ORDER BY created_at DESC LIMIT 1;`;

  const token = execFileSync(
    'docker',
    ['exec', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE, '-t', '-A', '-c', sql],
    { encoding: 'utf-8' }
  ).trim();

  expect(
    token,
    `no unused verification token for ${email} — did registration reach ocf-core?`
  ).toHaveLength(64);

  const api = await playwrightRequest.newContext();
  try {
    const res = await api.post(`${API_BASE}/auth/verify-email`, { data: { token } });
    expect(res.ok(), `verify-email refused the token: ${res.status()}`).toBeTruthy();
  } finally {
    await api.dispose();
  }
}

/**
 * The learners CSV the import page takes.
 *
 * Only the users file: the class itself is created in the console and named as
 * the import's target group, which is what puts these three in it.
 *
 * That is the order a trainer works in — the class exists, then the roster
 * arrives — and it is also the order that stays safe on an older backend. A
 * class created BY the import used to be unmanageable by the trainer who
 * imported it: processGroup wrote the ClassGroup with a raw db.Create, the hook
 * that enrols the owner never fired, and `CheckGroupRole` reads group_members
 * alone, so its own owner failed every GroupRole gate on it. Fixed in ocf-core
 * by routing every membership through GroupService.EnrolMember; the groups.csv
 * path is covered there by tests/groups/enrolMemberAuthorization_test.go rather
 * than here, because this spec is about the journey, not that regression.
 *
 * `force_reset` is deliberately "false". The import sets force_password_reset
 * only when the row asks for it, so an explicit password plus a declined reset
 * is what lets these learners log straight in later in the same run. A real
 * cohort would usually want the reset; this spec is not testing it.
 */
export function buildLearnersCsv(learners: FreshUser[]): string {
  return [
    'email,first_name,last_name,password,role,force_reset',
    ...learners.map(
      (l) => `${l.email},${l.firstName},${l.lastName},${l.password},member,false`
    ),
  ].join('\n');
}

/** An admin API session, or null when the environment has no admin to lend. */
export async function adminSession(): Promise<ApiSession | null> {
  return apiLogin(ADMIN_EMAIL, ADMIN_PASSWORD).catch(() => null);
}

/**
 * Delete every account this run created, best-effort.
 *
 * Best-effort on purpose: teardown runs after failures too, and a spec that
 * threw halfway must still clear what it managed to create. A user that was
 * never created simply is not found.
 */
export async function deleteUsersByEmail(
  admin: ApiSession,
  emails: string[]
): Promise<string[]> {
  const deleted: string[] = [];
  for (const email of emails) {
    const found = await admin.api
      .get(`${API_BASE}/users/search`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        params: { q: email },
      })
      .catch(() => null);
    if (!found || !found.ok()) continue;

    const body = await found.json().catch(() => null);
    const rows = Array.isArray(body) ? body : body?.data || [];
    // Search matches substrings; only ever delete an exact address, so a
    // truncated or mistyped stamp can never take a real account with it.
    const user = rows.find((u: any) => u.email === email);
    if (!user?.id) continue;

    const res = await admin.api
      .delete(`${API_BASE}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${admin.token}` },
      })
      .catch(() => null);
    if (res?.ok()) deleted.push(email);
  }
  return deleted;
}

/**
 * Delete an organization created by the run. Reports whether it went, rather
 * than swallowing the answer — see `reportLeaks`.
 */
export async function deleteOrganization(session: ApiSession, orgId: string): Promise<boolean> {
  const res = await session.api
    .delete(`${API_BASE}/organizations/${orgId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    .catch(() => null);
  return !!res?.ok();
}

/**
 * Delete a class group created by the run.
 *
 * Deleting the organization does NOT take its classes with it — the org row is
 * soft-deleted and its class_groups stay live — so a run that only deleted the
 * org left its class behind every time. This is the same endpoint the class
 * settings page's delete button calls.
 */
export async function deleteClassGroup(session: ApiSession, groupId: string): Promise<boolean> {
  const res = await session.api
    .delete(`${API_BASE}/class-groups/${groupId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    .catch(() => null);
  return !!res?.ok();
}

/**
 * Drop the verification-token rows registration wrote for these addresses.
 *
 * They are keyed to users that no longer exist by the time teardown runs, and
 * there is no endpoint that removes them — the product expects them to age out.
 * A spec that registers an account per run would otherwise leave one behind
 * every time.
 */
export function purgeVerificationTokens(emails: string[]): void {
  const safe = emails.filter((e) => /^[a-z0-9._-]+@[a-z0-9.-]+$/i.test(e));
  if (safe.length === 0) return;

  const list = safe.map((e) => `'${e}'`).join(',');
  try {
    execFileSync(
      'docker',
      [
        'exec', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DATABASE, '-q', '-c',
        `DELETE FROM email_verification_tokens WHERE email IN (${list});`,
      ],
      { encoding: 'utf-8' }
    );
  } catch {
    // Teardown must not fail the run; reportLeaks says what survived.
  }
}

/**
 * Say plainly what the run failed to clean up.
 *
 * Teardown is best-effort by necessity — it also runs after a mid-test failure,
 * when half of what it wants to delete was never created. That is exactly why
 * it must not be silent: every leak this spec has had was a delete whose
 * rejection went into a `.catch(() => {})` and was never seen again.
 */
export function reportLeaks(leaks: string[]): void {
  if (leaks.length === 0) return;
  console.warn(
    `\n[trainer-full-journey] teardown left these behind — delete them by hand:\n  - ${leaks.join(
      '\n  - '
    )}\n`
  );
}

/** The class groups an org holds — used to find the imported class by name. */
export async function findOrgGroupByName(
  session: ApiSession,
  orgId: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const res = await session.api.get(`${API_BASE}/organizations/${orgId}/groups`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  const rows = Array.isArray(body) ? body : body.data || [];
  return rows.find((g: any) => g.name === name || g.display_name === name) || null;
}
