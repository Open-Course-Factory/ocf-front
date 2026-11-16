import { test, expect, type Page } from '@playwright/test';
import { login, openUserMenu } from './helpers/auth';
import { dismissVerificationBanner } from './helpers/ui';
import { apiLogin, API_BASE, type ApiSession } from './helpers/paymentApi';

/**
 * Billing addresses page, end to end (#415).
 *
 * "Set as default" once PATCHed { set_default: true }, which ocf-core ignores,
 * and reloaded the list as if GET answered a bare array instead of the
 * pagination envelope. Both shipped because no spec opened this page.
 *
 * Runs as a member, the real user: a member can list their own addresses
 * since ocf-core!697 (403 before). An administrator cannot stand in — the
 * ownership hook's admin bypass leaves an admin-created address without an
 * owner, so set-default (scoped to the caller's user_id) changes nothing.
 * The administrator session only reads and cleans up through the API.
 */

const MEMBER_EMAIL = process.env.E2E_USER || 'karim@test.ocf';
const MEMBER_PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '1.supervisor@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'test';

const TAG = `E2E billing ${Date.now().toString(36)}`;
const FIRST = `${TAG} first`;
const SECOND = `${TAG} second`;

let admin: ApiSession;
let member: ApiSession;
let memberId: string;
let previousDefaultId: string | null = null;
let memberListStatus = 0;

function bearer(session: ApiSession) {
  return { Authorization: `Bearer ${session.token}` };
}

/** The member's addresses, read through the administrator's unscoped list. */
async function memberAddresses(): Promise<any[]> {
  const res = await admin.api.get(`${API_BASE}/billing-addresses`, { headers: bearer(admin) });
  if (!res.ok()) throw new Error(`list billing addresses failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).data.filter((a: any) => a.user_id === memberId);
}

async function addAddress(page: Page, line1: string, city: string): Promise<void> {
  await page.locator('[data-test="entity-add"]').click();
  const modal = page.locator('.base-modal-container');
  await expect(modal).toBeVisible();
  await modal.locator('#line1').fill(line1);
  await modal.locator('#city').fill(city);
  await modal.locator('#postal_code').fill('75001');
  await modal.locator('#country').selectOption('FR');
  await modal.locator('.base-modal-footer button.btn-primary').click();
  await expect(modal).toBeHidden();
}

function row(page: Page, line1: string) {
  return page.locator('li.entity-item').filter({ hasText: line1 });
}

test.beforeAll(async () => {
  admin = await apiLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
  member = await apiLogin(MEMBER_EMAIL, MEMBER_PASSWORD);
  const me = await member.api.get(`${API_BASE}/users/me`, { headers: bearer(member) });
  memberId = (await me.json()).id;
  memberListStatus = (await member.api.get(`${API_BASE}/billing-addresses`, { headers: bearer(member) })).status();
  previousDefaultId = (await memberAddresses()).find((a) => a.is_default)?.id ?? null;
});

test.afterAll(async () => {
  if (!admin || !member) return;
  for (const address of await memberAddresses()) {
    if (String(address.line1).startsWith(TAG)) {
      await member.api.delete(`${API_BASE}/billing-addresses/${address.id}`, { headers: bearer(member) });
    }
  }
  if (previousDefaultId) {
    await member.api.post(`${API_BASE}/billing-addresses/${previousDefaultId}/set-default`, { headers: bearer(member) });
  }
  await admin.api.dispose();
  await member.api.dispose();
});

test('a member sets the second of two new addresses as default', async ({ page }) => {
  test.skip(memberListStatus === 403, 'a member cannot list billing addresses yet: needs ocf-core!697 deployed');

  await login(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await dismissVerificationBanner(page);

  await openUserMenu(page);
  await page.locator('.user-dropdown a[href="/billing-addresses"]').click();
  await expect(page).toHaveURL(/\/billing-addresses/);
  await expect(page.locator('.billing-addresses-page')).toBeVisible();

  await addAddress(page, FIRST, 'Paris');
  await addAddress(page, SECOND, 'Lyon');
  await expect(row(page, FIRST)).toBeVisible();
  await expect(row(page, SECOND)).toBeVisible();

  await row(page, SECOND).locator('.address-actions button').click();

  // The list is reloaded from GET /billing-addresses (the envelope's data array)
  await expect(row(page, SECOND).locator('.default-badge')).toBeVisible();
  await expect(page.locator('li.entity-item .default-badge')).toHaveCount(1);
  await expect(row(page, FIRST).locator('.address-actions button')).toBeVisible();
  await expect(page.locator('.billing-addresses-page .alert-message')).toHaveCount(0);

  // The server agrees: exactly one default, and it is the second address
  const defaults = (await memberAddresses()).filter((a) => a.is_default);
  expect(defaults.map((a) => a.line1)).toEqual([SECOND]);
});
