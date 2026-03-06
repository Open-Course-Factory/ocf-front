# Scenarios Implementation Index

Frontend implementation reference for the OCF interactive scenario system.

## Status Overview

| Layer | Status | Key Files |
|---|---|---|
| Backend (ocf-core) | Complete | `ocf-core/src/scenarios/` (models, DTOs, services, routes, entity registration) |
| Student UI | Complete | `ScenarioPanel.vue`, `ScenarioStartBar.vue`, `scenarioSessionService.ts` |
| Admin UI | Complete | `Scenarios.vue`, `ScenarioSteps.vue`, `ScenarioSessions.vue` + Pinia stores |
| Admin routes | Complete | Routes and nav items registered in router and layout |

## Documentation Reading Order

1. **[SCENARIOS_ARCHITECTURE.md](../../../.claude/docs/SCENARIOS_ARCHITECTURE.md)** -- Cross-project architecture, data model, API reference, security model (start here for full system understanding)
2. **[SCENARIOS_QUICK_REFERENCE.md](SCENARIOS_QUICK_REFERENCE.md)** -- File structure, constants, patterns quick reference card
3. **[SCENARIOS_ARCHITECTURE_DIAGRAM.md](SCENARIOS_ARCHITECTURE_DIAGRAM.md)** -- Component hierarchy, workflow, state management, CSS diagrams
4. **[SCENARIOS_ADMIN_GUIDE.md](SCENARIOS_ADMIN_GUIDE.md)** -- User-facing admin guide with step-by-step instructions
5. **This file** -- Implementation index and checklist

## Implementation Checklist

### Backend (ocf-core)

- [x] 5 data models: Scenario, ScenarioStep, ScenarioSession, ScenarioStepProgress, ScenarioFlag
- [x] CRUD DTOs for all 5 entities (Create, Edit, Output)
- [x] Custom DTOs: StartScenarioInput, VerifyStepResponse, SubmitFlagInput/Response, CurrentStepResponse, SeedScenarioInput, ImportScenarioInput
- [x] Entity registrations with RBAC (Member=GET, Admin=full CRUD)
- [x] Custom controller: import, seed, start, current-step, verify, submit-flag, abandon, by-terminal
- [x] Session service: lifecycle management (start, verify, flag, abandon)
- [x] Verification service: calls tt-backend exec API to run scripts in containers
- [x] Flag service: HMAC-SHA256 generation, constant-time validation
- [x] Importer service: KillerCoda index.json parsing with path traversal protection
- [x] Module config: `scenarios` feature flag
- [x] Script hiding: VerifyScript/BackgroundScript/ForegroundScript excluded from Output DTOs

### Frontend -- Student UI

- [x] `src/components/Terminal/ScenarioPanel.vue` -- Right sidebar panel (collapsible)
  - Step content with markdown rendering (marked + DOMPurify)
  - Collapsible hint section
  - Verify button with pass/fail feedback
  - Flag input with submit and result feedback
  - Progress dots indicator
  - Abandon button with confirmation
  - Completed state with trophy icon
  - Bilingual translations (EN/FR)
  - Responsive CSS (350px desktop, 280px tablet, fullscreen mobile)
  - Collapse state persisted in localStorage

- [x] `src/components/Terminal/ScenarioStartBar.vue` -- Start bar above terminal
  - "No scenario active" prompt with start button
  - Scenario picker dropdown (title, difficulty badge, estimated time)
  - Bilingual translations (EN/FR)

- [x] `src/services/domain/scenario/scenarioSessionService.ts` -- API client
  - `startScenario(scenarioId, options)` -- POST /scenario-sessions/start
  - `listScenarios()` -- GET /scenarios
  - `getCurrentStep(sessionId)` -- GET /scenario-sessions/:id/current-step
  - `verifyStep(sessionId)` -- POST /scenario-sessions/:id/verify
  - `submitFlag(sessionId, flag)` -- POST /scenario-sessions/:id/submit-flag
  - `abandonSession(sessionId)` -- POST /scenario-sessions/:id/abandon
  - `getSessionByTerminal(terminalSessionId)` -- GET /scenario-sessions/by-terminal/:id

- [x] `src/services/domain/scenario/index.ts` -- Barrel export

### Frontend -- Admin UI

- [x] `src/stores/scenarios.ts` -- Pinia store with fieldList (name, title, description, difficulty, estimated_time, instance_type, source_type, git fields, flags, gsh, crash_traps, intro/finish text)
- [x] `src/stores/scenarioSteps.ts` -- Pinia store with parent reference to scenarios store, fieldList (scenario_id as multi-select, order, title, text_content, hint_content, verify/background/foreground scripts hidden, has_flag, flag_level)
- [x] `src/stores/scenarioSessions.ts` -- Pinia store with parent reference to scenarios store, fieldList (all fields readonly except status which is updatable as select)
- [x] `src/components/Pages/Admin/Scenarios.vue` -- Entity.vue wrapper
- [x] `src/components/Pages/Admin/ScenarioSteps.vue` -- Entity.vue wrapper
- [x] `src/components/Pages/Admin/ScenarioSessions.vue` -- Entity.vue wrapper

## File Organization

```
ocf-front/src/
  components/
    Terminal/
      ScenarioPanel.vue          # Student scenario sidebar (1058 lines)
      ScenarioStartBar.vue       # Scenario picker bar (306 lines)
    Pages/
      Admin/
        Scenarios.vue            # Admin CRUD page (16 lines)
        ScenarioSteps.vue        # Admin CRUD page
        ScenarioSessions.vue     # Admin CRUD page
  services/
    domain/
      scenario/
        scenarioSessionService.ts  # API client (79 lines)
        index.ts                   # Barrel export (3 lines)
  stores/
    scenarios.ts               # Pinia store (125 lines)
    scenarioSteps.ts           # Pinia store (84 lines)
    scenarioSessions.ts        # Pinia store (85 lines)
```

## Key Dependencies

| Package | Used In | Purpose |
|---|---|---|
| `marked` | ScenarioPanel.vue | Markdown rendering for step text and hints |
| `dompurify` | ScenarioPanel.vue | XSS sanitization of rendered HTML |
| `axios` | scenarioSessionService.ts | HTTP client (interceptors add /api/v1/ prefix) |
| `pinia` | stores/*.ts | State management for admin CRUD |
| `vue-router` | router config | Admin page routing |
