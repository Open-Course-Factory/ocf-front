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
 * The user's personal organization id. Subscription state is org-scoped in the
 * UI: with a team org active, /user-subscriptions/current answers for the org,
 * not the user — a personal purchase test must run in the personal context.
 */
export async function getPersonalOrganizationId(session: ApiSession): Promise<string> {
  const response = await session.api.get(`${API_BASE}/organizations`, {
    headers: authHeaders(session),
  });
  if (!response.ok()) {
    throw new Error(`GET /organizations failed: ${response.status()}`);
  }
  const body = await response.json();
  const orgs = Array.isArray(body) ? body : body.data || [];
  const personal = orgs.find((o: any) => o.organization_type === 'personal');
  if (!personal) {
    throw new Error('No personal organization found for user');
  }
  return personal.id;
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
