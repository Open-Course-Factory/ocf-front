import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui'
import { demoPause } from './helpers/demo'
import { apiLogin, type ApiSession } from './helpers/paymentApi'

/**
 * The organization you just created must be one you can manage.
 *
 * "May I manage this organization?" is answered from `organization_memberships`
 * in the user snapshot, and that snapshot is taken at login. Creating an
 * organization enrols the creator as its owner — a membership the snapshot has
 * never heard of — so the owner used to be shown their own new organization
 * with neither Import nor Manage, only "View", until something else happened to
 * refetch it. Switching organization fixed it, which is why this never showed up
 * in a spec that switches: the bug lives in the window before anyone does.
 *
 * The assertion is therefore specifically about that window: create, and look
 * at the card WITHOUT reloading, switching, or navigating away first.
 *
 * Local only, like the rest of the org suite: it needs an account whose plan
 * allows organizations, and it self-skips when the seeded trainer has none.
 */

const TRAINER_EMAIL = process.env.E2E_TRAINER_EMAIL || 'marc@test.ocf'
const TRAINER_PASSWORD = process.env.E2E_TRAINER_PASSWORD || 'OcfTest2026!'

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1'
const RUN_STAMP = Date.now().toString(36)
const ORG_NAME = `e2e-orgperm-${RUN_STAMP}`
const ORG_DISPLAY_NAME = `E2E OrgPerm ${RUN_STAMP}`

let api: ApiSession | null = null
let mayCreate = false
let createdOrgId: string | null = null

test.beforeAll(async () => {
  api = await apiLogin(TRAINER_EMAIL, TRAINER_PASSWORD).catch(() => null)
  if (!api) return
  const res = await api.api.get(`${API_BASE}/auth/permissions`, {
    headers: { Authorization: `Bearer ${api.token}` },
  })
  if (res.ok()) mayCreate = (await res.json())?.can_create_organization === true
})

test.afterAll(async () => {
  // The organization is the only thing this spec creates, and it must not
  // outlive the run — an accumulating pile of them would change what the org
  // switcher offers every other spec.
  if (api && createdOrgId) {
    const res = await api.api
      .delete(`${API_BASE}/organizations/${createdOrgId}`, {
        headers: { Authorization: `Bearer ${api.token}` },
      })
      .catch(() => null)
    if (!res?.ok()) {
      console.warn(`[org-create-management-actions] left organization ${ORG_NAME} (${createdOrgId})`)
    }
  }
  await api?.api.dispose()
})

test('a newly created organization offers its owner the management actions', async ({ page }) => {
  test.skip(!api, `could not sign in as ${TRAINER_EMAIL} — seed the dev personas first`)
  test.skip(!mayCreate, `${TRAINER_EMAIL}'s plan does not allow creating organizations`)
  test.setTimeout(120_000)

  await login(page, TRAINER_EMAIL, TRAINER_PASSWORD)
  await dismissVerificationBanner(page)
  await navigateViaMenuCategory(page, 'organizations', '/organizations')

  await demoPause(page)
  await page.locator('.list-header button.btn-primary').click()

  const modal = page.locator('.base-modal-container')
  await expect(modal).toBeVisible()
  await modal.locator('#org-name').fill(ORG_NAME)
  await modal.locator('#org-display-name').fill(ORG_DISPLAY_NAME)
  await demoPause(page)
  await modal.locator('.base-modal-footer button.btn-primary').click()
  await expect(modal).toBeHidden({ timeout: 20_000 })

  const card = page.locator('.organization-card').filter({ hasText: ORG_DISPLAY_NAME })
  await expect(card).toHaveCount(1, { timeout: 20_000 })

  // Read the id back so teardown can remove it even if the assertions below fail.
  const orgs = await api!.api
    .get(`${API_BASE}/organizations`, { headers: { Authorization: `Bearer ${api!.token}` } })
    .then((r) => r.json())
  const rows = Array.isArray(orgs) ? orgs : orgs.data || []
  createdOrgId = rows.find((o: any) => o.name === ORG_NAME)?.id ?? null

  // The point of the spec. No reload, no org switch, no second navigation
  // between the creation and these two buttons — the owner must be able to act
  // on their organization the moment it appears.
  await expect(
    card.locator('button.btn-secondary'),
    'the owner must be offered Import on the organization they just created'
  ).toBeVisible({ timeout: 15_000 })
  await expect(
    card.locator('button.btn-primary'),
    'the owner must be offered Manage on the organization they just created'
  ).toBeVisible()
  await demoPause(page, 2)
})
