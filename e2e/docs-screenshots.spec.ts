import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForLiveTerminal, typeInTerminal } from './helpers/xterm';
import { apiLogin } from './helpers/paymentApi';
import { DOCS_PASSWORD, LEARNERS, TRAINER, ensureDocsFixture, type DocsFixture } from './helpers/docsFixture';

/**
 * Documentation screenshots.
 *
 * Not a test of the product — a camera pointed at it. One run writes every
 * screenshot the help pages and the pitch deck embed, in both locales, from
 * the "Université Labinux" fixture, so a UI change is followed by
 * `npm run docs:screenshots` and a commit rather than by an afternoon of
 * manual captures.
 *
 * Output: public/help/screenshots/<locale>/<name>.png, served as-is by the SPA
 * and referenced from the help pages as `/help/screenshots/{locale}/{name}.png`.
 *
 * Lives in the `docs` Playwright project, which the default `chromium` project
 * ignores: the E2E suite stays green without a fixture-bearing database.
 */

const OUT_DIR = 'public/help/screenshots';
const LOCALES = ['fr', 'en'] as const;
type Locale = (typeof LOCALES)[number];

type Persona = 'public' | 'trainer' | 'learner' | 'admin';

interface Screen {
  name: string;
  /** undefined = the fixture could not provide what this screen needs; it is skipped. */
  path: string | ((f: DocsFixture) => string | undefined);
  as: Persona;
  /** Pause before the shot, for pages whose data lands after networkidle. */
  settle?: number;
  fullPage?: boolean;
  /** Anything to do on the page before the shot (open a modal, pick a tab…). */
  prepare?: (page: Page) => Promise<void>;
}

const API_BASE = process.env.OCF_API_URL || 'http://localhost:8080/api/v1';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '1.supervisor@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'test';

const CREDENTIALS: Record<Exclude<Persona, 'public'>, { email: string; password: string }> = {
  trainer: { email: TRAINER.email, password: DOCS_PASSWORD },
  learner: { email: LEARNERS[0].email, password: DOCS_PASSWORD },
  admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
};

const SCREENS: Screen[] = [
  // Public
  { name: 'landing', path: '/', as: 'public', fullPage: true },
  { name: 'pricing', path: '/pricing', as: 'public', fullPage: true },
  { name: 'login', path: '/login', as: 'public' },
  { name: 'register', path: '/register', as: 'public' },

  // Trainer — day-to-day
  { name: 'terminal-sessions', path: '/terminal-sessions', as: 'trainer' },
  { name: 'terminal-creation', path: '/terminal-creation', as: 'trainer', fullPage: true },
  {
    name: 'terminal-advanced-options',
    path: '/terminal-creation',
    as: 'trainer',
    fullPage: true,
    prepare: async (page) => {
      await page.locator('.collapsible-header', { hasText: /options avanc|advanced options/i }).click();
      await expandUsagePanel(page);
    },
  },
  {
    // The session was started with the network feature, so the chip is unlocked;
    // exposing a port here is exactly what a learner does to show a web app.
    name: 'terminal-exposed-port',
    path: (f) => f.trainerTerminalId && `/terminal-session/${f.trainerTerminalId}`,
    as: 'trainer',
    prepare: async (page) => {
      await acknowledgeRecordingNotice(page);
      await waitForLiveTerminal(page, 30_000)
        .then(() => typeInTerminal(page, 'clear && perl -MIO::Socket::INET -e \'$s=IO::Socket::INET->new(LocalPort=>8080,Listen=>5,Reuse=>1);while($c=$s->accept){print $c "HTTP/1.0 200 OK\\r\\nContent-Type: text/html\\r\\n\\r\\n<h1>Hello from my session</h1>";close $c}\' &'))
        .then(() => typeInTerminal(page, 'clear'))
        .catch(() => {});
      await page.getByTestId('exposed-ports-chip').click();
      const input = page.locator('#exposed-port-input');
      if (await input.isVisible().catch(() => false)) {
        const entries = page.locator('.exposed-port-entry');
        if ((await entries.count()) === 0) {
          await input.fill('8080');
          await page.locator('.ports-form button[type="submit"]').click();
          await entries.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
          // The success toast sits over the header; let it go before the shot.
          await page.locator('.el-notification').waitFor({ state: 'hidden', timeout: 8_000 }).catch(() => {});
        }
      }
      await acknowledgeRecordingNotice(page);
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'terminal-session',
    path: (f) => f.trainerTerminalId && `/terminal-session/${f.trainerTerminalId}`,
    as: 'trainer',
    prepare: async (page) => {
      await acknowledgeRecordingNotice(page);
      await waitForLiveTerminal(page, 30_000)
        .then(() => typeInTerminal(page, 'clear && cat /etc/os-release | head -3 && nproc && free -h'))
        .catch(() => {});
      await page.waitForTimeout(800);
    },
  },
  {
    name: 'scenario-editor',
    path: '/scenario-editor',
    as: 'trainer',
    prepare: async (page) => {
      const select = page.locator('.scenario-select');
      await select.waitFor({ state: 'visible', timeout: 10_000 });
      // The fixture's GameShell — the class assignment is what lets her manage it.
      const value = await select.locator('option', { hasText: /gameshell/i }).first().getAttribute('value');
      if (value) await select.selectOption(value);
      await page.waitForTimeout(2_500);
    },
  },
  { name: 'scenarios-catalogue', path: '/scenarios', as: 'trainer', fullPage: true },
  { name: 'my-scenarios', path: '/my-scenarios', as: 'trainer' },
  { name: 'my-classes', path: '/my-classes', as: 'trainer' },
  { name: 'class-live', path: (f) => `/classes/${f.classId}/live`, as: 'trainer' },
  { name: 'class-wall', path: (f) => `/classes/${f.classId}/live?view=wall`, as: 'trainer', settle: 4_000, fullPage: true },
  { name: 'class-members', path: (f) => `/classes/${f.classId}/members`, as: 'trainer' },
  { name: 'class-scenarios', path: (f) => `/classes/${f.classId}/scenarios`, as: 'trainer' },
  { name: 'class-analytics', path: (f) => `/classes/${f.classId}/analytics`, as: 'trainer' },
  { name: 'class-settings', path: (f) => `/classes/${f.classId}/settings`, as: 'trainer' },
  { name: 'organizations', path: '/organizations', as: 'trainer' },
  { name: 'organization-detail', path: (f) => `/organizations/${f.orgId}`, as: 'trainer', fullPage: true },
  { name: 'organization-members', path: (f) => `/organizations/${f.orgId}?tab=members`, as: 'trainer', fullPage: true },
  {
    // The manager-only tabs are not URL-addressable before the membership has loaded; click it like a user.
    name: 'organization-scenarios',
    path: (f) => `/organizations/${f.orgId}`,
    as: 'trainer',
    prepare: async (page) => {
      await page.locator('.tabs-header .tab', { hasText: /sc[ée]narios/i }).click();
      await page.waitForTimeout(1_500);
    },
  },
  { name: 'organization-subscription', path: (f) => `/organizations/${f.orgId}?tab=subscription`, as: 'trainer', fullPage: true },
  { name: 'organization-import', path: (f) => `/organizations/${f.orgId}/import`, as: 'trainer', fullPage: true },
  { name: 'subscription-dashboard', path: '/subscription-dashboard', as: 'trainer', fullPage: true },
  {
    name: 'subscription-usage-panel',
    path: '/subscription-dashboard',
    as: 'trainer',
    fullPage: true,
    prepare: (page) => expandUsagePanel(page),
  },
  { name: 'subscription-plans', path: '/subscription-plans', as: 'trainer', fullPage: true },
  { name: 'invoices', path: '/invoices', as: 'trainer' },
  { name: 'settings-ssh-keys', path: '/settings/ssh-keys', as: 'trainer' },
  { name: 'settings-ui', path: '/settings/ui', as: 'trainer' },
  { name: 'settings-security', path: '/settings/security', as: 'trainer', fullPage: true },
  { name: 'settings-notifications', path: '/settings/notifications', as: 'trainer' },
  { name: 'settings-localization', path: '/settings/localization', as: 'trainer' },
  { name: 'help', path: '/help', as: 'trainer', fullPage: true },

  // Learner
  { name: 'learner-scenarios', path: '/scenarios', as: 'learner', fullPage: true },
  { name: 'learner-my-scenarios', path: '/my-scenarios', as: 'learner' },
  { name: 'learner-terminal-sessions', path: '/terminal-sessions', as: 'learner' },
  { name: 'learner-terminal-creation', path: '/terminal-creation', as: 'learner', fullPage: true },
  {
    name: 'learner-scenario-player',
    path: (f) => f.learnerTerminalId && `/terminal-session/${f.learnerTerminalId}`,
    as: 'learner',
    // GameShell opens on a briefing step, so the terminal may not be live yet:
    // a shot of the briefing is still the player. Type only if the shell answers.
    prepare: async (page) => {
      await acknowledgeRecordingNotice(page);
      // `clear` first: the liveness probe leaves its marker on screen.
      await waitForLiveTerminal(page, 20_000)
        .then(() => typeInTerminal(page, 'clear && ls -la'))
        .catch(() => {});
      await page.waitForTimeout(800);
    },
  },

  // Platform administration
  { name: 'admin-dashboard', path: '/admin', as: 'admin', fullPage: true },
  { name: 'admin-users', path: '/admin/users', as: 'admin' },
  { name: 'admin-organizations', path: '/admin/organizations', as: 'admin' },
  { name: 'admin-scenarios', path: '/admin/scenarios', as: 'admin' },
  { name: 'admin-scenario-health', path: '/admin/scenario-health', as: 'admin' },
  { name: 'admin-plan-health', path: '/admin/plan-health', as: 'admin' },
  { name: 'admin-subscription-plans', path: '/admin/subscription-plans', as: 'admin' },
  { name: 'admin-distribution-catalog', path: '/admin/distribution-catalog', as: 'admin', fullPage: true },
  { name: 'admin-terminal-metrics', path: '/admin/terminal-metrics', as: 'admin' },
  { name: 'admin-platform-settings', path: '/admin/platform-settings', as: 'admin', fullPage: true },
];

/**
 * Language and theme are account settings: Layout.vue applies whatever
 * /users/me/settings says after login, over anything localStorage holds. So
 * the persona is put in the right locale the way a user would — in Settings.
 */
async function setPreferences(email: string, password: string, locale: Locale): Promise<void> {
  const session = await apiLogin(email, password);
  // An imported account has no settings row until something reads them; GET creates the defaults.
  await session.api.get(`${API_BASE}/users/me/settings`, { headers: { Authorization: `Bearer ${session.token}` } });
  const res = await session.api.patch(`${API_BASE}/users/me/settings`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { preferred_language: locale, theme: 'light' },
  });
  if (!res.ok()) throw new Error(`PATCH /users/me/settings failed for ${email}: ${res.status()}`);
  await session.api.dispose();
}

/** "My usage" is collapsed on some pages and open on others; end up open either way. */
async function expandUsagePanel(page: Page): Promise<void> {
  const limits = page.locator('[data-testid="usage-limits"]');
  if (!(await limits.isVisible().catch(() => false))) {
    await page.locator('[data-testid="terminal-usage-panel"] .collapsible-header').click();
  }
  await limits.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

/**
 * Nothing here scrolls the document: the public pages scroll inside <body>,
 * the app shell inside its content pane. A full-page capture would clip both
 * to one viewport. Let every scroll container grow for the shot, then scroll
 * through the page once so the sections that reveal on scroll are revealed.
 */
async function prepareFullPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    const grow = (el: HTMLElement) => {
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('max-height', 'none', 'important');
    };
    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.scrollTop > 0) el.scrollTop = 0;
      const { overflowY } = getComputedStyle(el);
      const isPane = el.clientHeight >= window.innerHeight / 2; // a content pane, not a card with its own scrollbar
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight && isPane) {
        // The pane and every ancestor that pins it to the viewport height.
        for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) grow(node);
      }
    });
  });
  await page.addStyleTag({ content: 'html, body { height: auto !important; overflow: visible !important; }' });
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    // The landing page reveals cards through an IntersectionObserver that the
    // sweep does not always reach in time; a shot is not the place to wait for it.
    document.querySelectorAll('.scroll-reveal').forEach((el) => el.classList.add('revealed'));
  });
  await page.waitForTimeout(800);
}

/** The recording notice is acknowledged once per account; a documentation shot shows the terminal, not the notice. */
async function acknowledgeRecordingNotice(page: Page): Promise<void> {
  await page.locator('.recording-notice-dismiss').first().click({ timeout: 3_000 }).catch(() => {});
}

// `SHOT=class-live,class-wall npm run docs:screenshots` retakes only those screens.
const only = process.env.SHOT?.split(',').filter(Boolean);
const selected = only?.length ? SCREENS.filter((s) => only.includes(s.name)) : SCREENS;

const byPersona = new Map<Persona, Screen[]>();
for (const screen of selected) {
  byPersona.set(screen.as, [...(byPersona.get(screen.as) || []), screen]);
}

test.describe.configure({ mode: 'serial' });

let fixture: DocsFixture;

test.beforeAll(async () => {
  fixture = await ensureDocsFixture();
});

for (const locale of LOCALES) {
  for (const [persona, screens] of byPersona) {
    test(`${locale} — ${persona} (${screens.length} screens)`, async ({ browser }) => {
      test.setTimeout(60_000 + screens.length * 30_000);

      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale });
      // Both preferences are read from localStorage at boot; seeding them here
      // is what a user does once in Settings, without the round trip.
      await context.addInitScript((loc: Locale) => {
        localStorage.setItem('ocf-user-locale', loc);
        localStorage.setItem('theme', 'light');
      }, locale);
      const page = await context.newPage();

      if (persona !== 'public') {
        const { email, password } = CREDENTIALS[persona];
        await setPreferences(email, password, locale);
        await login(page, email, password);
      }

      const failures: string[] = [];
      for (const screen of screens) {
        const path = typeof screen.path === 'function' ? screen.path(fixture) : screen.path;
        if (!path) {
          console.warn(`skipping ${screen.name}: fixture has nothing to show for it`);
          continue;
        }
        try {
          await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
          await page.waitForTimeout(screen.settle ?? 1_000);
          await screen.prepare?.(page);
          if (screen.fullPage) await prepareFullPage(page);
          await page.screenshot({
            path: `${OUT_DIR}/${locale}/${screen.name}.png`,
            fullPage: screen.fullPage ?? false,
            animations: 'disabled',
          });
        } catch (e) {
          failures.push(`${screen.name} (${path}): ${(e as Error).message.split('\n')[0]}`);
        }
      }
      await context.close();

      expect(failures, `screens that could not be captured:\n${failures.join('\n')}`).toEqual([]);
    });
  }
}
