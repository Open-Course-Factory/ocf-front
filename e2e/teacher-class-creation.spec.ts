import { test, expect, type Page } from '@playwright/test'
import { login, getCurrentOrgName, switchToOrg, closeUserMenu } from './helpers/auth'
import { dismissVerificationBanner } from './helpers/ui'
import { demoPause } from './helpers/demo'

/**
 * The teacher path, end to end: Marc opens his console, creates a class, fills
 * it with three learners, and walks its five pages.
 *
 * The point of the spec is the DISPLAYS, not the API — a class of three must be
 * counted as three everywhere it is counted as a class (console row, live count,
 * progression table) and as four in the one place that counts its roster against
 * a capacity (settings), and each page must render its own not-started state
 * rather than an error or a blank.
 *
 * Every navigation is a real click, so a headed run is a demo of the feature.
 */

const TEACHER_EMAIL = 'marc@test.ocf'
const TEACHER_PASSWORD = 'OcfTest2026!'

/** The org display name, not the slug: the switcher lists "Marc Corp". */
const TEAM_ORG = 'Marc Corp'

/**
 * Searched by full email: the member search matches substrings, so "lea" finds
 * "karim_learner" before Léa.
 */
const LEARNER_EMAILS = ['karim@test.ocf', 'lea@test.ocf', 'jp@test.ocf']

/**
 * Creating a class enrols its owner as a member (core's GroupOwnerSetupHook), so
 * a brand new class holds one member and a class of three learners holds four.
 * That is the ROSTER: the capacity figure the settings page reports.
 */
const MEMBERS_AT_CREATION = 1
const MEMBERS_WITH_LEARNERS = MEMBERS_AT_CREATION + LEARNER_EMAILS.length

/**
 * The APPRENANTS, which is a different number and the one every learner-facing
 * figure states (issue #480, core !361): Marc holds the owner role, so his own
 * class starts with none and never counts him among them.
 *
 * The gap between the two is the point of this spec's counts — a surface reading
 * the roster where it means the class shows 1 and 4 here instead of 0 and 3.
 */
const LEARNERS_AT_CREATION = 0
const LEARNERS_WITH_LEARNERS = LEARNER_EMAILS.length

/** Unique per run so a leftover class from a failed run cannot be mistaken for this one. */
const CLASS_NAME = `E2E Docker ${Date.now()}`

function classRow(page: Page, name: string) {
  return page.locator('[data-test="class-row"]').filter({ hasText: name })
}

/** The sidebar entry is reachable from every authenticated page, class pages included. */
async function openMyClassesFromSidebar(page: Page): Promise<void> {
  await demoPause(page)
  await page.locator('.my-classes-entry a.my-classes-header').click()
  await expect(page).toHaveURL(/\/my-classes$/)
}

async function openClassPage(page: Page, label: string): Promise<void> {
  await demoPause(page)
  await page.locator('.class-nav a.cnav', { hasText: label }).click()
}

async function addLearner(page: Page, email: string): Promise<void> {
  await demoPause(page)
  await page.locator('.toolbar-actions button.btn-primary').click()

  const modal = page.locator('.base-modal-container')
  await expect(modal).toBeVisible()

  // Reopening the modal faster than the dropdown's 200ms hide timer used to
  // swallow the results of the search it had just run, so the second learner
  // was never offered. The timer is cancelled on focus now; this loop of three
  // reopenings is what would catch it coming back.
  await modal.locator('.user-search-container input').fill(email)

  const result = modal.locator('.search-dropdown .search-result').filter({ hasText: email })
  await expect(result).toHaveCount(1)
  await demoPause(page)
  await result.click()

  await demoPause(page)
  await modal.locator('.base-modal-footer button.btn-primary').click()
  await expect(modal).toBeHidden()

  await expect(page.locator('.member-card').filter({ hasText: email })).toHaveCount(1)
}

/**
 * Deletes the class through its settings page, from wherever the run left the
 * browser. A run must not leave classes behind for the next one to trip on.
 */
async function deleteClassIfPresent(page: Page, name: string): Promise<void> {
  // A failure can leave a modal overlay swallowing clicks on the sidebar, and
  // BaseModal has no Escape handler — its close button is the only way out.
  const close = page.locator('.base-modal-close')
  if (await close.isVisible().catch(() => false)) {
    await close.click({ timeout: 5_000 }).catch(() => {})
  }
  await openMyClassesFromSidebar(page)

  const row = classRow(page, name)
  if ((await row.count()) === 0) return

  await row.locator('[data-test="open-settings"]').click()
  await expect(page).toHaveURL(/\/classes\/[^/]+\/settings$/)

  await demoPause(page)
  await page.locator('.settings-actions button.btn-danger').click()

  const confirm = page.locator('.base-modal-container')
  await expect(confirm).toBeVisible()
  await demoPause(page)
  await confirm.locator('.base-modal-footer button.btn-primary').click()

  await expect(page).toHaveURL(/\/my-classes$/)
  await expect(classRow(page, name)).toHaveCount(0)
}

test.describe('Teacher creates a class', () => {
  // Nine steps against a live API: the default 60s covers barely more than login.
  test.setTimeout(240_000)

  test.afterEach(async ({ page }) => {
    // The happy path deletes the class as its last step, so this only fires when
    // the run failed earlier — the class must not survive it.
    await deleteClassIfPresent(page, CLASS_NAME).catch(() => {
      /* the failure that brought us here already left the page unusable */
    })
  })

  test('a class of three learners is counted the same on every page', async ({ page }) => {
    await test.step('Marc lands in his team organization', async () => {
      await login(page, TEACHER_EMAIL, TEACHER_PASSWORD)
      await dismissVerificationBanner(page)

      const currentOrg = await getCurrentOrgName(page)
      await closeUserMenu(page)
      if (!currentOrg.includes(TEAM_ORG)) {
        await switchToOrg(page, TEAM_ORG)
      }
    })

    await test.step('the console is the teacher’s home', async () => {
      await openMyClassesFromSidebar(page)

      const sidebarEntry = page.locator('.my-classes-entry a.my-classes-header')
      await expect(sidebarEntry).toBeVisible()
      await expect(sidebarEntry).toHaveClass(/is-section-active/)
      await expect(page.locator('[data-test="class-list"]')).toBeVisible()
    })

    await test.step('a new class appears on the console, empty and unassigned', async () => {
      await demoPause(page)
      await page.locator('[data-test="create-class"]').click()

      const modal = page.locator('.base-modal-container')
      await expect(modal).toBeVisible()
      await modal.locator('#display_name').fill(CLASS_NAME)
      await modal.locator('#max_members').fill('20')
      // "Actif" is deliberately left untouched: a class must be born active, and
      // an untouched checkbox must not archive it at birth.
      await demoPause(page)
      await modal.locator('.base-modal-footer button.btn-primary').click()

      // A creation that fails leaves the modal open having already blanked the
      // form, so the modal closing is the only proof the class was written.
      await expect(modal).toBeHidden()

      const row = classRow(page, CLASS_NAME)
      await expect(row).toHaveCount(1)
      await expect(row).toHaveAttribute('data-stripe', 'calm')
      await expect(row.locator('[data-test="state-badge"]')).toHaveCount(0)
      // Marc is on the roster of the class he just made, and he is not one of
      // its apprenants: "1 apprenant" here would be naming the teacher.
      await expect(row.locator('[data-test="learner-count"]')).toHaveText(
        `${LEARNERS_AT_CREATION} apprenant`
      )
      await expect(row.locator('[data-test="live-number"]')).toHaveText('0')
      await expect(row.locator('[data-test="live-count"]')).toContainText(
        `/ ${LEARNERS_AT_CREATION} connectés`
      )
      await expect(row.locator('[data-test="no-assignment"]')).toContainText(
        'Aucun scénario assigné'
      )
      await expect(row.locator('[data-test="assign-scenario"]')).toBeVisible()
    })

    await test.step('opening the class lands on its wall, under a banner of five pages', async () => {
      await demoPause(page)
      await classRow(page, CLASS_NAME).locator('.class-name').click()
      await expect(page).toHaveURL(/\/classes\/[^/]+\/live\?view=wall$/)

      const crumbLink = page.locator('.crumb .crumb-link')
      await expect(crumbLink).toHaveText('Mes classes')
      await expect(crumbLink).toHaveAttribute('href', '/my-classes')
      await expect(page.locator('.crumb-current')).toHaveText(CLASS_NAME)

      await expect(page.locator('.class-nav a.cnav')).toHaveText([
        'En direct',
        'Apprenants',
        'Scénarios',
        'Analytiques',
        'Réglages'
      ])

      // A class page is a page OF the console, so the sidebar entry stays lit.
      await expect(page.locator('.my-classes-entry a.my-classes-header')).toHaveClass(
        /is-section-active/
      )
    })

    await test.step('three learners join the roster', async () => {
      await openClassPage(page, 'Apprenants')
      await expect(page).toHaveURL(/\/classes\/[^/]+\/members$/)

      for (const email of LEARNER_EMAILS) {
        await addLearner(page, email)
      }

      await expect(page.locator('.member-card')).toHaveCount(MEMBERS_WITH_LEARNERS)
      for (const email of LEARNER_EMAILS) {
        await expect(page.locator('.member-card').filter({ hasText: email })).toHaveCount(1)
      }
    })

    await test.step('the console row counts them', async () => {
      await demoPause(page)
      await page.locator('.crumb .crumb-link').click()
      await expect(page).toHaveURL(/\/my-classes$/)

      const row = classRow(page, CLASS_NAME)
      await expect(row.locator('[data-test="learner-count"]')).toHaveText(
        `${LEARNERS_WITH_LEARNERS} apprenants`
      )
      await expect(row.locator('[data-test="live-number"]')).toHaveText('0')
      await expect(row.locator('[data-test="live-count"]')).toContainText(
        `/ ${LEARNERS_WITH_LEARNERS} connectés`
      )
    })

    await test.step('the progression view lists the apprenants, nobody started', async () => {
      await demoPause(page)
      await classRow(page, CLASS_NAME).locator('.class-name').click()
      await expect(page).toHaveURL(/\/classes\/[^/]+\/live\?view=wall$/)

      await demoPause(page)
      await page.locator('.ocf-clv-btn', { hasText: 'Progression' }).click()
      await expect(page).toHaveURL(/\/classes\/[^/]+\/live\?view=progress$/)

      // Three rows, not four: the invigilation table follows the apprenants, and
      // Marc watching his own class is not one of the people being watched.
      const rows = page.locator('.ocf-prog-table .ocf-prog-row:not(.ocf-prog-head)')
      await expect(rows).toHaveCount(LEARNERS_WITH_LEARNERS)
      await expect(rows.locator('.ocf-prog-dot-offline')).toHaveCount(LEARNERS_WITH_LEARNERS)
      await expect(rows.locator('.ocf-prog-position-label')).toHaveText(
        new Array(LEARNERS_WITH_LEARNERS).fill('Aucune étape')
      )

      // No scenario assigned: the view says so and draws no step distribution
      // rather than a strip of empty columns.
      await expect(page.locator('.ocf-clp-note')).toContainText('Aucun scénario assigné')
      await expect(page.locator('.ocf-dist')).toHaveCount(0)
      await expect(page.locator('.ocf-clp-state-error')).toHaveCount(0)
    })

    await test.step('the wall renders its empty state and the switch goes both ways', async () => {
      await demoPause(page)
      await page.locator('.ocf-clv-btn', { hasText: 'Mur' }).click()

      await expect(page.locator('.live-sessions-tab')).toBeVisible()
      await expect(page.locator('.live-sessions-state')).toContainText('Aucune session active')
      await expect(page.locator('.live-sessions-error')).toHaveCount(0)

      await demoPause(page)
      await page.locator('.ocf-clv-btn', { hasText: 'Progression' }).click()
      await expect(page.locator('.ocf-prog-table')).toBeVisible()
    })

    await test.step('scenarios, analytics and settings each render their own state', async () => {
      await openClassPage(page, 'Scénarios')
      await expect(page).toHaveURL(/\/classes\/[^/]+\/scenarios$/)
      await expect(page.locator('.scenarios-tab .empty-state')).toContainText(
        'Aucun scénario assigné à ce groupe.'
      )

      await openClassPage(page, 'Analytiques')
      await expect(page).toHaveURL(/\/classes\/[^/]+\/analytics$/)
      await expect(page.locator('.analytics-tab')).toBeVisible()
      // Command replay is forensic, so it stays folded — and unmounted — until asked for.
      await expect(page.locator('.replay-toggle')).toHaveAttribute('aria-expanded', 'false')
      await expect(page.locator('.group-command-history')).toHaveCount(0)

      await openClassPage(page, 'Réglages')
      await expect(page).toHaveURL(/\/classes\/[^/]+\/settings$/)
      await expect(infoValue(page, "Nom d'affichage")).toHaveText(CLASS_NAME)
      // The roster, deliberately: this figure is what fills against "Membres
      // maximum", so it counts Marc — the one place the four is the right answer.
      await expect(infoValue(page, 'Membres actuels')).toHaveText(String(MEMBERS_WITH_LEARNERS))
      await expect(infoValue(page, 'Membres maximum')).toHaveText('20')
    })

    await test.step('deleting the class returns to a console without it', async () => {
      await demoPause(page)
      await page.locator('.settings-actions button.btn-danger').click()

      const confirm = page.locator('.base-modal-container')
      await expect(confirm).toBeVisible()
      await demoPause(page)
      await confirm.locator('.base-modal-footer button.btn-primary').click()

      await expect(page).toHaveURL(/\/my-classes$/)
      await expect(classRow(page, CLASS_NAME)).toHaveCount(0)
    })
  })
})

/** The value shown beside a label in the settings information grid. */
function infoValue(page: Page, label: string) {
  return page.locator('.info-item').filter({ hasText: label }).locator('p')
}
