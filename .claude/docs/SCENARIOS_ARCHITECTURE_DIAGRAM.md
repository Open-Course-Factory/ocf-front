# Scenarios Architecture Diagrams

Visual architecture reference for the OCF scenario engine frontend.

## Component Hierarchy

```
Terminal View (existing)
  |
  +-- ScenarioStartBar.vue        (shown when no active scenario)
  |     Props: terminalSessionId
  |     Events: @scenario-started(sessionId)
  |     Features: scenario list picker, start button
  |
  +-- ScenarioPanel.vue           (shown when scenario is active)
        Props: scenarioSessionId, isActive
        Events: @session-completed, @session-abandoned
        Features: step content, verify, flags, progress, abandon

Admin Section (existing Entity.vue pattern)
  |
  +-- Scenarios.vue               (admin CRUD page)
  |     Store: useScenariosStore()
  |     Route: /admin/scenarios
  |
  +-- ScenarioSteps.vue           (admin CRUD page)
  |     Store: useScenarioStepsStore()
  |     Route: /admin/scenario-steps
  |     Parent: scenario_id -> useScenariosStore()
  |
  +-- ScenarioSessions.vue        (admin CRUD page)
        Store: useScenarioSessionsStore()
        Route: /admin/scenario-sessions
        Parent: scenario_id -> useScenariosStore()
```

## Student Workflow End-to-End

```
[Terminal View]
      |
      v
+-------------------+     No active session
| ScenarioStartBar  |<---------------------------------+
| "No scenario      |                                  |
|  active"           |                                  |
+-------------------+                                  |
      |                                                |
      | Click "Start a Scenario"                       |
      v                                                |
+-------------------+                                  |
| Load scenario     |  GET /scenarios                  |
| list from API     |                                  |
+-------------------+                                  |
      |                                                |
      | User picks a scenario                          |
      v                                                |
+-------------------+                                  |
| Start session     |  POST /scenario-sessions/start   |
| (creates session, |  { scenario_id,                  |
|  step progress,   |    terminal_session_id }         |
|  flags)           |                                  |
+-------------------+                                  |
      |                                                |
      | Emit @scenario-started(sessionId)              |
      v                                                |
+-------------------+                                  |
| ScenarioPanel     |  GET /.../current-step           |
| loads step 0      |                                  |
+-------------------+                                  |
      |                                                |
      v                                                |
+-------------------+                                  |
| Display step:     |                                  |
| - Title           |                                  |
| - Markdown text   |                                  |
| - Hint (toggle)   |                                  |
| - Progress dots   |                                  |
| - Verify button   |                                  |
| - Flag input      |                                  |
+-------------------+                                  |
      |                                                |
      | Click "Verify"                                 |
      v                                                |
+-------------------+                                  |
| Run verification  |  POST /.../verify                |
+-------------------+                                  |
      |           |                                    |
      | Failed    | Passed                             |
      v           v                                    |
+--------+  +-----------+                              |
| Show   |  | Mark step |                              |
| error  |  | completed |                              |
| output |  +-----------+                              |
| (retry)|       |                                     |
+--------+       |                                     |
                 |  Has next step?                      |
                 |-----+--------+                      |
                 |     |        |                      |
                 | Yes |     No |                      |
                 v     |        v                      |
          +---------+  |  +---------------+            |
          | Wait    |  |  | Mark session  |            |
          | 1.5s    |  |  | completed     |            |
          | Load    |  |  | Show trophy   |            |
          | next    |  |  +---------------+            |
          | step    |  |        |                      |
          +---------+  |        | Emit @session-       |
                |      |        |   completed          |
                +------+        |                      |
                       |        |                      |
      [If flag step]   |        |                      |
          |            |        |                      |
          v            |        |                      |
    +-----------+      |        |                      |
    | Show flag |      |        |                      |
    | input     |      |        |                      |
    +-----------+      |        |                      |
          |            |        |                      |
          | Submit     |        |                      |
          v            |        |                      |
    +-----------+      |        |                      |
    | POST      |      |        |                      |
    | submit-   |      |        |                      |
    | flag      |      |        |                      |
    +-----------+      |        |                      |
          |            |        |                      |
    Correct? ---No---> retry    |                      |
          |                     |                      |
          Yes                   |                      |
          |                     |                      |
          +--- reload step ---->|                      |
                                |                      |
      [Click Abandon] ---------+---------------------->|
        POST /.../abandon       Emit @session-abandoned
        Confirmation dialog
```

## Verification Data Flow (Cross-Service Sequence)

```
  Browser           ocf-front            ocf-core             tt-backend          Incus
    |                  |                    |                     |                  |
    | click Verify     |                    |                     |                  |
    |----------------->|                    |                     |                  |
    |                  | POST               |                     |                  |
    |                  | /scenario-sessions |                     |                  |
    |                  | /:id/verify        |                     |                  |
    |                  |------------------->|                     |                  |
    |                  |                    |                     |                  |
    |                  |                    | 1. Load session     |                  |
    |                  |                    |    + scenario steps |                  |
    |                  |                    |    + step progress  |                  |
    |                  |                    |                     |                  |
    |                  |                    | 2. Check ownership  |                  |
    |                  |                    |    (userId match)   |                  |
    |                  |                    |                     |                  |
    |                  |                    | 3. Find current     |                  |
    |                  |                    |    step by order    |                  |
    |                  |                    |                     |                  |
    |                  |                    | 4. POST /1.0/exec  |                  |
    |                  |                    | {                   |                  |
    |                  |                    |   session_id: "tt..",|                  |
    |                  |                    |   command: [        |                  |
    |                  |                    |     "/bin/sh","-c", |                  |
    |                  |                    |     "<verify_script>"|                 |
    |                  |                    |   ],                |                  |
    |                  |                    |   timeout: 10       |                  |
    |                  |                    | }                   |                  |
    |                  |                    |-------------------->|                  |
    |                  |                    |                     |                  |
    |                  |                    |                     | 5. Resolve       |
    |                  |                    |                     |    session ->    |
    |                  |                    |                     |    container     |
    |                  |                    |                     |                  |
    |                  |                    |                     | 6. ExecInstance  |
    |                  |                    |                     |----------------->|
    |                  |                    |                     |                  |
    |                  |                    |                     |  exit_code,      |
    |                  |                    |                     |  stdout, stderr  |
    |                  |                    |                     |<-----------------|
    |                  |                    |                     |                  |
    |                  |                    | { exit_code: 0,     |                  |
    |                  |                    |   stdout: "...",    |                  |
    |                  |                    |   stderr: "" }      |                  |
    |                  |                    |<--------------------|                  |
    |                  |                    |                     |                  |
    |                  |                    | 7. exit_code==0 ?   |                  |
    |                  |                    |    passed = true    |                  |
    |                  |                    |                     |                  |
    |                  |                    | 8. Increment        |                  |
    |                  |                    |    verify_attempts  |                  |
    |                  |                    |                     |                  |
    |                  |                    | 9. If passed:       |                  |
    |                  |                    |   - Mark step done  |                  |
    |                  |                    |   - Calc time_spent |                  |
    |                  |                    |   - Advance session |                  |
    |                  |                    |   - Unlock next     |                  |
    |                  |                    |     step progress   |                  |
    |                  |                    |                     |                  |
    |                  | { passed: true,    |                     |                  |
    |                  |   output: "...",   |                     |                  |
    |                  |   next_step: 1 }   |                     |                  |
    |                  |<-------------------|                     |                  |
    |                  |                    |                     |                  |
    |                  | 10. Show result    |                     |                  |
    |                  |     If passed +    |                     |                  |
    |                  |     next_step:     |                     |                  |
    |                  |     wait 1.5s,     |                     |                  |
    |                  |     reload step    |                     |                  |
    |                  |                    |                     |                  |
    | Show pass/fail   |                    |                     |                  |
    |<-----------------|                    |                     |                  |
```

## Flag Generation and Validation Flow

```
Session Start:
                                  ocf-core
                                     |
                        +------------+------------+
                        |                         |
                  scenarioSession           flagService
                    Service                      |
                        |                        |
              1. Create session          2. GenerateFlags()
              2. Create step progress       for each step with has_flag:
              3. Call flagService            |
                        |                    | input = sessionID:stepOrder:userID
                        |                    | key   = scenario.FlagSecret
                        |                    | hash  = HMAC-SHA256(key, input)
                        |                    | flag  = "FLAG{" + hex(hash)[:16] + "}"
                        |                    |
              4. Save flags to DB     <------+
                   (ExpectedFlag stored,
                    never exposed via API)


Flag Submission:
  Student                    ocf-core
    |                           |
    | POST /.../submit-flag     |
    | { flag: "FLAG{abc...}" }  |
    |-------------------------->|
    |                           |
    |                    1. Load session + flags
    |                    2. Find flag for current step
    |                    3. subtle.ConstantTimeCompare(
    |                         expected, submitted)
    |                    4. Update ScenarioFlag record:
    |                         submitted_flag, submitted_at,
    |                         is_correct
    |                           |
    | { correct: true/false,    |
    |   message: "..." }        |
    |<--------------------------|
```

## State Management Architecture

```
+---------------------------------------------------------+
|                    Pinia Stores                          |
|                                                         |
|  useScenariosStore()          (extends useBaseStore)     |
|  +-- fieldList (computed)                               |
|  +-- CRUD operations (inherited from baseStore)         |
|  +-- loading/error states (inherited)                   |
|                                                         |
|  useScenarioStepsStore()      (extends useBaseStore)     |
|  +-- fieldList (computed)                               |
|  +-- parentEntitiesStores: scenario_id -> scenarios     |
|  +-- CRUD operations (inherited)                        |
|                                                         |
|  useScenarioSessionsStore()   (extends useBaseStore)     |
|  +-- fieldList (computed)                               |
|  +-- parentEntitiesStores: scenario_id -> scenarios     |
|  +-- CRUD operations (inherited)                        |
+---------------------------------------------------------+
                          |
                          | Used by admin pages
                          v
+---------------------------------------------------------+
|  Admin Pages                                            |
|                                                         |
|  Scenarios.vue         -> Entity.vue -> EntityModal.vue |
|  ScenarioSteps.vue     -> Entity.vue -> EntityModal.vue |
|  ScenarioSessions.vue  -> Entity.vue -> EntityModal.vue |
+---------------------------------------------------------+

+---------------------------------------------------------+
|                 Service Layer                            |
|                                                         |
|  scenarioSessionService (plain object, not Pinia)       |
|  +-- startScenario()                                    |
|  +-- listScenarios()                                    |
|  +-- getCurrentStep()                                   |
|  +-- verifyStep()                                       |
|  +-- submitFlag()                                       |
|  +-- abandonSession()                                   |
|  +-- getSessionByTerminal()                             |
+---------------------------------------------------------+
                          |
                          | Used by student components
                          v
+---------------------------------------------------------+
|  Student Components                                     |
|                                                         |
|  ScenarioStartBar.vue                                   |
|  +-- Uses scenarioSessionService.listScenarios()        |
|  +-- Uses scenarioSessionService.startScenario()        |
|                                                         |
|  ScenarioPanel.vue                                      |
|  +-- Uses scenarioSessionService.getCurrentStep()       |
|  +-- Uses scenarioSessionService.verifyStep()           |
|  +-- Uses scenarioSessionService.submitFlag()           |
|  +-- Uses scenarioSessionService.abandonSession()       |
|  +-- Local refs for UI state (no Pinia store)           |
+---------------------------------------------------------+
```

## Error Handling Flow

```
API Call (scenarioSessionService)
    |
    | try/catch
    v
+-------------------------------------------+
| Success                                   |
| -> Update local refs                      |
| -> Show success feedback                  |
+-------------------------------------------+
    |
    | catch (err: any)
    v
+-------------------------------------------+
| Error                                     |
| -> console.error(...)                     |
| -> Check err.response?.status             |
|    |                                      |
|    +-- 404 on getCurrentStep:             |
|    |   -> isSessionCompleted = true       |
|    |                                      |
|    +-- Other errors:                      |
|    |   -> loadError = true (loading)      |
|    |   -> verifyResult with passed=false  |
|    |      and error message (verify)      |
|    |   -> flagResult with correct=false   |
|    |      and error message (flag)        |
|    |   -> showError notification (start)  |
+-------------------------------------------+
```

## CSS Architecture

### CSS Variables Used by ScenarioPanel

```
Layout & Spacing:
  --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-2xl

Colors:
  --color-bg-primary         (panel background)
  --color-bg-secondary       (header, progress bar background)
  --color-bg-tertiary        (code blocks, output background)
  --color-border-light       (borders)
  --color-border-medium      (input borders)
  --color-text-primary       (headings, primary text)
  --color-text-secondary     (body text)
  --color-text-muted         (labels, placeholders)
  --color-primary            (verify button, links, active dot)
  --color-primary-hover      (button hover)
  --color-primary-light      (active dot glow)
  --color-white              (button text)
  --color-success            (passed state, completed dot, trophy)
  --color-success-bg         (passed background)
  --color-success-border     (passed border)
  --color-success-text       (passed text)
  --color-danger             (failed state, abandon button)
  --color-danger-bg          (failed background)
  --color-danger-border      (failed border)
  --color-danger-text        (failed text)
  --color-danger-hover       (abandon hover)
  --color-warning            (hint icon)
  --color-warning-bg         (hint background)
  --color-warning-border     (hint border)
  --color-warning-text       (hint text)
  --color-surface-hover      (button hover background)
  --color-gray-300           (locked dot)

Typography:
  --font-size-xs, --font-size-sm, --font-size-md, --font-size-lg, --font-size-2xl
  --font-weight-medium, --font-weight-semibold
  --font-family-monospace    (code, flag input, output)
  --line-height-normal, --line-height-relaxed

Borders & Radius:
  --border-width-thin, --border-width-medium
  --border-radius-sm, --border-radius-md, --border-radius-full

Effects:
  --shadow-xs, --shadow-sm, --shadow-focus-primary
  --transition-fast, --transition-slow
```

### Responsive Breakpoints

```
Desktop (default):
  .scenario-panel { width: 350px; min-width: 350px; }

Tablet (max-width: 768px):
  .scenario-panel { width: 280px; min-width: 280px; }

Mobile (max-width: 480px):
  .scenario-panel {
    width: 100%; min-width: 100%;
    position: absolute; top: 0; right: 0; bottom: 0;
    z-index: 20;
  }
```

### Key Animations

```css
/* Active step progress dot pulse */
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-primary-light); }
  50% { box-shadow: 0 0 0 5px var(--color-primary-light); }
}
```

### Panel Collapse Behavior

- Panel width transitions from 350px to 0 using `transition: width var(--transition-slow), min-width var(--transition-slow)`
- Toggle button repositions from `left: -18px` to `left: -36px` when collapsed
- Collapse state persisted in `localStorage` under key `scenario_panel_collapsed`
