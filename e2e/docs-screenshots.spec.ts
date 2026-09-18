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
 * the "Lycée Iris" fixture, so a UI change is followed by
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
  { name: 'scenarios-catalogue', path: '/scenarios', as: 'trainer', fullPage: true },
  { name: 'my-scenarios', path: '/my-scenarios', as: 'trainer' },
  { name: 'my-classes', path: '/my-classes', as: 'trainer' },
  { name: 'class-live', path: (f) => `/classes/${f.classId}/live`, as: 'trainer' },
  { name: 'class-members', path: (f) => `/classes/${f.classId}/members`, as: 'trainer' },
  { name: 'class-scenarios', path: (f) => `/classes/${f.classId}/scenarios`, as: 'trainer' },
  { name: 'class-analytics', path: (f) => `/classes/${f.classId}/analytics`, as: 'trainer' },
  { name: 'class-settings', path: (f) => `/classes/${f.classId}/settings`, as: 'trainer' },
  { name: 'organizations', path: '/organizations', as: 'trainer' },
  { name: 'organization-detail', path: (f) => `/organizations/${f.orgId}`, as: 'trainer', fullPage: true },
  { name: 'organization-import', path: (f) => `/organizations/${f.orgId}/import`, as: 'trainer', fullPage: true },
  { name: 'subscription-dashboard', path: '/subscription-dashboard', as: 'trainer', fullPage: true },
  { name: 'subscription-plans', path: '/subscription-plans', as: 'trainer', fullPage: true },
  { name: 'invoices', path: '/invoices', as: 'trainer' },
  { name: 'settings-ssh-keys', path: '/settings/ssh-keys', as: 'trainer' },
  { name: 'settings-ui', path: '/settings/ui', as: 'trainer' },
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
  const res = await session.api.patch(`${API_BASE}/users/me/settings`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { preferred_language: locale, theme: 'light' },
  });
  if (!res.ok()) throw new Error(`PATCH /users/me/settings failed for ${email}: ${res.status()}`);
  await session.api.dispose();
}

/**
 * The app scrolls inside <body> (html is 100% high), which a full-page capture
 * clips to one viewport. Let the document grow for the shot, then scroll
 * through it once so the sections that reveal on scroll are revealed.
 */
async function prepareFullPage(page: Page): Promise<void> {
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
  await page.getByRole('button', { name: /got it|compris/i }).first().click({ timeout: 2_000 }).catch(() => {});
}

// One filter for both: `SHOT=class-live npm run docs:screenshots` retakes one screen.
const only = process.env.SHOT;
const selected = only ? SCREENS.filter((s) => s.name === only) : SCREENS;

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
