import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { login, switchToOrg, getCurrentOrgName, closeUserMenu } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory, navigateViaSubscriptionMenu } from './helpers/ui';
import { demoPause } from './helpers/demo';
import {
  apiLogin,
  getCatalogPlans,
  getPurchasableSeatPlans,
  listBatches,
  waitForNewBatch,
  getCurrentSubscription,
  type ApiSession,
} from './helpers/paymentApi';
import { fillStripeCheckout } from './helpers/stripeCheckout';
import {
  importScenario,
  deleteScenario,
  getAvailableScenario,
  cleanupScenarioSession,
} from './helpers/scenarioApi';
import { waitForLiveTerminal, typeInTerminal } from './helpers/xterm';
import {
  freshUser,
  registerViaUi,
  buildLearnersCsv,
  adminSession,
  deleteUsersByEmail,
  deleteOrganization,
  deleteClassGroup,
  purgeVerificationTokens,
  reportLeaks,
  findOrgGroupByName,
  verifyEmailViaToken,
  FRESH_PASSWORD,
  type FreshUser,
} from './helpers/freshUsers';

/**
 * The whole trainer journey, on accounts that did not exist when the run
 * started: sign up, subscribe, open an organization, create a class and import
 * its three learners, buy and hand out their licences, assign a scenario, and
 * watch two of them work.
 *
 * Every other spec exercises one link of that chain against the seeded
 * personas. This one exists because the chain has never been walked whole, and
 * the interesting failures live in the joins — a plan that grants classrooms
 * but no seats, an import that fills a class without making anyone an org
 * member, a wall that has no tile for a learner whose session is live. None of
 * those show up when each link is tested against a database somebody already
 * put in the right state.
 *
 * It is also the demo: run it headed with DEMO=1 and it walks the product the
 * way a prospect would be shown it, from the signup form to the invigilation
 * wall. That is why the acts are UI even where an API call would be shorter —
 * only the scenario fixture is seeded through the API, because authoring a
 * scenario is a different feature with its own spec.
 *
 * Requirements (local only — CI has no Incus and skips at the first gate):
 *   - the full stack: ocf-core :8080, ocf-front :4000, casdoor, tt-backend
 *     with a live Incus behind it
 *   - `stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe`
 *     WITHOUT it the checkout completes on Stripe and the subscription never
 *     activates, and the run dies at the end of act 2
 *   - a platform admin to delete the created accounts afterwards
 *
 * See e2e/README-payments.md for the stack recipe.
 */

// A video of the full journey is the deliverable, not a debugging aid, so it
// is recorded on every run rather than on first retry like the rest of the
// suite. 1280x720 keeps it watchable without a 100 MB artifact.
test.use({ video: { mode: 'on', size: { width: 1280, height: 720 } } });

const RUN_STAMP = Date.now().toString(36);

const trainer = freshUser('trainer', RUN_STAMP);
const learners: FreshUser[] = [1, 2, 3].map((i) => freshUser('learner', RUN_STAMP, i));

/** The two learners who will be working when the trainer opens the wall. */
const WORKING_LEARNERS = 2;

const ORG_NAME = `e2e-org-${RUN_STAMP}`;
const ORG_DISPLAY_NAME = `E2E Formation ${RUN_STAMP}`;
const CLASS_DISPLAY_NAME = `E2E Promo ${RUN_STAMP}`;
const SCENARIO_TITLE = `E2E Journey ${RUN_STAMP}`;

/**
 * The plan the journey buys. Not "the cheapest paid plan": Solo is cheaper and
 * carries neither group_management nor session_supervision, so a trainer who
 * bought it could not create the class this spec then imports into. The plan
 * is discovered by capability rather than by name so the spec survives a
 * renamed catalogue.
 */
function classroomPlan(plans: any[]): any | null {
  const capable = plans
    .filter(
      (p) =>
        p.is_active &&
        p.is_catalog !== false &&
        p.price_amount > 0 &&
        p.group_management_enabled &&
        p.session_supervision_enabled
    )
    .sort((a, b) => a.price_amount - b.price_amount);
  return capable[0] || null;
}

let trainerApi: ApiSession | null = null;
let admin: ApiSession | null = null;
let targetPlan: any | null = null;
let seatPlan: any | null = null;
let trainerOrgId: string | null = null;
let scenarioId: string | null = null;
let classGroupId: string | null = null;
let knownBatchIds = new Set<string>();

test.beforeAll(async () => {
  // The catalogue is public enough to read with any account; the seeded admin
  // is the one account guaranteed to exist before this run creates anything.
  admin = await adminSession();
  if (!admin) return;
  targetPlan = classroomPlan(await getCatalogPlans(admin));
});

test.afterAll(async () => {
  // Order matters, and it is not the obvious one: the class must go before the
  // organization, because deleting an organization does NOT take its classes
  // with it. The learners' sessions go first of all, while their accounts still
  // exist to authenticate the call, and the accounts go last.
  const leaks: string[] = [];
  const emails = [trainer.email, ...learners.map((l) => l.email)];

  if (trainerApi) {
    for (const learner of learners) {
      await apiLogin(learner.email, FRESH_PASSWORD)
        .then(async (s) => {
          if (scenarioId) await cleanupScenarioSession(s, scenarioId).catch(() => {});
          await s.api.dispose();
        })
        .catch(() => {});
    }

    if (classGroupId && !(await deleteClassGroup(trainerApi, classGroupId))) {
      leaks.push(`class group ${CLASS_DISPLAY_NAME} (${classGroupId})`);
    }
    if (scenarioId && trainerOrgId) {
      await deleteScenario(trainerApi, trainerOrgId, scenarioId).catch(() => {});
    }
    if (trainerOrgId && !(await deleteOrganization(trainerApi, trainerOrgId))) {
      leaks.push(`organization ${ORG_NAME} (${trainerOrgId})`);
    }
    await trainerApi.api.dispose();
  }

  if (admin) {
    const deleted = await deleteUsersByEmail(admin, emails);
    for (const email of emails.filter((e) => !deleted.includes(e))) {
      leaks.push(`account ${email}`);
    }
    await admin.api.dispose();
  } else {
    leaks.push(`accounts ${emails.join(', ')} (no admin session to delete them)`);
  }

  purgeVerificationTokens(emails);
  reportLeaks(leaks);
});

/** The class row on the teacher console, whichever else is listed. */
function classRow(page: Page, name: string) {
  return page.locator('[data-test="class-row"]').filter({ hasText: name });
}

async function openMyClassesFromSidebar(page: Page): Promise<void> {
  await demoPause(page);
  await page.locator('.my-classes-entry a.my-classes-header').click();
  await expect(page).toHaveURL(/\/my-classes$/);
}

/**
 * Attach one CSV to its file input. The upload component takes a real File, so
 * the fixture is handed over as a buffer rather than written to disk — nothing
 * of this run should outlive it on the filesystem.
 */
async function attachCsv(page: Page, index: number, name: string, content: string): Promise<void> {
  await page
    .locator('.file-uploads input[type="file"]')
    .nth(index)
    .setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(content, 'utf-8') });
}

/**
 * Take a learner from the launcher to a live terminal, and say whether they
 * got one.
 *
 * A busy host answers a launch with an error toast instead of a navigation.
 * That is an environment condition and not a product defect, so it is reported
 * back rather than failed on — the caller decides whether the journey can go
 * on without this learner.
 */
async function launchScenario(page: Page, title: string): Promise<boolean> {
  await navigateViaMenuCategory(page, 'terminals', '/scenarios');

  const card = page.getByTestId('scenario-card').filter({ hasText: title });
  await expect(card, 'the assigned scenario must reach the learner').toBeVisible({
    timeout: 20_000,
  });
  await demoPause(page);
  await card.getByTestId('scenario-launch-btn').click();

  const errorToast = page.locator('.el-notification');
  await Promise.race([
    page.waitForURL(/\/terminal-session\//, { timeout: 240_000 }),
    errorToast.waitFor({ state: 'visible', timeout: 240_000 }),
  ]);
  return /\/terminal-session\//.test(page.url());
}

/**
 * Put the browser in a given organization, whether or not there is a switcher.
 *
 * An imported learner belongs to exactly ONE organization — the team org they
 * were imported into. The bulk import creates them straight in Casdoor, so they
 * never get the personal organization that registration would have made them,
 * and the switcher button only renders for someone with more than one org.
 * Calling switchToOrg blindly therefore waits out its timeout on a control that
 * was never going to appear, for a user who is already exactly where they
 * should be.
 */
async function ensureOrgContext(page: Page, orgDisplayName: string): Promise<void> {
  const current = await getCurrentOrgName(page).catch(() => '');
  await closeUserMenu(page);
  if (current.includes(orgDisplayName)) return;
  await switchToOrg(page, orgDisplayName);
}

/** Sign a learner in on their own context, with a clean org selection. */
async function openLearnerSession(
  context: BrowserContext,
  learner: FreshUser
): Promise<Page> {
  const page = await context.newPage();
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('currentOrganizationId'));
  await login(page, learner.email, FRESH_PASSWORD);
  await dismissVerificationBanner(page);
  return page;
}

test.describe('Trainer full journey', () => {
  test('a new trainer subscribes, imports a class, and watches it work', async ({
    page,
    browser,
  }) => {
    test.skip(!admin, 'no platform admin available — the run could not clean up after itself');
    test.skip(
      !targetPlan,
      'no active paid catalogue plan grants both group management and supervision'
    );
    // Signup, a Stripe round trip, an import, a second Stripe round trip, two
    // container provisionings and a supervision wall. The default 60s covers
    // the login.
    test.setTimeout(1_200_000);

    // ------------------------------------------------------------------
    // Act 1 — a trainer arrives with no account at all.
    // ------------------------------------------------------------------
    await test.step('the trainer creates an account and confirms their address', async () => {
      await registerViaUi(page, trainer);

      // Nothing paid is reachable until the address is confirmed: the paid
      // plan's button is disabled behind a "verify your e-mail" banner, and
      // /bulk-license-purchase will not even route. This posts the real token
      // to the real endpoint — see verifyEmailViaToken.
      await verifyEmailViaToken(trainer.email);

      await login(page, trainer.email, FRESH_PASSWORD);
      await dismissVerificationBanner(page);

      trainerApi = await apiLogin(trainer.email, FRESH_PASSWORD);

      // A brand-new account lands on the free plan, which is the thing act 2
      // changes. Asserting it here is what makes that change meaningful.
      const initial = await getCurrentSubscription(trainerApi);
      expect(
        initial?.subscription_plan?.price_amount ?? 0,
        'a new account starts on a free plan'
      ).toBe(0);
    });

    // ------------------------------------------------------------------
    // Act 2 — they buy the plan that lets them teach, through real Stripe.
    // ------------------------------------------------------------------
    await test.step(`the trainer subscribes to ${targetPlan.name}`, async () => {
      await navigateViaSubscriptionMenu(page, '/subscription-plans');

      const planCard = page
        .locator('.plan-card-compact')
        .filter({ has: page.locator('.plan-name-compact', { hasText: targetPlan.name }) });
      await expect(planCard).toBeVisible({ timeout: 20_000 });
      await planCard.scrollIntoViewIfNeeded();
      await demoPause(page, 2); // let the audience read the offer
      await planCard.locator('.btn-subscribe-compact').click();

      // Free → paid goes straight to the checkout step, which names the price
      // and says the trial plan is being replaced. The modal opens only once
      // the handler's subscription checks resolve.
      await expect(page.locator('[data-test="checkout-amount"]')).toBeVisible({
        timeout: 20_000,
      });
      await demoPause(page);

      // Then the coupon step, whose confirm button stays disabled until the
      // buyer waives the 14-day withdrawal right (art. L221-25 / L221-28 13°) —
      // a spec that skips the box waits out its timeout on a dead control.
      await expect(page.locator('[data-test="coupon-input"]')).toBeVisible({ timeout: 20_000 });
      await page.locator('[data-test="withdrawal-waiver"]').check();
      await demoPause(page);
      await page.locator('[data-test="coupon-confirm"]').click();

      await fillStripeCheckout(page, { email: trainer.email });

      await expect(page).toHaveURL(/\/checkout-success/, { timeout: 90_000 });
      await expect(page.locator('.success-animation')).toBeVisible({ timeout: 90_000 });
      await expect(page.locator('.subscription-details')).toContainText(targetPlan.name);

      // The webhook is what activates the subscription; without the forwarder
      // running, this is where the run stops. Poll the API rather than the
      // page so the failure names the subscription, not a missing selector.
      await expect
        .poll(
          async () => (await getCurrentSubscription(trainerApi!))?.subscription_plan?.name,
          {
            timeout: 120_000,
            message:
              `${targetPlan.name} never activated — is "stripe listen" forwarding to ocf-core?`,
          }
        )
        .toBe(targetPlan.name);
      await demoPause(page, 2);
    });

    // ------------------------------------------------------------------
    // Act 3 — the plan unlocks organizations, so they open one.
    // ------------------------------------------------------------------
    await test.step('the trainer opens their organization', async () => {
      // NOT via the sidebar: the organizations category is hidden while the
      // user has only a personal org (MainNavMenu's first filter), so a
      // first-time trainer has no menu entry for it. The console is the
      // intended door — it stays enabled in a personal context precisely so
      // that creating the first team org is reachable — and its CTA carries
      // ?create=1, which opens the form on arrival.
      await openMyClassesFromSidebar(page);

      await demoPause(page, 2); // the console explains why it is empty
      await page.locator('[data-test="create-organization-cta"]').click();
      await expect(page).toHaveURL(/\/organizations\?create=1$/);

      const modal = page.locator('.base-modal-container');
      await expect(modal).toBeVisible();
      await modal.locator('#org-name').fill(ORG_NAME);
      await modal.locator('#org-display-name').fill(ORG_DISPLAY_NAME);
      await demoPause(page);
      await modal.locator('.base-modal-footer button.btn-primary').click();
      await expect(modal).toBeHidden({ timeout: 20_000 });

      await expect(
        page.locator('.organization-card').filter({ hasText: ORG_DISPLAY_NAME })
      ).toHaveCount(1, { timeout: 20_000 });

      const orgs = await trainerApi!.api
        .get(`${process.env.OCF_API_URL || 'http://localhost:8080/api/v1'}/organizations`, {
          headers: { Authorization: `Bearer ${trainerApi!.token}` },
        })
        .then((r) => r.json());
      const rows = Array.isArray(orgs) ? orgs : orgs.data || [];
      trainerOrgId = rows.find((o: any) => o.name === ORG_NAME)?.id || null;
      expect(trainerOrgId, 'the new organization must be readable back').toBeTruthy();
    });

    // ------------------------------------------------------------------
    // Act 4 — the class and its three learners arrive as a CSV import.
    // ------------------------------------------------------------------
    await test.step('the class is created and its roster imported', async () => {
      // Enter the new organization first. It is where the trainer has to be
      // anyway — classes live in a team org, never in a personal one — and it
      // is also what makes the card's management actions appear: canManage
      // reads `organization_memberships` off the user snapshot taken at login,
      // so until that is refetched the org you just created offers you nothing
      // but "View".
      await ensureOrgContext(page, ORG_DISPLAY_NAME);

      // The class comes first and is created HERE rather than by the import,
      // which is the order a trainer works in: the class exists, then the
      // roster arrives. It is also what kept this spec working while a
      // class created by the import was unmanageable by its own owner — see
      // buildLearnersCsv for that story and where it is now guarded.
      await openMyClassesFromSidebar(page);
      await demoPause(page);
      await page.locator('[data-test="create-class"]').click();

      const classModal = page.locator('.base-modal-container');
      await expect(classModal).toBeVisible();
      await classModal.locator('#display_name').fill(CLASS_DISPLAY_NAME);
      await classModal.locator('#max_members').fill('20');
      await demoPause(page);
      await classModal.locator('.base-modal-footer button.btn-primary').click();
      await expect(classModal).toBeHidden({ timeout: 20_000 });
      await expect(classRow(page, CLASS_DISPLAY_NAME)).toHaveCount(1, { timeout: 20_000 });

      await navigateViaMenuCategory(page, 'organizations', '/organizations');

      const orgCard = page.locator('.organization-card').filter({ hasText: ORG_DISPLAY_NAME });
      const importButton = orgCard.locator('button.btn-secondary');
      await expect(
        importButton,
        'the owner must be offered the import action on their own organization'
      ).toBeVisible({ timeout: 20_000 });
      await importButton.scrollIntoViewIfNeeded();
      await demoPause(page);
      await importButton.click();
      await expect(page).toHaveURL(/\/organizations\/[^/]+\/import$/);

      await attachCsv(page, 0, 'learners.csv', buildLearnersCsv(learners));

      // "Groupe cible" is what puts the imported learners in the class — the
      // option's value is the group id, its label the display name.
      await page.locator('#targetGroup').selectOption({ label: CLASS_DISPLAY_NAME });
      await demoPause(page, 2); // the roster and its destination, before committing

      await page.locator('.action-buttons-right button.btn-primary').click();

      // Validation first: the page dry-runs the files and only then offers to
      // commit them. Proceeding is a separate, deliberate click.
      const proceed = page.locator('.validation-step button.btn-primary').first();
      await expect(proceed).toBeVisible({ timeout: 60_000 });
      await demoPause(page, 2);
      await proceed.click();

      // The success state is the assertion, not the text: ImportProgress
      // renders `.success-state` only when the import came back without
      // errors, so an import that half-worked shows the error state instead
      // and fails here rather than three acts later.
      await expect(page.locator('.import-step .success-state')).toBeVisible({ timeout: 120_000 });
      await demoPause(page, 2);

      // Read the class back rather than trusting the summary: this is the join
      // where a class can exist while nobody is in it.
      const group = await findOrgGroupByName(trainerApi!, trainerOrgId!, CLASS_DISPLAY_NAME);
      expect(group, 'the class must exist in the organization').toBeTruthy();
      classGroupId = group!.id;

      // And every learner must be able to sign in with the password the CSV
      // gave them — force_reset was declined, so there is no reset to walk.
      for (const learner of learners) {
        const session = await apiLogin(learner.email, FRESH_PASSWORD);
        await session.api.dispose();
      }
    });

    // ------------------------------------------------------------------
    // Act 5 — learners need machines, so the trainer buys and assigns seats.
    // ------------------------------------------------------------------
    await test.step('the trainer buys a licence for each learner', async () => {
      const seatPlans = await getPurchasableSeatPlans(trainerApi!);
      seatPlan = seatPlans.find((p) => p.seat_unit === 'learner_day') || seatPlans[0] || null;
      test.skip(!seatPlan, 'no purchasable learner seat plan in this environment');

      knownBatchIds = new Set((await listBatches(trainerApi!)).map((b) => b.id));

      await navigateViaSubscriptionMenu(page, '/bulk-license-purchase');
      await page.locator('[data-test="seat-purchase-learners"]').fill(String(learners.length));
      const duration = page.locator('[data-test="seat-purchase-duration"]');
      if (await duration.isVisible().catch(() => false)) {
        await duration.selectOption('1');
      }

      const quote = page
        .locator('[data-test="seat-purchase-quote"]')
        .filter({ hasText: seatPlan.name });
      await expect(quote).toBeVisible({ timeout: 20_000 });
      await demoPause(page, 2);
      await quote.click();
      await demoPause(page);
      await page.locator('.btn-purchase').click();

      await fillStripeCheckout(page, { email: trainer.email });
      await expect(page).toHaveURL(/\/license-management/, { timeout: 90_000 });

      const batchId = await waitForNewBatch(trainerApi!, knownBatchIds);
      expect(batchId, 'the seat batch must be provisioned by the webhook').toBeTruthy();

      const batchCard = page.locator('.batch-card').filter({ hasText: seatPlan.name }).first();
      await expect(batchCard).toBeVisible({ timeout: 30_000 });
      await batchCard.locator('.btn-action.success').click();
      await expect(page.locator('.btn-action.assign').first()).toBeVisible({ timeout: 20_000 });

      for (const learner of learners) {
        await page.locator('.btn-action.assign').first().click();
        const modal = page.locator('.assignment-modal-content');
        await expect(modal).toBeVisible();
        await page.locator('#user-search').fill(learner.email);
        const result = page.locator('.user-result').filter({ hasText: learner.email }).first();
        await expect(result, `the imported learner ${learner.email} must be searchable`).toBeVisible(
          { timeout: 15_000 }
        );
        await result.click();
        await demoPause(page);
        await page.locator('.base-modal-footer .btn-primary').click();
        await expect(modal).not.toBeVisible({ timeout: 20_000 });
      }

      await expect(page.locator('.stat-card.assigned .stat-value')).toHaveText(
        String(learners.length),
        { timeout: 20_000 }
      );
      await demoPause(page, 2);
    });

    // ------------------------------------------------------------------
    // Act 6 — a scenario is authored (API fixture) and assigned (UI).
    // ------------------------------------------------------------------
    await test.step('the trainer assigns a scenario to the class', async () => {
      // Authoring is a separate feature with its own specs; what this journey
      // is about is the assignment, so only the fixture takes the shortcut.
      const scenario = await importScenario(trainerApi!, trainerOrgId!, {
        title: SCENARIO_TITLE,
        description: 'Auto-generated by trainer-full-journey.spec.ts — safe to delete.',
        is_public: false,
        intro_text: 'Welcome to the class.',
        finish_text: 'Well done.',
        steps: [
          { title: 'Read the briefing', step_type: 'info', text_content: 'Read this, then continue.' },
          {
            title: 'Touch a file',
            step_type: 'terminal',
            text_content: 'Run `touch /tmp/e2e-journey` in the terminal.',
            // No verify_script: an empty script auto-passes on Verify.
          },
        ],
      });
      scenarioId = scenario.id;

      // Already inside the team organization since the import — the console
      // only lists the classes of the org in context.
      await openMyClassesFromSidebar(page);

      const row = classRow(page, CLASS_DISPLAY_NAME);
      await expect(row, 'the imported class must reach the teacher console').toHaveCount(1, {
        timeout: 20_000,
      });
      await expect(row.locator('[data-test="learner-count"]')).toContainText(
        String(learners.length)
      );

      await demoPause(page);
      await row.locator('[data-test="assign-scenario"]').click();
      await expect(page).toHaveURL(/\/classes\/[^/]+\/scenarios$/);

      await demoPause(page);
      await page.locator('.tab-header-actions button.btn-primary').first().click();

      const modal = page.locator('.base-modal-container');
      await expect(modal).toBeVisible();
      // By value, not by label: the option reads "{title} ({difficulty})", so
      // an exact-label match would never hit and a substring match is not on
      // offer. The id is what the fixture already handed back.
      await modal.locator('.select-scenario').selectOption(scenarioId!);
      await demoPause(page);
      await modal.locator('.base-modal-footer button.btn-primary').click();
      await expect(modal).toBeHidden({ timeout: 20_000 });

      await expect(page.locator('.scenarios-tab')).toContainText(SCENARIO_TITLE, {
        timeout: 20_000,
      });
      await demoPause(page, 2);
    });

    // ------------------------------------------------------------------
    // Act 7 — two learners sign in and start working, on their own browsers.
    // ------------------------------------------------------------------
    const learnerContexts: BrowserContext[] = [];
    try {
      await test.step('two learners start the scenario', async () => {
        // The first learner decides whether the host can provision at all. If
        // it cannot, the wall has nothing to show and the journey stops here
        // rather than failing on an empty grid.
        const working = learners.slice(0, WORKING_LEARNERS);

        for (const [index, learner] of working.entries()) {
          const context = await browser.newContext({
            recordVideo: { dir: 'test-results/journey-learners' },
          });
          learnerContexts.push(context);
          const learnerPage = await openLearnerSession(context, learner);

          // A learner reaches a group-assigned scenario only in the org that
          // owns the assignment — the import made them a member, so the
          // switcher offers it.
          await ensureOrgContext(learnerPage, ORG_DISPLAY_NAME);

          // Ask the API what this learner is offered before driving the UI: a
          // missing card then names the assignment as the cause instead of
          // failing on a selector that was never going to appear.
          const learnerApi = await apiLogin(learner.email, FRESH_PASSWORD);
          try {
            const card = await getAvailableScenario(learnerApi, SCENARIO_TITLE, trainerOrgId!);
            expect(
              card,
              `the assignment must offer ${SCENARIO_TITLE} to ${learner.email}`
            ).toBeTruthy();
          } finally {
            await learnerApi.api.dispose();
          }

          const launched = await launchScenario(learnerPage, SCENARIO_TITLE);
          if (!launched) {
            const toast = await page.locator('.el-notification').innerText().catch(() => '');
            test.skip(
              true,
              `launch refused by the backend (likely host capacity): ${toast.slice(0, 120)}`
            );
          }

          await expect(learnerPage.getByTestId('scenario-step-title')).toHaveText(
            'Read the briefing',
            { timeout: 60_000 }
          );

          // The first learner goes further than the second: someone has to be
          // AHEAD for the progression view to be showing anything but a row of
          // identical zeroes.
          if (index === 0) {
            await learnerPage.getByTestId('scenario-info-ack').click();
            await expect(learnerPage.getByTestId('scenario-step-title')).toHaveText(
              'Touch a file',
              { timeout: 30_000 }
            );
            await waitForLiveTerminal(learnerPage);
            await typeInTerminal(learnerPage, 'touch /tmp/e2e-journey');
            await demoPause(learnerPage, 2);
          } else {
            await waitForLiveTerminal(learnerPage);
          }
        }
      });

      // ------------------------------------------------------------------
      // Act 8 — the trainer watches: who is where, and two live screens.
      // ------------------------------------------------------------------
      await test.step('the trainer sees the progression and the wall', async () => {
        await openMyClassesFromSidebar(page);

        const row = classRow(page, CLASS_DISPLAY_NAME);
        await expect(row.locator('[data-test="live-number"]')).toHaveText(
          String(WORKING_LEARNERS),
          { timeout: 60_000 }
        );

        await demoPause(page);
        await row.locator('.class-name').click();
        await expect(page).toHaveURL(/\/classes\/[^/]+\/live/);

        await demoPause(page);
        await page.locator('.ocf-clv-btn', { hasText: 'Progression' }).click();
        await expect(page).toHaveURL(/view=progress/);

        const rows = page.locator('.ocf-prog-table .ocf-prog-row:not(.ocf-prog-head)');
        await expect(rows).toHaveCount(learners.length, { timeout: 30_000 });
        // Two of the three are connected, and at least one has left the first
        // step behind — the table is reporting real positions, not a default.
        await expect(rows.locator('.ocf-prog-dot-offline')).toHaveCount(
          learners.length - WORKING_LEARNERS,
          { timeout: 30_000 }
        );
        await expect(page.locator('.ocf-prog-position-label').filter({ hasText: 'Touch a file' }))
          .toHaveCount(1, { timeout: 60_000 });
        await expect(page.locator('.ocf-clp-state-error')).toHaveCount(0);
        await demoPause(page, 3); // the money shot: the class, live

        await demoPause(page);
        await page.locator('.ocf-clv-btn', { hasText: 'Mur' }).click();

        await expect(page.locator('.live-sessions-grid')).toBeVisible({ timeout: 60_000 });
        await expect(
          page.locator('.live-sessions-tile'),
          'the wall must carry one tile per working learner'
        ).toHaveCount(WORKING_LEARNERS, { timeout: 60_000 });
        await expect(page.locator('.live-sessions-error')).toHaveCount(0);

        // A tile is a live screen, not a placeholder: each one renders its own
        // terminal surface. Without this the wall could pass while showing two
        // grey rectangles.
        // One xterm root per tile — `.xterm` and not its canvases, of which
        // xterm draws several per terminal.
        await expect(page.locator('.live-sessions-tile .xterm')).toHaveCount(WORKING_LEARNERS, {
          timeout: 60_000,
        });
        await demoPause(page, 4); // dwell on the wall — this is the closing shot
      });
    } finally {
      for (const context of learnerContexts) {
        await context.close().catch(() => {});
      }
    }
  });
});
