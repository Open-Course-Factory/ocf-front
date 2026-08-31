import { test, expect, type Page } from '@playwright/test';
import { loginFresh } from './helpers/auth';
import { dismissVerificationBanner, navigateViaMenuCategory } from './helpers/ui';
import { typeInTerminal, readTerminalText, waitForLiveTerminal } from './helpers/xterm';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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
// The card's title comes from the scenario itself, which is translated
// separately from its steps — so a run can be told what to look for rather than
// this having to guess.
const SCENARIO = process.env.GS_SCENARIO
  ? new RegExp(process.env.GS_SCENARIO, 'i')
  : /GameShell Basics/i;

const FROM = Number(process.env.GS_FROM ?? 0);
const TO = Number(process.env.GS_TO ?? 999);

// The world's names come from the scenario's own lexicon rather than copies
// kept here. challenges/tools/lexicon.py already composes every path, so asking
// it is what stops this file becoming a third place where the castle is named,
// after the scripts and the prose — and it is what lets the same run play the
// French world by changing nothing but GS_LOCALE.
const LOCALE = process.env.GS_LOCALE || 'en';
// This suite runs as an ES module, so there is no __dirname to resolve against.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHALLENGES = process.env.GS_CHALLENGES || path.resolve(HERE, '..', '..', 'challenges');

function loadLexicon(locale: string): Record<string, string> | null {
  const tool = path.join(CHALLENGES, 'tools', 'lexicon.py');
  if (!existsSync(tool)) return null;
  try {
    const out = execFileSync(
      'python3',
      [tool, '--scenario', path.join(CHALLENGES, 'gameshell-basics'), 'values', '--locale', locale],
      { encoding: 'utf8' }
    );
    return JSON.parse(out) as Record<string, string>;
  } catch {
    return null;
  }
}

const LEXICON = loadLexicon(LOCALE);

/**
 * What each step is called, in the language being played.
 *
 * Read from the scenario's own index.json rather than kept here, for the same
 * reason the paths are: a title written twice is a title that can disagree with
 * itself, and the copy in a test is the one nobody updates. Falls back to the
 * default title for any step a language has not named yet, which is what the
 * product does too.
 */
function loadTitles(locale: string): string[] {
  const index = path.join(CHALLENGES, 'gameshell-basics', 'index.json');
  if (!existsSync(index)) return [];
  try {
    const parsed = JSON.parse(readFileSync(index, 'utf8'));
    return (parsed?.details?.steps ?? []).map(
      (step: any) => step?.titles?.[locale] || step?.title || ''
    );
  } catch {
    return [];
  }
}

const TITLES = loadTitles(LOCALE);

/** The language the scenario is written in; anything else has to be chosen. */
function loadDefaultLocale(): string {
  const index = path.join(CHALLENGES, 'gameshell-basics', 'index.json');
  if (!existsSync(index)) return 'en';
  try {
    const lexicon = path.join(CHALLENGES, 'gameshell-basics', 'world', 'lexicon.json');
    return JSON.parse(readFileSync(lexicon, 'utf8'))?.default_locale || 'en';
  } catch {
    return 'en';
  }
}

const DEFAULT_LOCALE = loadDefaultLocale();

/**
 * The sentences a check would print if it had not been translated.
 *
 * Every step passing proves the world was translated; it does not prove the
 * refusals were, because a refusal is what a learner reads on the way to
 * passing and no assertion ever looks at it. That is exactly how the scripts
 * came to answer a French world in English for as long as they did. So: any
 * default-locale wording that this locale words differently must not appear in
 * a refusal, and each one that does names the message that was missed.
 */
function foreignMessages(): string[] {
  if (LOCALE === DEFAULT_LOCALE) return [];
  const here = loadLexicon(LOCALE);
  const source = loadLexicon(DEFAULT_LOCALE);
  if (!here || !source) return [];
  return Object.keys(source)
    .filter((name) => name.startsWith('M_') && source[name] !== here[name])
    // A format string is not what reaches the screen — printf has already
    // filled the placeholders in by then, so match on the part around them.
    .flatMap((name) => source[name].split('%s'))
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 12);
}

const FOREIGN_MESSAGES = foreignMessages();

/**
 * Sentences the default locale's briefing opens with, where this locale words
 * it differently.
 *
 * Read from the scenario's own intro files rather than hardcoded, so the check
 * follows the content instead of going stale beside it.
 */
function foreignIntro(): string[] {
  if (LOCALE === DEFAULT_LOCALE) return [];
  const read = (locale: string): string => {
    const name = locale === DEFAULT_LOCALE ? 'intro.md' : `intro.${locale}.md`;
    const file = path.join(CHALLENGES, 'gameshell-basics', name);
    return existsSync(file) ? readFileSync(file, 'utf8') : '';
  };
  const source = read(DEFAULT_LOCALE);
  const here = read(LOCALE);
  if (!source || !here) return [];
  return source
    .split(/\n+/)
    .map((line) => line.replace(/[#*_`>-]/g, '').trim())
    .filter((line) => line.length > 25 && !here.includes(line));
}

const FOREIGN_INTRO = foreignIntro();

/**
 * The briefing must open in the language being played.
 *
 * Every other assertion here reads a step, and the steps were resolved for the
 * session's locale from the start. The briefing was read straight off the
 * scenario, so a run could pass all 36 steps in French having opened with an
 * English welcome — and nothing looked at it.
 */
async function expectBriefingInTheChosenLanguage(page: Page): Promise<void> {
  if (!FOREIGN_INTRO.length) return;

  const briefing = page.getByTestId('scenario-briefing');
  if (!(await briefing.isVisible().catch(() => false))) {
    trail('no briefing on screen — nothing to check');
    return;
  }

  const said = (await briefing.innerText().catch(() => '')).trim();
  if (!said) return;

  const foreign = FOREIGN_INTRO.find((fragment) => said.includes(fragment));
  if (foreign) {
    throw new Error(
      `the briefing opened in ${DEFAULT_LOCALE} while playing ${LOCALE}: "${foreign}"`
    );
  }
  trail('briefing reads in the chosen language');
}

/**
 * What this locale calls a place.
 *
 * A missing key returns a marker rather than throwing, because this runs while
 * the module loads: throwing here would stop Playwright collecting the file at
 * all, and a run that cannot even list its tests says far less than one that
 * skips with a reason.
 */
function w(key: string): string {
  return LEXICON?.[key] ?? `<missing ${key}>`;
}

/** The days of the week in the language being played, as `date +%u` numbers them. */
const WEEKDAYS = [
  'T_DAY_MONDAY', 'T_DAY_TUESDAY', 'T_DAY_WEDNESDAY', 'T_DAY_THURSDAY',
  'T_DAY_FRIDAY', 'T_DAY_SATURDAY', 'T_DAY_SUNDAY',
].map(w);

const CHEST = w('P_CHEST');
const CAVE = w('P_CAVE');
const STALL = w('P_STALL');
const BOOK = w('P_BOOK_OF_POTIONS');

test.use({ video: 'on' });

// How often the polls below look again. Every wait in this file is "until a
// condition holds, capped", never "sleep this long and hope" — the caps are
// the old fixed sleeps, so nothing here can wait longer than before.
const POLL_MS = 120;

// Reading an element that is ABOUT TO DETACH costs the full action timeout.
// Playwright auto-waits inside innerText/getAttribute, so when the panel swaps
// the step body out mid-call the read does not fail — it retries for
// actionTimeout (15s) and only then throws, and a `.catch()` around it turns
// that into a silent 15-second pause that looks like the product being slow.
// Every step paid it once: measured click-to-advance was 15.0s, exactly the
// timeout, on every step regardless of what the step did.
//
// So every read inside a poll loop gets its own short budget. Failing fast is
// the point: the loop simply looks again 250ms later, and a detached element
// is expected here rather than exceptional.
const READ_MS = 1_000;

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
// One below the server's ceiling, so a request we did not account for cannot be
// the one that trips it. A 429 is expensive to recover from; a spare slot is not.
//
// ocf-core lets a NON-PRODUCTION deployment raise its ceiling with
// SCENARIO_RATE_LIMIT_PER_MINUTE, and there is no way for us to read what it
// chose — so GS_RATE_MAX tells this side the same number. Set them together or
// raising the server's limit changes nothing: the suite would go on throttling
// itself to the default and the window would never fill.
const SERVER_RATE_MAX = Number(process.env.GS_RATE_MAX ?? 10);
const RATE_MAX = Math.max(1, SERVER_RATE_MAX - 1);
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
    if (!isRateLimited(said)) {
      const untranslated = FOREIGN_MESSAGES.find((fragment) => said.includes(fragment));
      if (untranslated) {
        throw new Error(
          `the check refused in ${DEFAULT_LOCALE} while playing ${LOCALE}: "${untranslated}"`
        );
      }
      return;
    }
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
      const now = (await title.innerText({ timeout: READ_MS }).catch(() => currentTitle)).trim();
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
      const cls = (await result.getAttribute('class', { timeout: READ_MS }).catch(() => null)) || '';
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
    const now = (await title.innerText({ timeout: READ_MS }).catch(() => '')).trim();
    if (now && now !== before) return 'passed';
    const cls = (await result.getAttribute('class', { timeout: READ_MS }).catch(() => null)) || '';
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
    solve: (p) => sh(p, `cd ${w('P_TOP_OF_THE_TOWER')}`),
  },
  { title: 'Down to the Cellar', solve: (p) => sh(p, `cd ${w('P_CELLAR')}`) },
  // The check reads the LAST command: it wants the short road home, not `cd ..`.
  { title: 'Return to the World', solve: (p) => sh(p, 'cd ~') },
  {
    title: 'Build a Chest',
    solve: async (p) => {
      await sh(p, `mkdir ${w('P_HUT')}`);
      await sh(p, `mkdir ${CHEST}`);
    },
  },
  { title: 'Remove the Spiders', solve: (p) => sh(p, `rm ${w('P_SPIDER')}*`) },
  { title: 'Move Coins to the Chest', solve: (p) => sh(p, `mv ${w('P_COIN')}* ${CHEST}/`) },
  { title: 'Move Hidden Coins', solve: (p) => sh(p, `mv ${w('P_GARDEN')}/.${w('W_COIN')}* ${CHEST}/`) },
  { title: 'Clear Spiders with Wildcards', solve: (p) => sh(p, `rm ${w('P_SPIDER')}*`) },
  { title: 'Clear Hidden Spiders', solve: (p) => sh(p, `rm ${w('P_CELLAR')}/.${w('W_SPIDER')}*`) },
  {
    title: 'Copy the Standard',
    solve: (p) =>
      sh(p, `cp ${w('P_COURTYARD_ROYAL_STANDARD_TXT')} ${w('P_GREAT_HALL')}/`),
  },
  {
    title: 'Copy Tapestries with Wildcards',
    solve: (p) => sh(p, `cp ${w('P_KITCHEN_TAPESTRY')}* ${w('P_GREAT_HALL')}/`),
  },
  {
    // The names are random and meaningless by design, so the only way through
    // is to sort by time — which is exactly what the mission teaches.
    title: 'Copy Recent Paintings',
    solve: async (p) => {
      await sh(p, `cd ${w('P_MAIN_TOWER')}`);
      await sh(p, `cp $(ls -t ${w('W_PAINTING')}* | head -2) ${w('P_GREAT_HALL')}/`, 1_500);
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
      const listed = await readRaw(p, `ls ${w('P_OBSERVATORY')}`);
      const date = listed.match(new RegExp(`${w('W_PROPHECY')}(\\d{4}-\\d{2}-\\d{2})`))?.[1];
      if (!date) throw new Error(`no prophecy date in: ${listed.slice(-200)}`);
      // `date +%A` speaks the container's locale, which is C, so it would
      // answer in English whatever language the run is playing. `%u` is a
      // number — 1 for Monday — and the name comes from the lexicon, exactly
      // as the step's own background script names it.
      const weekday = Number(await readMarker(p, `echo @@$(date -d ${date} +%u)@@`));
      return WEEKDAYS[weekday - 1];
    },
  },
  {
    title: 'Write in Your Journal',
    solve: (p) => sh(p, `echo "Day one: I built a chest." > ${CHEST}/${w('W_JOURNAL_TXT')}`),
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
        await sh(p, `cd "$(find ${w('P_CELLAR')} -maxdepth 1 -type d -name '.${w('W_LAIR')}*')"`, 1_200);
        await sh(p, `rm -f *${w('W_SPIDER_QUEEN')}*`, 800);
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
      sh(p, `find ${w('P_MAZE')} -name ${w('W_COPPER_COIN')} -exec mv {} ${CHEST}/ \\;`, 2_000),
  },
  {
    title: 'Find the Silver Coin',
    solve: (p) =>
      sh(p, `find ${w('P_GRAND_MAZE')} -name ${w('W_SILVER_COIN')} -exec mv {} ${CHEST}/ \\;`, 2_000),
  },
  {
    // Four coins with colliding names — moving them one by one under distinct
    // names is what stops `mv` refusing to overwrite what it just created.
    title: 'Find the Gold Coins',
    solve: (p) =>
      sh(
        p,
        `i=0; for f in $(find ${w('P_CASTLE')} ${w('P_GARDEN')} -iname "*${w('W_GOLD_COIN')}*"); do i=$((i+1)); mv "$f" ${CHEST}/${w('W_GOLD_COIN')}_$i; done`,
        2_500
      ),
  },

  // --- The Book of Potions: the check reads the learner's last command -----
  {
    title: "Hermit's Tea",
    solve: async (p) => {
      await sh(p, `cd ${CAVE}`);
      await sh(p, `head -n 6 ${w('W_BOOK_OF_POTIONS')}/${w('W_PAGE')}02`, 1_200);
    },
  },
  { title: 'Supper at the Cave', solve: (p) => sh(p, `tail -n 6 ${w('W_BOOK_OF_POTIONS')}/${w('W_PAGE')}01`, 1_200) },
  {
    title: 'Philtre of Borrowed Faces',
    solve: (p) => sh(p, `cat ${w('W_BOOK_OF_POTIONS')}/${w('W_PAGE')}04a ${w('W_BOOK_OF_POTIONS')}/${w('W_PAGE')}04b`, 1_500),
  },
  {
    title: 'Elixir of Youth',
    solve: (p) => sh(p, `cat ${w('W_BOOK_OF_POTIONS')}/${w('W_PAGE')}05 | tail -n 6`, 1_200),
  },
  {
    title: 'Glass of Nothing At All',
    solve: (p) => sh(p, `head -n 60 ${w('W_BOOK_OF_POTIONS')}/${w('W_BOUND_EDITION')} | tail -n 6`, 1_200),
  },

  {
    title: 'Find the Ruby',
    solve: (p) => sh(p, `mv ${w('P_RUBY')} ${CHEST}/`),
  },
  {
    title: 'Find the Diamond',
    solve: (p) => sh(p, `mv ${w('P_DIAMOND')} ${CHEST}/`),
  },

  // --- The merchant's stall: also judged on the last command ---------------
  {
    title: "King's Debt",
    solve: async (p) => {
      await sh(p, `cd ${STALL}`);
      await sh(p, `grep ${w('T_KING')} ${w('W_LEDGER')} | grep -v ${w('T_PAID')}`, 1_200);
    },
  },
  {
    title: 'Taking Stock',
    solve: (p) =>
      sh(p, `grep ${w('T_CROWNS')} ${w('W_LEDGER')} | grep -v ${w('T_PAID')} | wc -l`, 1_200),
  },

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
      await sh(p, `ls > ${w('W_INVENTORY_TXT')}`, 1_200);
    },
  },
  {
    title: "King's Quarters",
    solve: async (p) => {
      await sh(p, `chmod +x ${w('P_KINGS_QUARTERS')}`);
      await sh(p, `touch ${w('P_MARKER_TXT')}`);
    },
  },
  {
    title: 'Read the Secret Note',
    solve: (p) => sh(p, `echo EXCALIBUR > ${CHEST}/${w('W_ANSWER_TXT')}`),
  },
  {
    title: 'Steal the Crown',
    solve: (p) => sh(p, `mv ${w('P_TREASURY_ROYAL_CROWN')} ${CHEST}/`),
  },
  {
    // The word is drawn per session, so decode it rather than knowing it.
    title: 'Caesar Cipher',
    solve: (p) =>
      sh(
        p,
        `tr 'A-Za-z' 'N-ZA-Mn-za-m' < ${w('P_SCROLL_TXT')} | sed -n 's/.*secret word is: *\\([A-Za-z][A-Za-z]*\\).*/\\1/p' > ${CHEST}/${w('W_ANSWER_TXT')}`,
        1_500
      ),
  },
  { title: 'The Adventure Continues', probe: false },
];

test.describe('GameShell — the whole adventure, in a real container', () => {
  test('every step: Verify refuses before the work, accepts after', async ({ page }) => {
    test.setTimeout(75 * 60 * 1000);

    test.skip(
      LEXICON === null,
      `no lexicon at ${CHALLENGES} — clone challenges beside ocf-front, or set GS_CHALLENGES`
    );
    trail(`locale: ${LOCALE}`);

    // Personal context, deliberately: the shared test org's subscription points
    // at a deleted plan, so no effective plan resolves and the launch 403s.
    await loginFresh(page, LEARNER, PASSWORD);
    await dismissVerificationBanner(page);
    await navigateViaMenuCategory(page, 'scenarios', '/scenarios');

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

    // Playing in another language means choosing it here, not merely expecting
    // it: the world is built at launch, and a run that only changed what it
    // expected would compare French titles against an English scenario and
    // blame the translation.
    // Always say which language, never assume one. The picker opens on the
    // language the app itself is being read in, which is not the scenario's
    // default — so a run that only spoke up for a non-default locale played
    // whatever the UI happened to be set to, and an English run against a
    // French UI silently checked English titles against a French world.
    const picker = card.getByTestId('scenario-language-select');
    const offered = (await picker.count()) > 0;
    test.skip(
      !offered && LOCALE !== DEFAULT_LOCALE,
      `GS_LOCALE=${LOCALE} needs a build whose launcher offers a language, and this one does not`
    );
    if (offered) {
      await picker.selectOption(LOCALE);
      trail(`chose ${LOCALE} on the card`);
    }

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

    // Before the first step: the briefing is the one thing on screen that the
    // steps cannot vouch for.
    await expectBriefingInTheChosenLanguage(page);

    for (const [index, step] of STEPS.entries()) {
      if (index < FROM || index > TO) continue;

      const title = page.getByTestId('scenario-step-title');
      // The title this language gives the step, falling back to the English
      // label in the table below when a locale has not named it.
      const expectedTitle = TITLES[index] || step.title;
      await expect(title, `step ${index} should be "${expectedTitle}"`).toContainText(expectedTitle, {
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
              return (await title.innerText({ timeout: READ_MS }).catch(() => titleNow)).trim();
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
