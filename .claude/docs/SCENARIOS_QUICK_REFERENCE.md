# Scenarios Quick Reference Card

Quick reference for developers working on the OCF scenario engine frontend.

## File Structure

```
ocf-front/src/
  components/
    Terminal/
      ScenarioPanel.vue            # Student sidebar: step content, verify, flags, progress
      ScenarioStartBar.vue         # Scenario picker bar above terminal
    Pages/
      Admin/
        Scenarios.vue              # Admin CRUD (wraps Entity.vue)
        ScenarioSteps.vue          # Admin CRUD (wraps Entity.vue)
        ScenarioSessions.vue       # Admin CRUD (wraps Entity.vue)
  services/
    domain/
      scenario/
        scenarioSessionService.ts  # API client for all scenario endpoints
        index.ts                   # Barrel export
  stores/
    scenarios.ts                   # Pinia store: scenarios entity
    scenarioSteps.ts               # Pinia store: scenario-steps entity
    scenarioSessions.ts            # Pinia store: scenario-sessions entity
```

## Key Constants and Enums

### Difficulty Levels
```typescript
'beginner' | 'intermediate' | 'advanced'
```

### Source Types
```typescript
'git' | 'upload' | 'builtin' | 'seed'
```

### Session Statuses
```typescript
'active' | 'completed' | 'abandoned'
```

### Step Progress Statuses
```typescript
'locked' | 'active' | 'completed' | 'skipped'
```

### Flag Format
```
FLAG{<16-hex-chars>}
// Example: FLAG{a1b2c3d4e5f6a7b8}
```

## TypeScript Interfaces

Defined in `scenarioSessionService.ts`:

```typescript
interface CurrentStepResponse {
  step_order: number
  title: string
  text?: string
  hint?: string
  status: string     // 'locked' | 'active' | 'completed' | 'skipped'
  has_flag: boolean
}

interface VerifyStepResponse {
  passed: boolean
  output?: string
  next_step?: number  // present if there is a next step
}

interface SubmitFlagResponse {
  correct: boolean
  message?: string
}

interface ScenarioSessionInfo {
  id: string
  scenario_id: string
  user_id: string
  current_step: number
  status: string     // 'active' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  terminal_session_id?: string
}
```

## Translation Keys

### ScenarioPanel (component-level via useTranslations)

```
scenarioPanel.title           = "Scenario" / "Scenario"
scenarioPanel.step            = "Step" / "Etape"
scenarioPanel.verify          = "Verify" / "Verifier"
scenarioPanel.verifying       = "Verifying..." / "Verification..."
scenarioPanel.passed          = "Step completed!" / "Etape validee !"
scenarioPanel.failed          = "Not quite right..." / "Pas tout a fait..."
scenarioPanel.showHint        = "Show Hint" / "Afficher l'indice"
scenarioPanel.hideHint        = "Hide Hint" / "Masquer l'indice"
scenarioPanel.submitFlag      = "Submit Flag" / "Soumettre le flag"
scenarioPanel.submitting      = "Submitting..." / "Envoi..."
scenarioPanel.flagCorrect     = "Correct!" / "Correct !"
scenarioPanel.flagIncorrect   = "Incorrect flag..." / "Flag incorrect..."
scenarioPanel.flagPlaceholder = "Enter flag..." / "Entrez le flag..."
scenarioPanel.abandon         = "Abandon Scenario" / "Abandonner le scenario"
scenarioPanel.abandonConfirm  = "Are you sure?..." / "Etes-vous sur ?..."
scenarioPanel.abandonTitle    = "Abandon Scenario" / "Abandonner le scenario"
scenarioPanel.completed       = "Scenario Completed!" / "Scenario termine !"
scenarioPanel.completedMessage = "Congratulations!..." / "Felicitations !..."
scenarioPanel.loading         = "Loading scenario..." / "Chargement du scenario..."
scenarioPanel.error           = "Failed to load..." / "Echec du chargement..."
scenarioPanel.noScenario      = "No active scenario" / "Aucun scenario actif"
scenarioPanel.output          = "Output" / "Sortie"
scenarioPanel.collapsePanel   = "Collapse panel" / "Replier le panneau"
scenarioPanel.expandPanel     = "Expand panel" / "Deplier le panneau"
```

### ScenarioStartBar (component-level via useTranslations)

```
scenarioStart.noActive    = "No scenario active on this terminal" / "Aucun scenario actif..."
scenarioStart.start       = "Start a Scenario" / "Demarrer un scenario"
scenarioStart.choose      = "Choose a scenario" / "Choisir un scenario"
scenarioStart.none        = "No scenarios available..." / "Aucun scenario disponible..."
scenarioStart.startError  = "Failed to start scenario." / "Echec du demarrage..."
scenarioStart.loadError   = "Failed to load scenarios." / "Echec du chargement..."
scenarioStart.closePicker = "Close" / "Fermer"
```

### Store Translations (store-level via useStoreTranslations)

**scenarios store:**
```
scenarios.pageTitle, scenarios.name, scenarios.title, scenarios.description,
scenarios.difficulty, scenarios.estimatedTime, scenarios.instanceType,
scenarios.sourceType, scenarios.gitRepository, scenarios.gitBranch,
scenarios.flagsEnabled, scenarios.gshEnabled, scenarios.crashTraps,
scenarios.introText, scenarios.finishText, scenarios.createdById,
scenarios.createdAt, scenarios.updatedAt,
scenarios.difficultyBeginner, scenarios.difficultyIntermediate,
scenarios.difficultyAdvanced, scenarios.sourceTypeGit, scenarios.sourceTypeUpload,
scenarios.sourceTypeBuiltin, scenarios.sourceTypeSeed
```

**scenarioSteps store:**
```
scenarioSteps.pageTitle, scenarioSteps.scenarioId, scenarioSteps.order,
scenarioSteps.title, scenarioSteps.textContent, scenarioSteps.hintContent,
scenarioSteps.verifyScript, scenarioSteps.backgroundScript,
scenarioSteps.foregroundScript, scenarioSteps.hasFlag, scenarioSteps.flagLevel
```

**scenarioSessions store:**
```
scenarioSessions.pageTitle, scenarioSessions.scenarioId, scenarioSessions.userId,
scenarioSessions.terminalSessionId, scenarioSessions.currentStep,
scenarioSessions.status, scenarioSessions.startedAt, scenarioSessions.completedAt,
scenarioSessions.statusActive, scenarioSessions.statusCompleted,
scenarioSessions.statusAbandoned
```

## API Endpoint Reference

All paths are relative (the `/api/v1/` prefix is added by axios interceptors).

### Generic CRUD (via entity management)

| Method | Path | Description |
|---|---|---|
| GET | `/scenarios` | List all scenarios |
| GET | `/scenarios/:id` | Get scenario by ID (includes steps) |
| POST | `/scenarios` | Create scenario |
| PATCH | `/scenarios/:id` | Update scenario |
| DELETE | `/scenarios/:id` | Delete scenario |
| GET | `/scenario-steps` | List all steps |
| GET | `/scenario-steps/:id` | Get step by ID |
| POST | `/scenario-steps` | Create step |
| PATCH | `/scenario-steps/:id` | Update step |
| DELETE | `/scenario-steps/:id` | Delete step |
| GET | `/scenario-sessions` | List all sessions |
| GET | `/scenario-sessions/:id` | Get session by ID (includes progress + flags) |
| POST | `/scenario-sessions` | Create session (admin) |
| PATCH | `/scenario-sessions/:id` | Update session |
| DELETE | `/scenario-sessions/:id` | Delete session |

### Custom Endpoints

| Method | Path | Description | Used By |
|---|---|---|---|
| POST | `/scenarios/import` | Import from git (501 not implemented) | -- |
| POST | `/scenarios/seed` | Create scenario + steps in one call | Admin/testing |
| POST | `/scenario-sessions/start` | Start a scenario session | ScenarioStartBar.vue |
| GET | `/scenario-sessions/by-terminal/:terminalId` | Find session by terminal | scenarioSessionService |
| GET | `/scenario-sessions/:id/current-step` | Get current step content | ScenarioPanel.vue |
| POST | `/scenario-sessions/:id/verify` | Run verify script | ScenarioPanel.vue |
| POST | `/scenario-sessions/:id/submit-flag` | Submit CTF flag | ScenarioPanel.vue |
| POST | `/scenario-sessions/:id/abandon` | Abandon session | ScenarioPanel.vue |

## Component Props and Events

### ScenarioPanel.vue

```typescript
// Props
interface Props {
  scenarioSessionId: string   // Active session ID
  isActive: boolean           // Whether session is active (controls button states)
}

// Events
'session-completed': []       // Emitted when last step passes
'session-abandoned': []       // Emitted after successful abandon
```

### ScenarioStartBar.vue

```typescript
// Props
interface Props {
  terminalSessionId: string   // tt-backend terminal session UUID
}

// Events
'scenario-started': [scenarioSessionId: string]  // Emitted with new session ID
```

## Code Patterns

### Service Usage (student UI)

```typescript
import { scenarioSessionService } from '../../services/domain/scenario'
import type { CurrentStepResponse, VerifyStepResponse, SubmitFlagResponse } from '../../services/domain/scenario'

// Start scenario
const session = await scenarioSessionService.startScenario(scenarioId, {
  terminal_session_id: terminalSessionId
})

// Get current step
const step = await scenarioSessionService.getCurrentStep(sessionId)

// Verify step
const result = await scenarioSessionService.verifyStep(sessionId)

// Submit flag
const flagResult = await scenarioSessionService.submitFlag(sessionId, 'FLAG{...}')

// Abandon
await scenarioSessionService.abandonSession(sessionId)

// Check terminal for active session
const session = await scenarioSessionService.getSessionByTerminal(terminalId)
```

### Store Usage (admin pages)

```typescript
// All admin pages use the generic Entity.vue pattern:
<Entity :entity-name="'scenarios'" :entity-store="entityStore" />

// Store extends useBaseStore() and provides fieldList:
const entityStore = useScenariosStore()
```

### Markdown Rendering (ScenarioPanel)

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true, gfm: true })

const renderedStepText = computed(() => {
  const html = marked.parse(currentStep.value.text) as string
  return DOMPurify.sanitize(html)
})
```

## Testing Checklist

### Student Flow

- [ ] Start scenario: list loads, pick one, session starts
- [ ] Step navigation: first step active, progress dots show correctly
- [ ] Markdown rendering: step text and hints render properly
- [ ] Hint toggle: show/hide works, content rendered as markdown
- [ ] Verify pass: success message, auto-advance to next step after 1.5s
- [ ] Verify fail: error message with output shown
- [ ] Flag input: shown only when `has_flag=true`, submit works
- [ ] Flag correct: success message
- [ ] Flag incorrect: error message, can retry
- [ ] Abandon: confirmation dialog, session status changes
- [ ] Completed state: trophy icon, congratulations message
- [ ] Panel collapse: toggle works, state persisted in localStorage
- [ ] Responsive: 350px desktop, 280px tablet, fullscreen mobile
- [ ] Error handling: network errors show appropriate messages

### Admin Flow

- [ ] Scenarios CRUD: list, create (name/title/instance_type required), edit, delete
- [ ] ScenarioSteps CRUD: parent scenario selector, order/title required, scripts hidden from table
- [ ] ScenarioSessions CRUD: read-only except status field, parent scenario reference
- [ ] Bilingual: all labels show correctly in EN and FR

## Security Checklist

- [ ] Verify scripts are never exposed in GET responses (check ScenarioStepOutput DTO)
- [ ] Flag expected values are never exposed (check ScenarioFlagOutput DTO)
- [ ] Session ownership is enforced on all session endpoints (getSessionIfOwned)
- [ ] Markdown is sanitized via DOMPurify before rendering (XSS prevention)
- [ ] API calls use axios interceptors (JWT auto-attached)
- [ ] No hardcoded colors in CSS (all CSS variables)
