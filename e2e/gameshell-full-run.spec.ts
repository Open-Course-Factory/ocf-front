import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { typeInTerminal, readTerminalText, waitForLiveTerminal } from './helpers/xterm';
import { appendFileSync } from 'fs';

// Playwright buffers stdout until the test ends, so a hang shows nothing at
// all. This trail is written straight to disk on every phase change.
const TRAIL = process.env.GS_TRAIL || '/tmp/gs-trail.log';
function trail(msg: string): void {
  appendFileSync(TRAIL, `${new Date().toISOString().slice(11, 19)} ${msg}\n`);
}

// ---------------------------------------------------------------------------
// The whole GameShell adventure, played through the screen, in a real
// container — and at every step, proof that Verify actually discriminates:
// it is clicked BEFORE the work is done and must fail, then again after and
// must pass. A check that always passes is worse than no check, and this suite
// is what says which of the two we have.
//
// Everything the learner does goes through the UI: the terminal is driven by
// typing into the real xterm, the answer step through the answer box, and the
// advance through the Verify button. Only /login uses page.goto (house rule).
//
// Requirements (local only): ocf-core :8080, vite :4000, tt-backend with a
// live Incus, and the scenario seeded with `is_public: true`. The spec
// SELF-SKIPS when the scenario is not launchable, so CI stays quiet.
//
//   npx playwright test gameshell-full-run --headed
//   GS_FROM=0 GS_TO=6 npx playwright test gameshell-full-run   # a slice
//
// Video is recorded for the whole run — see `test.use` below.
// ---------------------------------------------------------------------------

const LEARNER = process.env.E2E_USER || 'karim@test.ocf';
const PASSWORD = process.env.E2E_PASS || 'OcfTest2026!';
const SCENARIO = /GameShell Basics/i;

const FROM = Number(process.env.GS_FROM ?? 0);
const TO = Number(process.env.GS_TO ?? 999);

const CHEST = '/World/Forest/Hut/Chest';
const CAVE = '/World/Mountain/Cave';
const STALL = '/World/Castle/Courtyard/Stall';
const BOOK = `${CAVE}/Book_of_potions`;

test.use({ video: 'on' });

// How often the polls below look again. Every wait in this file is "until a
// condition holds, capped", never "sleep this long and hope" — the caps are
// the old fixed sleeps, so nothing here can wait longer than before.
const POLL_MS = 120;

// The shell is idle again when its prompt is back at the end of the buffer.
// PS1 is `[GameShell] \$ ` and gains the path above it once the prompt
// treasure is awarded (step4), so only the tail is stable — and `\$` renders
// as `#` because the container runs as root.
const PROMPT_BACK = /\[GameShell\]\s*[#$]\s*$/;

/**
 * Type a command and confirm the shell actually received it.
 *
 * A remote console loses keystrokes: the first character after a focus change
 * goes missing, and after a step advance the whole line can vanish with no
 * error anywhere. A command that never arrived looks exactly like a check that
 * refuses, so this retypes until the terminal shows the line — otherwise the
 * suite reports content bugs that are really lost input.
 */
async function sh(page: Page, cmd: string, settleMs = 900): Promise<void> {
  trail(`  sh: ${cmd.slice(0, 60)}`);
  // The tail is what gets compared: a dropped first character still leaves a
  // recognisable line, and matching the whole command would miss that case.
  const tail = cmd.slice(Math.max(0, cmd.length - 24));

  for (let attempt = 1; attempt <= 3; attempt++) {
    // `tree` and the potion pages print more than a screen, which scrolls the
    // echoed command out of the visible rows this can read. So a changed
    // buffer counts as delivery too — otherwise a command that worked would be
    // retyped, and `mv`/`rm` do not survive being run twice.
    const before = await readTerminalText(page);
    await typeInTerminal(page, cmd);

    // Two things must be true before the check may run: the keystrokes
    // arrived, and the command has FINISHED. A fixed sleep guesses at the
    // second and has to guess high, on every command, for the slowest one.
    // The prompt coming back states it exactly, and usually states it far
    // sooner. The budget is unchanged, so a prompt this cannot recognise
    // degrades to precisely the old behaviour rather than to a flaky one.
    const deadline = Date.now() + settleMs;
    let after = before;
    let arrived = false;
    for (;;) {
      after = await readTerminalText(page);
      arrived = after.includes(tail) || after !== before;
      if (arrived && PROMPT_BACK.test(after.trimEnd())) return;
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(POLL_MS);
    }
    if (arrived) return;
    // eslint-disable-next-line no-console
    console.log(`    keystrokes did not arrive (attempt ${attempt}), retyping: ${cmd.slice(0, 40)}`);
    await page.waitForTimeout(600);
  }
  throw new Error(`the terminal never received: ${cmd}`);
}

/**
 * Read one short value out of the terminal. The command must print it wrapped
 * in @@…@@ — a marker survives the surrounding shell noise, and short values
 * survive the line wrapping that would mangle a long one.
 */
/** Run a command and return what the terminal shows afterwards. */
async function readRaw(page: Page, cmd: string): Promise<string> {
  await sh(page, cmd, 1_500);
  return readTerminalText(page);
}

async function readMarker(page: Page, cmd: string, timeoutMs = 15_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  await sh(page, cmd, 1_500);
  while (Date.now() < deadline) {
    const text = await readTerminalText(page);
    const hits = [...text.matchAll(/@@([^@\s]+)@@/g)];
    if (hits.length) return hits[hits.length - 1][1];
    await page.waitForTimeout(250);
  }
  throw new Error(`no @@marker@@ in terminal after: ${cmd}`);
}

// The scenario routes are rate limited per user, and a 429 comes back rendered
// as a FAILED check — so the limiter looks exactly like the scenario refusing,
// and every retry digs deeper. Every rate-limited press goes through this gate.
//
// ocf-core's PerUserRateLimit is a SLIDING WINDOW: at most RATE_MAX requests in
// any 60 seconds, counted across verify, submit-flag, submit-quiz and
// reprovision-step together. A flat minimum delay between presses pays the
// worst case on every press; the window only bites when it is genuinely full,
// which on a run whose steps do real work is almost never. Modelling it costs
// nothing when there is headroom and waits exactly long enough when there
// isn't — and it keeps pacing correct if the rest of the suite gets faster.
const RATE_WINDOW_MS = 60_000;
// One below the server's 10, so a request we did not account for cannot be the
// one that trips it. A 429 is expensive to recover from; a spare slot is not.
const RATE_MAX = 9;
const RATE_SAFETY_MS = 400;
const checkTimes: number[] = [];

async function paceCheck(page: Page): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (checkTimes.length && now - checkTimes[0] >= RATE_WINDOW_MS) checkTimes.shift();
    if (checkTimes.length < RATE_MAX) break;
    await page.waitForTimeout(RATE_WINDOW_MS - (now - checkTimes[0]) + RATE_SAFETY_MS);
  }
  checkTimes.push(Date.now());
}

/** True when a failed result is the limiter talking, not the scenario. */
function isRateLimited(text: string): boolean {
  return /rate limit|trop de requ/i.test(text);
}

type Outcome = 'passed' | 'failed';

/**
 * Verify, expecting refusal. A refusal stays on screen, so the result element
 * is the right thing to read.
 */
async function expectVerifyFails(page: Page): Promise<void> {
  trail('  verify: expecting refusal');
  const result = page.getByTestId('scenario-verify-result');
  const button = page.getByTestId('scenario-verify-btn');

  for (let attempt = 1; attempt <= 4; attempt++) {
    await paceCheck(page);
    await expect(button).toBeEnabled({ timeout: 120_000 });
    await button.click();
    await expect(result).toBeVisible({ timeout: 60_000 });
    await expect(result).toHaveClass(/failed/, { timeout: 60_000 });

    const said = (await result.innerText().catch(() => '')).trim();
    if (!isRateLimited(said)) return;
    // eslint-disable-next-line no-console
    console.log('    the limiter answered, not the check — waiting for the window');
    await page.waitForTimeout(20_000);
  }
  throw new Error('could not get a real refusal past the rate limiter');
}

/**
 * Verify, expecting acceptance — proven by the step CHANGING, not by reading
 * the result element.
 *
 * On success the panel replaces the step body with its transition almost at
 * once, so the "passed" result is on screen too briefly to assert against
 * reliably: waiting for it times out even though the check ran and the backend
 * answered 200. What acceptance actually means to a learner is that the
 * adventure moved on, and that is what this waits for.
 */
async function expectVerifyPasses(page: Page, currentTitle: string): Promise<void> {
  trail(`  verify: expecting advance from "${currentTitle}"`);
  const title = page.getByTestId('scenario-step-title');
  const button = page.getByTestId('scenario-verify-btn');
  const result = page.getByTestId('scenario-verify-result');

  for (let attempt = 1; attempt <= 5; attempt++) {
    await paceCheck(page);
    const enabled = await button.isEnabled().catch(() => false);
    const seen = (await title.innerText().catch(() => '?')).trim();
    const preparing = await page.getByTestId('scenario-step-preparing').isVisible().catch(() => false);
    const overlay = await page.getByTestId('scenario-provisioning-overlay').isVisible().catch(() => false);
    trail(`    attempt ${attempt}: title="${seen}" enabled=${enabled} preparing=${preparing} overlay=${overlay}`);
    await expect(button).toBeEnabled({ timeout: 30_000 });
    try {
      await button.click({ timeout: 15_000 });
    } catch {
      // Covered by a transition: that IS the panel moving on, so watch for it
      // rather than treating an unclickable button as a failure.
      trail('    button was covered — treating as a transition in flight');
    }

    let deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (await page.getByTestId('scenario-completed').isVisible().catch(() => false)) return;
      const now = (await title.innerText().catch(() => currentTitle)).trim();
      if (now !== currentTitle) return;

      // The check passed and the next step is being built: the title only
      // changes once that finishes, which for a step with a background script
      // is well past any press timeout. Pressing again here would be pressing
      // during a transition — keep waiting instead, and give it room.
      if (await page.getByTestId('scenario-step-preparing').isVisible().catch(() => false)) {
        trail('    next step is provisioning, holding');
        deadline = Date.now() + 300_000;
        await page.waitForTimeout(500);
        continue;
      }

      // A refusal is an answer: report what the check said instead of waiting
      // out the clock on a step that will never advance.
      const cls = (await result.getAttribute('class').catch(() => null)) || '';
      if (cls.includes('failed')) {
        const said = (await result.innerText().catch(() => '')).trim();
        if (isRateLimited(said)) break; // wait out the window, then press again
        throw new Error(`the check refused "${currentTitle}": ${said}`);
      }
      await page.waitForTimeout(250);
    }
    // eslint-disable-next-line no-console
    console.log(`    no advance after press ${attempt} on "${currentTitle}", pressing again`);
  }
  throw new Error(`"${currentTitle}" never advanced after five Verify presses`);
}

/**
 * Press Verify and report which way it went, without asserting.
 *
 * Success is read the way it is everywhere else in this file — by the step
 * ADVANCING — and for the same reason: the panel swaps the step body out the
 * moment a check passes, taking the result element with it. Deciding from that
 * element made a pass indistinguishable from an element that was never there,
 * so a run whose work landed in time waited out a 60s visibility timeout on its
 * own success and then failed. Only the refusal is read from the element,
 * which is the case where it stays on screen.
 *
 * It also goes through paceCheck: this press spends a limiter slot like any
 * other, and one taken without being recorded is one the next press is not
 * expecting to be missing.
 */
async function verifyOutcome(page: Page, timeoutMs = 30_000): Promise<Outcome> {
  const result = page.getByTestId('scenario-verify-result');
  const button = page.getByTestId('scenario-verify-btn');
  const title = page.getByTestId('scenario-step-title');
  const before = (await title.innerText().catch(() => '')).trim();

  await paceCheck(page);
  await expect(button).toBeEnabled({ timeout: 120_000 });
  await button.click();

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.getByTestId('scenario-completed').isVisible().catch(() => false)) return 'passed';
    // A short timeout here, not the default: during the transition the title
    // is gone, and blocking on it would hide the refusal case behind it.
    const now = (await title.innerText({ timeout: 1_000 }).catch(() => '')).trim();
    if (now && now !== before) return 'passed';
    const cls = (await result.getAttribute('class').catch(() => null)) || '';
    if (cls.includes('failed')) return 'failed';
    await page.waitForTimeout(250);
  }
  return 'failed';
}

interface Step {
  title: string | RegExp;
  /** How the learner satisfies it. Omitted for steps that need no work. */
  solve?: (page: Page) => Promise<void>;
  /** Steps whose check cannot fail (it is `exit 0`) skip the negative probe. */
  probe?: false;
  /** An answer-box step rather than a Verify step. */
  answer?: (page: Page) => Promise<string>;
  /** A wrong answer that must be rejected first. */
  wrongAnswer?: string;
  /** A step whose rules need the flow itself, not just a solve. */
  custom?: (page: Page) => Promise<void>;
}

const STEPS: Step[] = [
  { title: 'The Adventure Begins', probe: false },

  {
    title: 'Climb the Tower',
    solve: (p) => sh(p, 'cd /World/Castle/Main_tower/First_floor/Second_floor/Top_of_the_tower'),
  },
  { title: 'Down to the Cellar', solve: (p) => sh(p, 'cd /World/Castle/Cellar') },
  // The check reads the LAST command: it wants the short road home, not `cd ..`.
  { title: 'Return to the World', solve: (p) => sh(p, 'cd ~') },
  {
    title: 'Build a Chest',
    solve: async (p) => {
      await sh(p, 'mkdir /World/Forest/Hut');
      await sh(p, `mkdir ${CHEST}`);
    },
  },
  { title: 'Remove the Spiders', solve: (p) => sh(p, 'rm /World/Castle/Cellar/spider_*') },
  { title: 'Move Coins to the Chest', solve: (p) => sh(p, `mv /World/Garden/coin_* ${CHEST}/`) },
  { title: 'Move Hidden Coins', solve: (p) => sh(p, `mv /World/Garden/.coin_* ${CHEST}/`) },
  { title: 'Clear Spiders with Wildcards', solve: (p) => sh(p, 'rm /World/Castle/Cellar/spider_*') },
  { title: 'Clear Hidden Spiders', solve: (p) => sh(p, 'rm /World/Castle/Cellar/.spider_*') },
  {
    title: 'Copy the Standard',
    solve: (p) =>
      sh(p, 'cp /World/Castle/Courtyard/royal_standard.txt /World/Castle/Great_hall/'),
  },
  {
    title: 'Copy Tapestries with Wildcards',
    solve: (p) => sh(p, 'cp /World/Castle/Kitchen/tapestry_* /World/Castle/Great_hall/'),
  },
  {
    // The names are random and meaningless by design, so the only way through
    // is to sort by time — which is exactly what the mission teaches.
    title: 'Copy Recent Paintings',
    solve: async (p) => {
      await sh(p, 'cd /World/Castle/Main_tower');
      await sh(p, 'cp $(ls -t painting_* | head -2) /World/Castle/Great_hall/', 1_500);
    },
  },
  {
    // The one answer-box step: the astrologer's date is drawn per session, so
    // the weekday has to be worked out from the world, not known in advance.
    title: 'The Calendar',
    wrongAnswer: 'Caturday',
    answer: async (p) => {
      // Two plain commands rather than one nested-quote one-liner. A remote
      // console drops the odd character, and a dropped quote leaves bash
      // waiting at a continuation prompt: the command never runs, nothing is
      // printed, and the step looks broken when only the typing was.
      const listed = await readRaw(p, 'ls /World/Castle/Observatory');
      const date = listed.match(/prophecy_(\d{4}-\d{2}-\d{2})/)?.[1];
      if (!date) throw new Error(`no prophecy date in: ${listed.slice(-200)}`);
      return await readMarker(p, `echo @@$(date -d ${date} +%A)@@`);
    },
  },
  {
    title: 'Write in Your Journal',
    solve: (p) => sh(p, `echo "Day one: I built a chest." > ${CHEST}/journal.txt`),
  },
  {
    // Two things make this one its own flow.
    //
    // The lair's name carries spaces and two random words, so an unquoted glob
    // hands `cd` several arguments and fails. It has to be resolved by `find`
    // and quoted.
    //
    // And the 20s clock starts when the step is PROVISIONED, not when the
    // learner reaches the lair — reading the mission spends most of it. So the
    // first honest attempt is expected to run out of time, which moves the
    // queen to a fresh lair; the second, now that the way is known, is the one
    // that must pass. That is the mission's own design, and the test plays it
    // the way a learner does.
    title: 'Spider Queen',
    custom: async (p) => {
      const enterAndClear = async () => {
        await sh(p, 'cd "$(find /World/Castle/Cellar -maxdepth 1 -type d -name \'.Lair_of_the_spider_queen*\')"', 1_200);
        await sh(p, 'rm -f *spider_queen*', 800);
      };

      // Negative proof first: standing outside the lair, the check must refuse.
      await expectVerifyFails(p);

      await enterAndClear();
      if ((await verifyOutcome(p)) === 'passed') return;

      // Timed out: the queen has moved. Do it again, straight away.
      // eslint-disable-next-line no-console
      console.log('    first attempt ran out the 20s clock — the lair moved, going again');
      await enterAndClear();
      const t = (await p.getByTestId('scenario-step-title').innerText()).trim();
      await expectVerifyPasses(p, t);
    },
  },
  {
    title: 'Find the Copper Coin',
    solve: (p) =>
      sh(p, `find /World/Forest/Maze -name copper_coin -exec mv {} ${CHEST}/ \\;`, 2_000),
  },
  {
    title: 'Find the Silver Coin',
    solve: (p) =>
      sh(p, `find /World/Forest/Grand_maze -name silver_coin -exec mv {} ${CHEST}/ \\;`, 2_000),
  },
  {
    // Four coins with colliding names — moving them one by one under distinct
    // names is what stops `mv` refusing to overwrite what it just created.
    title: 'Find the Gold Coins',
    solve: (p) =>
      sh(
        p,
        `i=0; for f in $(find /World/Castle /World/Garden -iname "*gold_coin*"); do i=$((i+1)); mv "$f" ${CHEST}/gold_coin_$i; done`,
        2_500
      ),
  },

  // --- The Book of Potions: the check reads the learner's last command -----
  {
    title: "Hermit's Tea",
    solve: async (p) => {
      await sh(p, `cd ${CAVE}`);
      await sh(p, 'head -n 6 Book_of_potions/page_02', 1_200);
    },
  },
  { title: 'Supper at the Cave', solve: (p) => sh(p, 'tail -n 6 Book_of_potions/page_01', 1_200) },
  {
    title: 'Philtre of Borrowed Faces',
    solve: (p) => sh(p, 'cat Book_of_potions/page_04a Book_of_potions/page_04b', 1_500),
  },
  {
    title: 'Elixir of Youth',
    solve: (p) => sh(p, 'cat Book_of_potions/page_05 | tail -n 6', 1_200),
  },
  {
    title: 'Glass of Nothing At All',
    solve: (p) => sh(p, 'head -n 60 Book_of_potions/bound_edition | tail -n 6', 1_200),
  },

  {
    title: 'Find the Ruby',
    solve: (p) => sh(p, `mv /World/Castle/Throne_room/behind_curtain/ruby ${CHEST}/`),
  },
  {
    title: 'Find the Diamond',
    solve: (p) => sh(p, `mv /World/Garden/Shed/secret_box/diamond ${CHEST}/`),
  },

  // --- The merchant's stall: also judged on the last command ---------------
  {
    title: "King's Debt",
    solve: async (p) => {
      await sh(p, `cd ${STALL}`);
      await sh(p, 'grep King ledger | grep -v PAID', 1_200);
    },
  },
  { title: 'Taking Stock', solve: (p) => sh(p, 'grep crowns ledger | grep -v PAID | wc -l', 1_200) },

  {
    title: 'Kill the Spell',
    solve: (p) => sh(p, 'kill $(pgrep -f /usr/local/bin/evil_spell | head -1)', 2_000),
  },
  {
    title: 'Kill the Protected Spell',
    solve: async (p) => {
      // Plain kill is trapped — the mission is that it does nothing.
      await sh(p, 'kill $(pgrep -f /usr/local/bin/protected_spell | head -1)', 1_500);
      await sh(p, 'kill -9 $(pgrep -f /usr/local/bin/protected_spell | head -1)', 2_000);
    },
  },
  {
    title: 'Create an Inventory',
    solve: async (p) => {
      await sh(p, `cd ${CHEST}`);
      await sh(p, 'ls > inventory.txt', 1_200);
    },
  },
  {
    title: "King's Quarters",
    solve: async (p) => {
      await sh(p, 'chmod +x /World/Castle/Kings_quarters');
      await sh(p, 'touch /World/Castle/Kings_quarters/marker.txt');
    },
  },
  {
    title: 'Read the Secret Note',
    solve: (p) => sh(p, `echo EXCALIBUR > ${CHEST}/answer.txt`),
  },
  {
    title: 'Steal the Crown',
    solve: (p) => sh(p, `mv /World/Castle/Treasury/royal_crown ${CHEST}/`),
  },
  {
    // The word is drawn per session, so decode it rather than knowing it.
    title: 'Caesar Cipher',
    solve: (p) =>
      sh(
        p,
        `tr 'A-Za-z' 'N-ZA-Mn-za-m' < /World/Castle/Great_hall/scroll.txt | sed -n 's/.*secret word is: *\\([A-Za-z][A-Za-z]*\\).*/\\1/p' > ${CHEST}/answer.txt`,
        1_500
      ),
  },
  { title: 'The Adventure Continues', probe: false },
];

test.describe('GameShell — the whole adventure, in a real container', () => {
  test('every step: Verify refuses before the work, accepts after', async ({ page }) => {
    test.setTimeout(75 * 60 * 1000);

    // Personal context, deliberately: the shared test org's subscription points
    // at a deleted plan, so no effective plan resolves and the launch 403s.
    await loginFresh(page, LEARNER, PASSWORD);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'terminals', '/scenarios');

    const card = page
      .getByTestId('scenario-card')
      .filter({ hasText: SCENARIO })
      .first();
    await expect(card).toBeVisible({ timeout: 20_000 });

    // The card offers Lancer, Relancer or Reprendre depending on what this
    // learner has done before. Any of them puts us in the player.
    // The card renders before its actions do — availability is resolved in a
    // second request — so this has to wait for a way in rather than glance
    // once and conclude there is none.
    let start = null;
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline && start === null) {
      for (const id of ['scenario-launch-btn', 'scenario-relaunch-btn', 'scenario-resume-btn']) {
        const candidate = card.getByTestId(id);
        if (await candidate.isVisible().catch(() => false)) {
          trail(`card offers ${id}`);
          start = candidate;
          break;
        }
      }
      if (start === null) await page.waitForTimeout(2_000);
    }
    if (!start) trail('card offered no way in — skipping');
    test.skip(
      start === null,
      'GameShell is not launchable here (no tt-backend/Incus, or a run is already open)'
    );

    trail('clicking launch');
    await start.click();

    // The launcher holds the provisioning overlay and only navigates once the
    // environment is ready. This scenario's step 0 installs packages over the
    // network, so that is minutes, not seconds — nothing is wrong until this
    // runs out.
    await expect(page).toHaveURL(/\/terminal-session\//, { timeout: 900_000 });
    await expect(page.getByTestId('scenario-step-title')).toBeVisible({ timeout: 300_000 });
    trail('waiting for the shell to execute something');
    await waitForLiveTerminal(page, 300_000);
    trail('shell is executing');

    for (const [index, step] of STEPS.entries()) {
      if (index < FROM || index > TO) continue;

      const title = page.getByTestId('scenario-step-title');
      await expect(title, `step ${index} should be "${step.title}"`).toContainText(step.title, {
        timeout: 180_000,
      });
      trail(`STEP ${index}: ${(await title.innerText()).trim()}`);

      if (step.answer) {
        const titleNow = (await title.innerText()).trim();
        const input = page.getByTestId('scenario-flag-input');
        const submit = page.getByTestId('scenario-flag-submit');
        const outcome = page.getByTestId('scenario-flag-result');

        if (step.wrongAnswer) {
          await input.fill(step.wrongAnswer);
          // submit-flag is behind the SAME per-user limiter as verify, so it
          // has to go through the same gate — pressing it freely was spending
          // slots the next Verify then had to wait for.
          await paceCheck(page);
          await submit.click();
          await expect(outcome, 'a wrong answer must be refused').toHaveClass(/incorrect/, {
            timeout: 60_000,
          });
        }

        const value = await step.answer(page);
        trail(`    answer worked out from the world: ${value}`);
        await input.fill(value);
        await paceCheck(page);
        await submit.click();

        // Acceptance is proven by the adventure moving on. The result element
        // is swapped out with the rest of the step body the moment the answer
        // lands, so reading it here fails on a correct answer — the same trap
        // as the verify result.
        await expect
          .poll(
            async () => {
              if (await page.getByTestId('scenario-completed').isVisible().catch(() => false)) {
                return 'completed';
              }
              return (await title.innerText().catch(() => titleNow)).trim();
            },
            { timeout: 300_000, intervals: [250] }
          )
          .not.toBe(titleNow);
        continue;
      }

      const titleNow = (await title.innerText()).trim();

      if (step.custom) {
        await step.custom(page);
        continue;
      }

      // The negative half: the work is not done, so the check must say so.
      if (step.probe !== false) {
        await expectVerifyFails(page);
      }

      if (step.solve) await step.solve(page);

      await expectVerifyPasses(page, titleNow);
    }

    await expect(page.getByTestId('scenario-completed')).toBeVisible({ timeout: 180_000 });
  });
});
