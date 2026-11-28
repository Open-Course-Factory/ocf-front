import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import {
  apiLogin,
  importScenario,
  deleteScenarioById,
  cleanupScenarioSession,
  getMyScenarioSessions,
  endLocalRuns,
  type ApiSession,
} from './helpers/scenarioApi';
import { adminSession } from './helpers/freshUsers';
import { readTerminalText, typeInTerminal, waitForLiveTerminal } from './helpers/xterm';

/**
 * A lab set to run in the learner's browser, played by a learner from the real
 * Labinux pages: the platform switch on, the learner's plan allowing local
 * machines, the run boots in the tab, « Vérifier » fails then passes as the
 * learner types, and the run completes. Then the switch off: the same lab runs
 * in a container, as before local machines existed.
 *
 * The fixture has no flags and no exam: those are refused on a local machine.
 */

const API = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';
const LEARNER_EMAIL = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const STAMP = Date.now().toString(36);
// Two copies of the same lab, both set to run in the browser: one is played with
// the switch on, the other with it off.
const TITLE_SWITCH_ON = `E2E local machine ${STAMP}`;
const TITLE_SWITCH_OFF = `E2E local machine off ${STAMP}`;
const TITLE_RELOAD = `E2E local machine reload ${STAMP}`;
const TITLE_POPOUT = `E2E local machine popout ${STAMP}`;
const TITLE_SLOW_BUILD = `E2E local machine slow build ${STAMP}`;
const TITLE_APT = `E2E local machine apt ${STAMP}`;

let admin: ApiSession | null = null;
let learner: ApiSession;
const scenarioIds: string[] = [];
let planId = '';
let planSettingBefore = 'off';

function asAdmin() {
  return { Authorization: `Bearer ${admin!.token}` };
}

// The switch as the spec found it, given back at the end: a stack someone
// is trying by hand keeps the machines it had.
let switchBefore: boolean | undefined;

async function setLocalMachinesSwitch(enabled: boolean): Promise<void> {
  const list = await admin!.api.get(`${API}/features?key=local_machines`, { headers: asAdmin() });
  const flag = (await list.json()).data.find((f: { key: string; enabled: boolean }) => f.key === 'local_machines');
  expect(flag, 'the local machines switch is seeded').toBeTruthy();
  switchBefore ??= flag.enabled;
  const res = await admin!.api.patch(`${API}/features/${flag.id}`, { headers: asAdmin(), data: { enabled } });
  expect(res.ok(), await res.text()).toBeTruthy();
}

async function setPlanLocalMachines(setting: string): Promise<void> {
  const res = await admin!.api.patch(`${API}/subscription-plans/${planId}`, { headers: asAdmin(), data: { local_machines: setting } });
  expect(res.ok(), await res.text()).toBeTruthy();
}

async function launch(page: Page, title: string): Promise<string> {
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');
  const card = page.getByTestId('scenario-card').filter({ hasText: title });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByTestId('scenario-launch-btn').click();
  await page.waitForURL(/\/terminal-session\//, { timeout: 240_000 });
  return page.url().split('/terminal-session/')[1].split(/[?#]/)[0];
}

async function playTheLab(page: Page): Promise<void> {
  const stepTitle = page.getByTestId('scenario-step-title');
  await expect(stepTitle).toHaveText('Créer le fichier', { timeout: 120_000 });
  // The step's foreground script is typed as the shell opens: waited for before
  // anything else is typed, or the two lines interleave.
  await expect.poll(() => readTerminalText(page), { timeout: 120_000 }).toContain('PRET-42');
  await waitForLiveTerminal(page, 60_000);

  await page.getByTestId('scenario-verify-btn').click();
  const result = page.getByTestId('scenario-verify-result');
  await expect(result).toHaveClass(/failed/, { timeout: 60_000 });
  await expect(result.locator('.output-text')).toContainText('/tmp/bonjour.txt');
  await expect(stepTitle).toHaveText('Créer le fichier');

  await typeInTerminal(page, 'echo bonjour > /tmp/bonjour.txt');
  await page.getByTestId('scenario-verify-btn').click();
  await expect(stepTitle).toHaveText('Lire le fichier', { timeout: 60_000 });

  await typeInTerminal(page, 'cat /tmp/bonjour.txt > /tmp/lu.txt');
  await page.getByTestId('scenario-verify-btn').click();
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
}

test.beforeAll(async () => {
  admin = await adminSession();
  learner = await apiLogin(LEARNER_EMAIL, PASSWORD);
  if (!admin) return;

  const current = await learner.api.get(`${API}/user-subscriptions/current`, { headers: { Authorization: `Bearer ${learner.token}` } });
  const subscription = await current.json();
  planId = subscription.subscription_plan_id;
  planSettingBefore = subscription.subscription_plan?.local_machines || 'off';

  // A reload boots an empty machine: the step's world comes back through the
  // rebuild (its background script), the learner's own file does not.
  scenarioIds.push((await importScenario(admin, null, {
    title: TITLE_RELOAD,
    description: 'Auto-generated by local-machine.spec.ts — safe to delete.',
    is_public: true,
    machine: 'local',
    // The console runs as this uid, not as root, and without the image's sudo.
    session_user: 1000,
    steps: [{
      title: 'Garder le monde',
      step_type: 'terminal',
      text_content: 'Écrivez `moi` dans le fichier `/tmp/moi.txt`, puis cliquez sur « Vérifier ».',
      background_script: 'echo monde > /tmp/monde.txt',
      verify_script: 'test -f /tmp/monde.txt || { echo "le monde manque"; exit 1; }; grep -qx moi /tmp/moi.txt || { echo "/tmp/moi.txt manque"; exit 1; }',
    }],
  })).id);

  // Worked on from a popped-out terminal window, checked from the page.
  scenarioIds.push((await importScenario(admin, null, {
    title: TITLE_POPOUT,
    description: 'Auto-generated by local-machine.spec.ts — safe to delete.',
    is_public: true,
    machine: 'local',
    steps: [{
      title: 'Écrire depuis la fenêtre',
      step_type: 'terminal',
      text_content: 'Ouvrez le terminal dans une fenêtre séparée, puis écrivez `popup` dans `/tmp/popup.txt`.',
      background_script: 'echo monde-$((6*7)) > /tmp/monde.txt',
      verify_script: 'grep -qx popup /tmp/popup.txt || { echo "/tmp/popup.txt manque"; exit 1; }',
    }],
  })).id);

  // A package the image does not have, installed by the learner.
  scenarioIds.push((await importScenario(admin, null, {
    title: TITLE_APT,
    description: 'Auto-generated by local-machine.spec.ts — safe to delete.',
    is_public: true,
    machine: 'local',
    steps: [{
      title: 'Installer cowsay',
      step_type: 'terminal',
      text_content: 'Installez le paquet `cowsay` avec apt-get.',
      verify_script: 'test -x /usr/games/cowsay || { echo "cowsay manque"; exit 1; }',
    }],
  })).id);

  // A setup long enough to reload the page while it runs.
  scenarioIds.push((await importScenario(admin, null, {
    title: TITLE_SLOW_BUILD,
    description: 'Auto-generated by local-machine.spec.ts — safe to delete.',
    is_public: true,
    machine: 'local',
    setup_script: 'sleep 10; echo monde > /tmp/monde.txt',
    steps: [{
      title: 'Attendre le monde',
      step_type: 'terminal',
      text_content: 'Cliquez sur « Vérifier ».',
      verify_script: 'test -f /tmp/monde.txt || { echo "le monde manque"; exit 1; }',
    }],
  })).id);

  for (const title of [TITLE_SWITCH_ON, TITLE_SWITCH_OFF]) scenarioIds.push((await importScenario(admin, null, {
    title,
    description: 'Auto-generated by local-machine.spec.ts — safe to delete.',
    is_public: true,
    machine: 'local',
    steps: [
      {
        title: 'Créer le fichier',
        step_type: 'terminal',
        text_content: 'Écrivez `bonjour` dans le fichier `/tmp/bonjour.txt`, puis cliquez sur « Vérifier ».',
        verify_script: 'grep -qx bonjour /tmp/bonjour.txt || { echo "/tmp/bonjour.txt ne contient pas bonjour"; exit 1; }',
        // Staged by the launch build while the console is held, typed when the
        // learner's shell opens.
        foreground_script: 'echo PRET-$((40+2))',
      },
      {
        title: 'Lire le fichier',
        step_type: 'terminal',
        text_content: 'Copiez le contenu de `/tmp/bonjour.txt` dans `/tmp/lu.txt`.',
        verify_script: 'cmp -s /tmp/bonjour.txt /tmp/lu.txt || { echo "/tmp/lu.txt est différent"; exit 1; }',
      },
    ],
  })).id);
});

// One live run in the browser per learner: whatever a test leaves, ended or
// failed, must not refuse the next test's launch.
test.afterEach(async () => {
  await endLocalRuns(learner);
})

test.afterAll(async () => {
  if (admin) {
    if (switchBefore !== undefined) await setLocalMachinesSwitch(switchBefore).catch(() => {});
    if (planId) await setPlanLocalMachines(planSettingBefore).catch(() => {});
    for (const id of scenarioIds) {
      await cleanupScenarioSession(learner, id).catch(() => {});
      await deleteScenarioById(admin, id);
    }
  }
  await admin?.api.dispose();
  await learner?.api.dispose();
});

test.describe.configure({ mode: 'serial' });

test('switch on, plan allowed: the lab runs in the learner\'s browser, checked through it', async ({ page }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(true);
  await setPlanLocalMachines('allowed');

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  const terminal = await launch(page, TITLE_SWITCH_ON);
  expect(terminal, 'a local machine names its session local-…').toMatch(/^local-/);

  await playTheLab(page);
  await page.screenshot({ path: test.info().outputPath('local-completed.png'), fullPage: true });

  await expect
    .poll(async () => (await getMyScenarioSessions(learner)).find((s: any) => s.scenario_id === scenarioIds[4])?.status, { timeout: 30_000 })
    .toBe('completed');
});

test('a reload rebuilds the run at its step on a new machine, and a second tab stands aside', async ({ page, context }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(true);
  await setPlanLocalMachines('allowed');

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  const first = await launch(page, TITLE_RELOAD);
  const stepTitle = page.getByTestId('scenario-step-title');
  await expect(stepTitle).toHaveText('Garder le monde', { timeout: 120_000 });
  await expect(page.locator('.local-machine-notice')).toBeVisible();
  await waitForLiveTerminal(page, 60_000);
  await typeInTerminal(page, 'echo moi > /tmp/moi.txt');

  await page.reload();
  await page.waitForURL((url) => /\/terminal-session\/local-/.test(url.pathname) && !url.pathname.endsWith(first), { timeout: 120_000 });
  await expect(stepTitle).toHaveText('Garder le monde', { timeout: 120_000 });
  await waitForLiveTerminal(page, 120_000);

  // A second tab on the run is told the first one has it. Opening the run's
  // address in a new tab is the learner's own way there: no menu leads to it.
  const second = await context.newPage();
  await login(second, LEARNER_EMAIL, PASSWORD);
  await second.goto(page.url());
  await expect(second.getByText('Ouvert dans un autre onglet')).toBeVisible({ timeout: 60_000 });
  await second.close();

  // The rebuilt machine's console is the run's user, who has no sudo.
  // (Computed markers: the typed line itself must not match.)
  await typeInTerminal(page, 'echo UID-$(id -u); sudo -n true 2>/dev/null && echo SUDO-$((1))-OUI || echo SUDO-$((0))-NON');
  await expect.poll(() => readTerminalText(page), { timeout: 30_000 }).toMatch(/SUDO-[01]-(OUI|NON)/);
  expect(await readTerminalText(page)).toContain('SUDO-0-NON');
  expect(await readTerminalText(page)).toContain('UID-1000');

  // The world was rebuilt, the learner's file is gone.
  await page.getByTestId('scenario-verify-btn').click();
  const result = page.getByTestId('scenario-verify-result');
  await expect(result).toHaveClass(/failed/, { timeout: 60_000 });
  await expect(result.locator('.output-text')).toContainText('/tmp/moi.txt manque');

  await typeInTerminal(page, 'echo moi > /tmp/moi.txt');
  await page.getByTestId('scenario-verify-btn').click();
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: test.info().outputPath('local-reload-completed.png'), fullPage: true });
});

test('a popped-out terminal works on the machine of the run page, whose instructions stay in view', async ({ page }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(true);
  await setPlanLocalMachines('allowed');

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await launch(page, TITLE_POPOUT);
  const stepTitle = page.getByTestId('scenario-step-title');
  await expect(stepTitle).toHaveText('Écrire depuis la fenêtre', { timeout: 120_000 });
  await waitForLiveTerminal(page, 60_000);

  // What the learner did in the page's shell is still there in the window.
  await typeInTerminal(page, 'cd /tmp; MARQUE=abc');
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByTestId('terminal-pop').first().click()]);
  await waitForLiveTerminal(popup, 60_000);
  await typeInTerminal(popup, 'echo $PWD-$MARQUE-$((1+1))');
  await expect.poll(() => readTerminalText(popup), { timeout: 30_000 }).toContain('/tmp-abc-2');
  // The window's shell is on the page's machine: it sees the step's world.
  await typeInTerminal(popup, 'cat /tmp/monde.txt; echo popup > /tmp/popup.txt; echo FAIT-$((1+1))');
  await expect.poll(() => readTerminalText(popup), { timeout: 30_000 }).toContain('FAIT-2');
  expect(await readTerminalText(popup)).toContain('monde-42');

  // The instructions stay in the page, where the check is made.
  await expect(page.getByTestId('terminal-pop-in')).toBeVisible();
  await expect(stepTitle).toHaveText('Écrire depuis la fenêtre');
  await page.getByTestId('scenario-verify-btn').click();
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
  await popup.screenshot({ path: test.info().outputPath('local-popout-window.png') });
  await page.screenshot({ path: test.info().outputPath('local-popout-page.png'), fullPage: true });

  await Promise.all([popup.waitForEvent('close'), page.getByTestId('terminal-pop-in').click()]);
});

test('a reload during the first build builds the run again on the new machine', async ({ page }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(true);
  await setPlanLocalMachines('allowed');

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  const terminal = await launch(page, TITLE_SLOW_BUILD);
  await expect(page.getByTestId('scenario-provisioning-overlay')).toBeVisible({ timeout: 60_000 });
  // Reloaded while the setup runs in the first machine (it sleeps 10 s), not
  // before the machine has started it.
  await page.waitForTimeout(6_000);

  await page.reload();
  // The same run, built from the start on the new machine: no failed setup.
  expect(page.url()).toContain(terminal);
  const stepTitle = page.getByTestId('scenario-step-title');
  await expect(stepTitle).toHaveText('Attendre le monde', { timeout: 180_000 });
  await expect(page.getByTestId('scenario-provisioning-overlay')).toBeHidden({ timeout: 180_000 });
  await page.getByTestId('scenario-verify-btn').click();
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
});

// Plan rule 11: the machine has no network but Debian's packages, through the
// platform's mirror (nginx.conf in production, vite here), opened to it by
// ocf-core while its tab is connected.
test('a learner installs a Debian package through the platform\'s mirror', async ({ page }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(true);
  await setPlanLocalMachines('allowed');

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  await launch(page, TITLE_APT);
  await expect(page.getByTestId('scenario-step-title')).toHaveText('Installer cowsay', { timeout: 120_000 });
  await waitForLiveTerminal(page, 60_000);

  await typeInTerminal(page, 'apt-get update -q && apt-get install -y -q cowsay; echo APT-$((40+2))-$?');
  await expect.poll(() => readTerminalText(page), { timeout: 240_000 }).toMatch(/APT-42-\d+/);
  expect(await readTerminalText(page)).toContain('APT-42-0');

  await page.getByTestId('scenario-verify-btn').click();
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
});

test('switch off: the same lab runs in a container, unchanged', async ({ page }) => {
  test.skip(!admin, 'no platform admin to import the fixture — set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD');
  test.setTimeout(420_000);
  await setLocalMachinesSwitch(false);

  await login(page, LEARNER_EMAIL, PASSWORD);
  await dismissVerificationBanner(page);
  const terminal = await launch(page, TITLE_SWITCH_OFF);
  expect(terminal).not.toMatch(/^local-/);

  await playTheLab(page);
  await page.screenshot({ path: test.info().outputPath('incus-completed.png'), fullPage: true });
});
