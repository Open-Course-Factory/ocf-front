import { type Page } from '@playwright/test';

/**
 * Stateful HTTP mock for the scenario player (Tier A of the scenario E2E
 * suite — see scenarios-e2e-test-plan.md at the monorepo root).
 *
 * The player components call scenarioSessionService (axios) directly — Pinia
 * stores are NOT in that path — so route interception is the only stub seam,
 * and it exercises the real components end to end without tt-backend/Incus.
 *
 * The mock mirrors the ocf-core semantics that matter to the UI:
 *  - step order is data-driven (first step's `order`, not hardcoded 0)
 *  - an info step acknowledges through POST /verify, like a terminal step
 *  - a quiz always advances, even at 0% (backend behavior, pinned by spec)
 *  - flag compare is exact (no trimming), 20 failed attempts lock the step
 *  - hints reveal sequentially; skipping a level is a 400
 *  - grade is 0–100 (mean of per-step scores × 100); quiz_score stays 0–1
 */

export interface MockQuestion {
  id: string;
  order: number;
  question_text: string;
  question_type: 'multiple_choice' | 'multi_answer' | 'true_false' | 'free_text';
  options?: string[];
  /** Expected answer in wire format: option index as string for MCQ,
   *  JSON array of sorted indices for multi_answer ("[0,2]"),
   *  "true"/"false" for true_false, raw text for free_text. */
  correct: string;
  explanation?: string;
}

export interface MockStep {
  order: number;
  title: string;
  text?: string;
  type: 'terminal' | 'flag' | 'info' | 'quiz';
  /** Consumed one per verify call; the last value repeats. Default: [true]. */
  verifyOutcomes?: boolean[];
  verifyFailOutput?: string;
  flag?: string;
  hints?: string[];
  questions?: MockQuestion[];
  show_immediate_feedback?: boolean;
  /** When set, validating this step leaves the NEXT step provisioning
   *  asynchronously: the success response carries next_step_provisioning and
   *  the session stays 'provisioning' for that many info polls. */
  provisionNextPolls?: number;
  provisionTimeoutSeconds?: number;
  /** When true, that wait ends in setup_failed instead of active. */
  provisionNextFails?: boolean;
  /** When true, the next step's preparation runs inline and fails: the verify
   *  response carries next_step_provisioning_failed and the session stays
   *  'active', so there is nothing for the client to poll. */
  provisionNextFailsInline?: boolean;
}

export interface MockScenarioOptions {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  estimated_time?: string;
  instance_type?: string;
  os_type?: string;
  launchable?: boolean;
  block_reason?: string;
  intro_text?: string;
  finish_text?: string;
  flags_enabled?: boolean;
  /** How POST /launch behaves. 'active' skips provisioning entirely. */
  launch?: 'active' | 'provision-then-active' | 'provision-then-failed';
  /** Session-info polls that stay 'provisioning' before resolving (default 2). */
  provisioningPolls?: number;
  /** Start with the whole scenario already completed (review/history specs). */
  startCompleted?: boolean;
}

export const MOCK_TERMINAL_ID = 'e2e-mock-term-1';
export const MOCK_SESSION_ID = 'e2e-mock-scen-sess-1';

const FLAG_LOCKOUT_ATTEMPTS = 20;

export class ScenarioMock {
  readonly scenario: Required<Pick<MockScenarioOptions, 'id' | 'name' | 'title'>> & MockScenarioOptions;
  readonly steps: MockStep[];

  sessionStatus: 'none' | 'provisioning' | 'active' | 'completed' | 'abandoned' | 'setup_failed' = 'none';
  currentStep: number;
  private stepScores = new Map<number, number>();
  private verifyCursor = new Map<number, number>();
  private hintsRevealed = new Map<number, number>();
  private flagAttempts = new Map<number, number>();
  private validatedFlags: { step_order: number; flag: string; submitted_at: string }[] = [];
  private provisioningPollsLeft = 0;
  /** True while a per-step (post-validation) provisioning wait is running —
   *  distinguishes the reported phase from the session-start sequence. */
  private stepProvisioning = false;
  /** When true, a per-step provisioning wait ends in setup_failed rather than
   *  active — the state the retry button exists for. */
  private stepProvisioningFails = false;
  /** How the reprovision-step endpoint should answer. */
  reprovisionOutcome: 'ok' | 'fail' = 'ok';
  /** Counts reprovision-step calls, so a spec can assert the retry button
   *  actually re-ran the setup rather than merely reloading the step. */
  reprovisionCalls = 0;

  constructor(steps: MockStep[], options: MockScenarioOptions = {}) {
    this.steps = [...steps].sort((a, b) => a.order - b.order);
    this.scenario = {
      id: 'e2e-mock-scenario-1',
      name: 'e2e-mock-scenario',
      title: 'E2E mock scenario',
      description: 'Mocked scenario for the Tier A player suite.',
      difficulty: 'beginner',
      estimated_time: '10m',
      instance_type: 's',
      os_type: 'deb',
      launchable: true,
      flags_enabled: this.steps.some((s) => s.type === 'flag'),
      launch: 'active',
      provisioningPolls: 2,
      ...options,
    };
    this.currentStep = this.steps[0]?.order ?? 0;
    if (options.startCompleted) {
      for (const s of this.steps) this.stepScores.set(s.order, 1);
      this.currentStep = this.steps[this.steps.length - 1]?.order ?? 0;
      this.sessionStatus = 'completed';
    }
  }

  private stepByOrder(order: number): MockStep | undefined {
    return this.steps.find((s) => s.order === order);
  }

  private nextOrder(after: number): number | undefined {
    return this.steps.find((s) => s.order > after)?.order;
  }

  private advance(fromOrder: number, score: number): number | undefined {
    this.stepScores.set(fromOrder, score);
    const next = this.nextOrder(fromOrder);
    if (next === undefined) {
      this.sessionStatus = 'completed';
    } else {
      this.currentStep = next;
    }
    return next;
  }

  private get stepScoreCount(): number {
    return this.stepScores.size;
  }

  /** 0–100, mean of per-step scores — mirrors ComputeWeightedGradeFromLoaded. */
  get grade(): number {
    if (!this.steps.length) return 0;
    let sum = 0;
    for (const s of this.steps) sum += this.stepScores.get(s.order) ?? 0;
    return Math.round((sum / this.steps.length) * 100);
  }

  private stepPayload(step: MockStep) {
    const completed = this.stepScores.has(step.order);
    return {
      step_order: step.order,
      // Mirrors the backend contract: position is the 1-based index among
      // ordered steps; display must never derive it from step_order.
      position: this.steps.findIndex((s) => s.order === step.order) + 1,
      step_orders: this.steps.map((s) => s.order),
      total_steps: this.steps.length,
      title: step.title,
      text: step.text || `Content of ${step.title}`,
      step_type: step.type,
      show_immediate_feedback: step.show_immediate_feedback ?? true,
      questions: step.questions?.map((q) => ({
        id: q.id,
        order: q.order,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ? JSON.stringify(q.options) : undefined,
      })),
      status: completed ? 'completed' : step.order === this.currentStep ? 'active' : 'locked',
      has_flag: step.type === 'flag',
      hints_total_count: step.hints?.length ?? 0,
      hints_revealed: this.hintsRevealed.get(step.order) ?? 0,
    };
  }

  private sessionInfo() {
    return {
      id: MOCK_SESSION_ID,
      scenario_id: this.scenario.id,
      user_id: 'e2e-user',
      current_step: this.currentStep,
      status: this.sessionStatus === 'none' ? 'active' : this.sessionStatus,
      started_at: new Date(Date.now() - 60_000).toISOString(),
      completed_at: this.sessionStatus === 'completed' ? new Date().toISOString() : undefined,
      terminal_session_id: MOCK_TERMINAL_ID,
      grade: this.sessionStatus === 'completed' ? this.grade : undefined,
      provisioning_phase:
        this.sessionStatus === 'provisioning'
          ? this.stepProvisioning ? 'step_setup' : 'setup_script'
          : '',
    };
  }

  private launcherCard() {
    const { launch, provisioningPolls, intro_text, finish_text, ...card } = this.scenario;
    return card;
  }

  /** Register all route handlers. Call before any navigation. */
  async install(page: Page): Promise<void> {
    const json = (body: unknown, status = 200) => ({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    await page.route('**/api/v1/scenario-sessions/available**', (route) =>
      route.fulfill(json([this.launcherCard()]))
    );

    await page.route('**/api/v1/scenario-sessions/my', (route) => {
      if (this.sessionStatus === 'none') return route.fulfill(json([]));
      return route.fulfill(
        json([
          {
            id: MOCK_SESSION_ID,
            scenario_id: this.scenario.id,
            scenario_title: this.scenario.title,
            status: this.sessionStatus,
            current_step: this.currentStep,
            total_steps: this.steps.length,
            completed_steps: this.stepScoreCount,
            grade: this.sessionStatus === 'completed' ? this.grade : undefined,
            started_at: new Date(Date.now() - 60_000).toISOString(),
            completed_at: this.sessionStatus === 'completed' ? new Date().toISOString() : undefined,
            terminal_session_id: MOCK_TERMINAL_ID,
          },
        ])
      );
    });

    await page.route('**/api/v1/scenario-sessions/launch', (route) => {
      if (this.scenario.launch === 'active') {
        this.sessionStatus = 'active';
      } else {
        this.sessionStatus = 'provisioning';
        this.provisioningPollsLeft = this.scenario.provisioningPolls ?? 2;
      }
      return route.fulfill(
        json({
          terminal_session_id: MOCK_TERMINAL_ID,
          scenario_session_id: MOCK_SESSION_ID,
          status: this.sessionStatus,
          provisioning_phase: this.sessionStatus === 'provisioning' ? 'setup_script' : '',
        })
      );
    });

    await page.route(`**/api/v1/scenario-sessions/by-terminal/${MOCK_TERMINAL_ID}`, (route) => {
      if (this.sessionStatus === 'none') return route.fulfill(json({ error: 'not found' }, 404));
      return route.fulfill(json(this.sessionInfo()));
    });

    // Both spellings. The client asks /info — the endpoint that answers with the
    // session's own view, carrying the scenario text resolved for its locale and
    // the provisioning timeout. The bare URL is the generic entity route, kept
    // so a stray caller is still answered here rather than reaching a backend
    // that is not running.
    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}{,/info}`, (route) => {
      if (this.sessionStatus === 'provisioning' && this.provisioningPollsLeft-- <= 0) {
        const failed =
          this.scenario.launch === 'provision-then-failed' ||
          (this.stepProvisioning && this.stepProvisioningFails);
        this.sessionStatus = failed ? 'setup_failed' : 'active';
        this.stepProvisioning = false;
      }
      return route.fulfill(json(this.sessionInfo()));
    });

    // The recovery path for a failed step setup. The first call answers
    // whatever `reprovisionOutcome` says, so a spec can drive both a retry that
    // works and one that does not.
    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/reprovision-step`, (route) => {
      this.reprovisionCalls += 1;
      if (this.reprovisionOutcome === 'fail') {
        return route.fulfill(json({ error_message: 'step provisioning failed' }, 400));
      }
      this.sessionStatus = 'active';
      this.stepProvisioning = false;
      this.provisioningPollsLeft = 0;
      return route.fulfill(json({ step_order: this.currentStep, status: 'active' }));
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/current-step`, (route) => {
      const step = this.stepByOrder(this.currentStep);
      if (!step) return route.fulfill(json({ error: 'no step' }, 404));
      return route.fulfill(json(this.stepPayload(step)));
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/step/*`, (route) => {
      const order = Number(route.request().url().split('/').pop());
      const step = this.stepByOrder(order);
      if (!step) return route.fulfill(json({ error: 'no step' }, 404));
      return route.fulfill(json(this.stepPayload(step)));
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/verify`, (route) => {
      const step = this.stepByOrder(this.currentStep);
      if (!step) return route.fulfill(json({ error: 'no step' }, 500));
      const outcomes = step.verifyOutcomes ?? [true];
      const cursor = this.verifyCursor.get(step.order) ?? 0;
      const passed = outcomes[Math.min(cursor, outcomes.length - 1)];
      this.verifyCursor.set(step.order, cursor + 1);
      if (!passed) {
        return route.fulfill(
          json({ passed: false, output: step.verifyFailOutput || 'check failed: expected file missing' })
        );
      }
      const next = this.advance(step.order, 1);
      // Async per-step provisioning: the next step's preparation was left
      // running — the client must poll session info until 'active'.
      if (next !== undefined && step.provisionNextPolls !== undefined) {
        this.sessionStatus = 'provisioning';
        this.stepProvisioning = true;
        this.stepProvisioningFails = step.provisionNextFails === true;
        this.provisioningPollsLeft = step.provisionNextPolls;
        return route.fulfill(
          json({
            passed: true,
            output: 'ok',
            next_step: next,
            next_step_provisioning: true,
            provisioning_timeout_seconds: step.provisionTimeoutSeconds ?? 30,
          })
        );
      }
      // Synchronous per-step provisioning that failed: the advance stands and
      // the session stays active, so the response itself is the only signal.
      if (next !== undefined && step.provisionNextFailsInline) {
        return route.fulfill(
          json({
            passed: true,
            output: 'ok',
            next_step: next,
            next_step_provisioning_failed: true,
          })
        );
      }
      return route.fulfill(json({ passed: true, output: 'ok', next_step: next }));
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/submit-flag`, (route) => {
      const step = this.stepByOrder(this.currentStep);
      if (!step) return route.fulfill(json({ error: 'no step' }, 500));
      const attempts = (this.flagAttempts.get(step.order) ?? 0) + 1;
      this.flagAttempts.set(step.order, attempts);
      if (attempts > FLAG_LOCKOUT_ATTEMPTS) {
        return route.fulfill(
          json({ correct: false, message: 'Too many attempts. Flag submission locked for this step.' })
        );
      }
      const submitted = (route.request().postDataJSON() as { flag: string }).flag;
      if (submitted !== step.flag) {
        return route.fulfill(json({ correct: false }));
      }
      this.validatedFlags.push({
        step_order: step.order,
        flag: submitted,
        submitted_at: new Date().toISOString(),
      });
      const next = this.advance(step.order, 1);
      return route.fulfill(json({ correct: true, next_step: next }));
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/submit-quiz`, (route) => {
      const step = this.stepByOrder(this.currentStep);
      if (!step || !step.questions) return route.fulfill(json({ error: 'no quiz' }, 500));
      const answers = (route.request().postDataJSON() as { answers: Record<string, string> }).answers;
      const perQuestion = step.questions.map((q) => ({
        question_id: q.id,
        correct: (answers[q.id] ?? '') === q.correct,
        correct_answer: q.correct,
        explanation: q.explanation,
      }));
      const correctCount = perQuestion.filter((r) => r.correct).length;
      const score = step.questions.length ? correctCount / step.questions.length : 0;
      const next = this.advance(step.order, score);
      return route.fulfill(
        json({
          score,
          correct_count: correctCount,
          total: step.questions.length,
          per_question_results: perQuestion,
          next_step: next,
        })
      );
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/steps/*/hints/*/reveal`, (route) => {
      const parts = route.request().url().split('/');
      const level = Number(parts[parts.length - 2]);
      const order = Number(parts[parts.length - 4]);
      const step = this.stepByOrder(order);
      const revealed = this.hintsRevealed.get(order) ?? 0;
      if (!step?.hints || level > revealed + 1 || level > step.hints.length) {
        return route.fulfill(json({ error: 'invalid hint level' }, 400));
      }
      this.hintsRevealed.set(order, Math.max(revealed, level));
      return route.fulfill(
        json({ level, content: step.hints[level - 1], total: step.hints.length })
      );
    });

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/flags`, (route) =>
      route.fulfill(json(this.validatedFlags))
    );

    await page.route(`**/api/v1/scenario-sessions/${MOCK_SESSION_ID}/abandon`, (route) => {
      if (this.sessionStatus !== 'active') {
        return route.fulfill(json({ error: 'session is not active' }, 500));
      }
      this.sessionStatus = 'abandoned';
      return route.fulfill(json({ status: 'abandoned' }));
    });

    await page.route(`**/api/v1/scenarios/${this.scenario.id}`, (route) =>
      route.fulfill(
        json({
          id: this.scenario.id,
          name: this.scenario.name,
          title: this.scenario.title,
          description: this.scenario.description,
          intro_text: this.scenario.intro_text,
          finish_text: this.scenario.finish_text,
          difficulty: this.scenario.difficulty,
          estimated_time: this.scenario.estimated_time,
          flags_enabled: this.scenario.flags_enabled,
        })
      )
    );

    // Terminal-side surface: the session view resolves its terminal from the
    // user-sessions list; the terminal console itself is not needed by the
    // player specs (the panel tolerates a dead console).
    await page.route('**/api/v1/terminals/user-sessions', (route) =>
      route.fulfill(
        json([
          {
            session_id: MOCK_TERMINAL_ID,
            name: 'e2e-mock-terminal',
            state: this.sessionStatus === 'abandoned' ? 'deleted' : 'running',
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
            instance_type: this.scenario.instance_type,
            machine_size: this.scenario.instance_type,
            persistence_mode: 'ephemeral',
            composed_features: '{"network":true}',
          },
        ])
      )
    );

    await page.route('**/api/v1/terminals/sizes**', (route) =>
      route.fulfill(json([{ key: 'xs' }, { key: 's' }, { key: 'm' }, { key: 'l' }]))
    );

    await page.route(`**/api/v1/terminals/${MOCK_TERMINAL_ID}/**`, (route) =>
      route.fulfill(json([]))
    );
  }
}

/** Convenience four-step scenario used by most player specs. */
export function standardSteps(): MockStep[] {
  return [
    { order: 1, title: 'Read the briefing', type: 'info', text: 'Welcome to the mock scenario.' },
    {
      order: 2,
      title: 'Create the marker file',
      type: 'terminal',
      hints: ['Look in /tmp.', 'Use the touch command.'],
    },
    { order: 3, title: 'Find the flag', type: 'flag', flag: 'FLAG{deadbeefdeadbeef}' },
    {
      order: 4,
      title: 'Final quiz',
      type: 'quiz',
      show_immediate_feedback: true,
      questions: [
        {
          id: 'q1',
          order: 1,
          question_text: 'Which command lists files?',
          question_type: 'multiple_choice',
          options: ['cd', 'ls', 'rm'],
          correct: '1',
        },
        {
          id: 'q2',
          order: 2,
          question_text: 'The root user has UID 0.',
          question_type: 'true_false',
          correct: 'true',
        },
      ],
    },
  ];
}
