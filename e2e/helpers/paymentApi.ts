import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';

/**
 * Direct ocf-core API helpers for payment E2E tests.
 *
 * The specs use these for setup/teardown only — the behavior under test always
 * goes through the real UI. Talking to the API directly lets every test start
 * from a known subscription state and restore it afterwards, so the suite is
 * re-runnable against a long-lived dev database.
 */

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';

export interface ApiSession {
  api: APIRequestContext;
  token: string;
}

export async function apiLogin(email: string, password: string): Promise<ApiSession> {
  // No baseURL on the context: Playwright resolves absolute paths against the
  // host only, which would silently drop the /api/v1 prefix. Full URLs instead.
  const api = await playwrightRequest.newContext();
  const response = await api.post(`${API_BASE}/auth/login`, { data: { email, password } });
  if (!response.ok()) {
    throw new Error(`API login failed for ${email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  const token = body.access_token || body.token;
  if (!token) {
    throw new Error(`API login for ${email} returned no token`);
  }
  return { api, token };
}

function authHeaders(session: ApiSession) {
  return { Authorization: `Bearer ${session.token}` };
}

export async function getCurrentSubscription(session: ApiSession): Promise<any | null> {
  const response = await session.api.get(`${API_BASE}/user-subscriptions/current`, {
    headers: authHeaders(session),
  });
  if (response.status() === 404) return null;
  if (!response.ok()) {
    throw new Error(`GET /user-subscriptions/current failed: ${response.status()}`);
  }
  const subscription = await response.json();
  // The endpoint answers 200 with a zero-value plan when nothing is active.
  if (!subscription?.subscription_plan?.name) return null;
  return subscription;
}

export async function getCatalogPlans(session: ApiSession): Promise<any[]> {
  const response = await session.api.get(`${API_BASE}/subscription-plans`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET /subscription-plans failed: ${response.status()}`);
  }
  const body = await response.json();
  return Array.isArray(body) ? body : body.data || [];
}

/**
 * The user's personal organization id, or null if they have none. Subscription
 * state is org-scoped in the UI: with a team org active,
 * /user-subscriptions/current answers for the org, not the user — a personal
 * purchase test must run in the personal context when one exists.
 */
export async function getPersonalOrganizationId(session: ApiSession): Promise<string | null> {
  const response = await session.api.get(`${API_BASE}/organizations`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET /organizations failed: ${response.status()}`);
  }
  const body = await response.json();
  const orgs = Array.isArray(body) ? body : body.data || [];
  const personal = orgs.find((o: any) => o.organization_type === 'personal');
  return personal ? personal.id : null;
}

/**
 * Name of the cheapest active paid catalog plan — the purchase target. Looked
 * up instead of hardcoded so the spec works on any seeded database (dev has
 * Solo/Formateur, a fresh CI stack seeds different defaults).
 */
export async function findCheapestPaidPlanName(session: ApiSession): Promise<string> {
  const plans = await getCatalogPlans(session);
  const paid = plans
    .filter((p) => p.price_amount > 0 && p.is_active && p.is_catalog !== false)
    .sort((a, b) => a.price_amount - b.price_amount);
  if (paid.length === 0) {
    throw new Error('No active paid catalog plan found — is the database seeded?');
  }
  return paid[0].name;
}

export async function cancelSubscriptionImmediately(
  session: ApiSession,
  subscriptionId: string
): Promise<void> {
  const response = await session.api.post(
    `${API_BASE}/user-subscriptions/${subscriptionId}/cancel?cancel_immediately=true`,
    { headers: authHeaders(session) }
  );
  if (!response.ok()) {
    throw new Error(`Cancel subscription ${subscriptionId} failed: ${response.status()} ${await response.text()}`);
  }
}

/** Activate the free catalog plan (price 0) for the user — no Stripe involved. */
export async function activateFreePlan(session: ApiSession): Promise<void> {
  const plans = await getCatalogPlans(session);
  const freePlan = plans.find((p) => p.price_amount === 0 && p.is_active);
  if (!freePlan) {
    throw new Error('No active free plan found in the catalog');
  }
  const response = await session.api.post(`${API_BASE}/user-subscriptions/checkout`, {
    headers: authHeaders(session),
    data: {
      subscription_plan_id: freePlan.id,
      success_url: 'http://localhost:4000/subscription-dashboard',
      cancel_url: 'http://localhost:4000/subscription-plans',
    },
  });
  if (!response.ok()) {
    throw new Error(`Free plan activation failed: ${response.status()} ${await response.text()}`);
  }
}

/**
 * Reset the user to the free plan, whatever state a previous (possibly aborted)
 * run left them in. Cancellation is eventually consistent on the backend, so we
 * poll until the paid subscription is really gone before activating the free one.
 */
export async function resetToFreePlan(session: ApiSession): Promise<void> {
  const current = await getCurrentSubscription(session);

  if (current && current.subscription_plan.price_amount > 0) {
    await cancelSubscriptionImmediately(session, current.id);
    await waitFor(async () => {
      const sub = await getCurrentSubscription(session);
      return !sub || sub.subscription_plan.price_amount === 0 || sub.status !== 'active';
    }, 'paid subscription to be cancelled');
  }

  const afterCancel = await getCurrentSubscription(session);
  if (!afterCancel || afterCancel.status !== 'active') {
    await activateFreePlan(session);
  }
}

// ---------------------------------------------------------------------------
// Bulk seat purchases (subscription batches)
// ---------------------------------------------------------------------------

/**
 * The seat plans the user may bulk-purchase, as the purchase page sees them.
 * Returns an empty list when the user is not allowed to buy seats at all.
 */
export async function getPurchasableSeatPlans(session: ApiSession): Promise<any[]> {
  const response = await session.api.get(`${API_BASE}/subscription-batches/purchasable-plans`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET /subscription-batches/purchasable-plans failed: ${response.status()}`);
  }
  const body = await response.json();
  if (!body.can_purchase) return [];
  return body.plans || [];
}

export async function listBatches(session: ApiSession): Promise<any[]> {
  const response = await session.api.get(`${API_BASE}/subscription-batches`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET /subscription-batches failed: ${response.status()}`);
  }
  const body = await response.json();
  return Array.isArray(body) ? body : body.data || body.batches || [];
}

export async function getBatchLicenses(session: ApiSession, batchId: string): Promise<any[]> {
  const response = await session.api.get(`${API_BASE}/subscription-batches/${batchId}/licenses`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET batch licenses failed: ${response.status()}`);
  }
  const body = await response.json();
  return Array.isArray(body) ? body : body.data || body.licenses || [];
}

/**
 * Revoke every assigned licence of a batch, restoring the students to their
 * previous plans. The batch itself is deliberately KEPT: a prepaid pack's
 * Stripe subscription is already scheduled to cancel at the pack deadline, and
 * a surviving batch row is what moves the checkout idempotency discriminator —
 * hard-deleting it would make the next same-day purchase replay a consumed
 * Stripe session.
 */
export async function revokeAllBatchLicenses(session: ApiSession, batchId: string): Promise<void> {
  const licenses = await getBatchLicenses(session, batchId);
  for (const license of licenses) {
    if (license.user_id) {
      const response = await session.api.delete(
        `${API_BASE}/subscription-batches/${batchId}/licenses/${license.id}/revoke`,
        { headers: authHeaders(session) }
      );
      if (!response.ok()) {
        throw new Error(
          `Revoke licence ${license.id} failed: ${response.status()} ${await response.text()}`
        );
      }
    }
  }
}

/** Poll until the batch list contains an id absent from `knownIds`; returns it. */
export async function waitForNewBatch(
  session: ApiSession,
  knownIds: Set<string>
): Promise<string> {
  let newId = '';
  await waitFor(async () => {
    const batches = await listBatches(session);
    const fresh = batches.find((b) => !knownIds.has(b.id));
    if (fresh) newId = fresh.id;
    return Boolean(fresh);
  }, 'a new subscription batch to be provisioned', 60_000, 2_000);
  return newId;
}

async function waitFor(
  condition: () => Promise<boolean>,
  label: string,
  timeoutMs = 15_000,
  intervalMs = 1_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label}`);
}
