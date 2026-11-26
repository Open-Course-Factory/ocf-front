import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { typeInTerminal, readTerminalText, waitForLiveTerminal } from './helpers/xterm';

/**
 * "Git - Les fondamentaux", played to the end in French by a learner, from the
 * real Labinux pages: every step's Verify refuses before the work and accepts
 * after. Played in a container and on a machine in the learner's browser from
 * the same source (local machines, step 4 acceptance): GF_SCENARIO names the
 * catalogue card, so the same spec plays either copy.
 *
 * The commands are the step's answer, typed as a learner would, as root in
 * /root (the scenario names no session user).
 */

const LEARNER = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const SCENARIO = process.env.GF_SCENARIO || 'Git - Les fondamentaux';

// The per-user check limiter allows 10 a minute: one press every 7 s stays
// under it whatever the steps cost.
const PRESS_GAP_MS = 7_000;
let lastPress = 0;
async function pressVerify(page: Page): Promise<void> {
  const wait = lastPress + PRESS_GAP_MS - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  const button = page.getByTestId('scenario-verify-btn');
  await expect(button).toBeEnabled({ timeout: 120_000 });
  await button.click();
  lastPress = Date.now();
}

// The limiter's refusal says nothing of the step: the press is made again once
// its window has passed.
const RATE_LIMITED = /rate limit|trop de requ/i;

async function expectRefused(page: Page): Promise<void> {
  const result = page.getByTestId('scenario-verify-result');
  for (let attempt = 1; attempt <= 4; attempt++) {
    await pressVerify(page);
    await expect(result).toHaveClass(/failed/, { timeout: 60_000 });
    if (!RATE_LIMITED.test(await result.innerText())) return;
    await page.waitForTimeout(20_000);
  }
  throw new Error('could not get a real refusal past the rate limiter');
}

// Accepted means the step moves on (or the run completes): the result element
// is replaced too fast to read.
async function expectAccepted(page: Page, title: string): Promise<void> {
  const result = page.getByTestId('scenario-verify-result');
  for (let attempt = 1; attempt <= 4; attempt++) {
    await pressVerify(page);
    let limited = false;
    await expect(async () => {
      if (await page.getByTestId('scenario-completed').isVisible()) return;
      if (await result.isVisible() && (await result.getAttribute('class'))?.includes('failed')) {
        const said = await result.innerText();
        if (RATE_LIMITED.test(said)) { limited = true; return; }
        throw new Error(`the check refused "${title}": ${said}`);
      }
      expect((await page.getByTestId('scenario-step-title').innerText()).trim()).not.toBe(title);
    }).toPass({ timeout: 180_000 });
    if (!limited) return;
    await page.waitForTimeout(20_000);
  }
  throw new Error(`"${title}" was never checked past the rate limiter`);
}

// Types the step's answer and waits until the shell has run all of it.
async function run(page: Page, commands: string): Promise<void> {
  const marker = Math.floor(Math.random() * 1e6);
  await typeInTerminal(page, `${commands}; echo FAIT-$((${marker}+1))`);
  await expect.poll(() => readTerminalText(page), { timeout: 60_000 }).toContain(`FAIT-${marker + 1}`);
}

const STEPS: { title: string; answer: string }[] = [
  {
    title: 'Configurer Git',
    answer: 'git config --global user.name "Alex Martin" && git config --global user.email alex.martin@example.org'
      + ' && git config --global init.defaultBranch main && git config --global alias.lg "log --oneline --graph --all"',
  },
  {
    title: 'Créer son premier dépôt',
    answer: 'cd /root/projet-web && git init -q && git add index.html style.css && git commit -qm "premier commit"',
  },
  {
    title: 'Ignorer des fichiers',
    answer: "cd /root/projet-web && printf '*.log\\nnode_modules/\\n' > .gitignore && git add .gitignore && git commit -qm \"ignore les logs et les dépendances\"",
  },
  {
    title: 'Des commits atomiques',
    answer: "cd /root/projet-web && sed -i 's|<h1>.*</h1>|<h1>Mon portfolio</h1>|' index.html && git add index.html && git commit -qm \"titre du portfolio\""
      + " && sed -i 's/background: white/background: #f5f5f5/' style.css && git add style.css && git commit -qm \"fond gris clair\"",
  },
  {
    title: 'Corriger le dernier commit',
    answer: 'cd /root/projet-web && git commit --amend -qm "ajout du pied de page"',
  },
  {
    title: 'Annuler des modifications',
    answer: 'cd /root/projet-web && git restore style.css && git revert --no-edit HEAD',
  },
  {
    title: "Enquêter dans l'historique",
    answer: "cd /root/projet-web && printf '%s\\n%s\\n' \"$(git log -1 --format=%h -G'background: *white' -- style.css)\" \"$(git rev-list --count HEAD)\" > /root/reponse.txt",
  },
  {
    title: 'Mettre de côté avec le stash',
    answer: 'cd /root/projet-web && git stash push -m "wip menu" && echo "h1 { color: #c0392b; }" >> style.css'
      + ' && git add style.css && git commit -qm "titre en rouge" && git stash pop',
  },
  {
    title: 'Marquer une version',
    answer: 'cd /root/projet-web && git add index.html && git commit -qm "menu de navigation" && git tag -a v1.0.0 -m "version 1.0.0"',
  },
];

test('git-fondamentaux, every step: Verify refuses before the work, accepts after', async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);
  await loginFresh(page, LEARNER, PASSWORD);
  await dismissVerificationBanner(page);
  await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

  const card = page.getByTestId('scenario-card').filter({ hasText: SCENARIO }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  const picker = card.getByTestId('scenario-language-select');
  if (await picker.count()) await picker.selectOption('fr');
  // Lancer, or Relancer when this learner has played it before.
  await card.getByTestId('scenario-launch-btn').or(card.getByTestId('scenario-relaunch-btn')).click();

  await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 900_000 });
  await waitForLiveTerminal(page, 300_000);

  const title = page.getByTestId('scenario-step-title');
  for (const step of STEPS) {
    await expect(title).toContainText(step.title, { timeout: 300_000 });
    await expectRefused(page);
    await run(page, step.answer);
    await expectAccepted(page, step.title);
  }
  await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: test.info().outputPath('git-fondamentaux-completed.png'), fullPage: true });
});
