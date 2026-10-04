/**
 * Prompts for authoring a scenario with the teacher's own AI assistant.
 *
 * No model runs on our side: the teacher copies a prompt into whatever chat
 * assistant they use, and pastes its answer back. The answer is imported as is
 * through import-json, so everything the assistant needs to produce a file the
 * importer accepts first time has to be in the prompt — the shape, the
 * encodings the validator insists on, and how the platform runs each script.
 *
 * The contract below mirrors ocf-core's SeedScenarioInput
 * (src/scenarios/dto/scenarioCustomDto.go) and the import validator
 * (src/scenarios/services/scenarioContentValidation.go). A change to either
 * must be made here too, or assistants will keep writing files the server
 * refuses. The validator's refusals are pasted back to the assistant verbatim
 * (buildFixPrompt), so a drift costs a round trip rather than a broken
 * scenario.
 */

export type ScenarioAiStepType = 'terminal' | 'flag' | 'quiz' | 'info'
export type ScenarioAiLevel = 'beginner' | 'intermediate' | 'advanced'
export type ScenarioAiLanguage = 'fr' | 'en'

export const SCENARIO_AI_STEP_TYPES: ScenarioAiStepType[] = ['terminal', 'flag', 'quiz', 'info']

// Effect names accepted by ocf-banner in the container, for the step editor
// and the prompt alike. Kept in step with the tool rather than invented here:
// an unknown name draws nothing, and the failure is silent from the trainer's
// side.
export const BANNER_EFFECTS = ['decrypt', 'slide', 'unstable', 'fireworks', 'burn', 'rings', 'beams', 'matrix', 'rain'] as const

/**
 * What the platform can run, as GET /terminals/distributions, /terminals/sizes
 * and /terminals/catalog-features report it. An empty list means it could not
 * be read, and the prompt falls back to safe defaults for that part.
 */
export interface ScenarioAiCatalog {
  distributions: Array<{ name: string; description?: string; os_type?: string; min_size_key?: string; supported_features?: string[] }>
  sizes: Array<{ key: string; name?: string; memory?: string; disk?: string }>
  features?: Array<{ key: string; name?: string; description?: string; min_size_key?: string; always_available?: boolean }>
}

export interface ScenarioAiBrief {
  description: string
  language: ScenarioAiLanguage
  level: ScenarioAiLevel
  stepCount: number
  stepTypes: ScenarioAiStepType[]
}

const LANGUAGE_NAMES: Record<ScenarioAiLanguage, string> = { fr: 'French', en: 'English' }

const CONTRACT = `## The JSON format

Answer with ONE JSON object. Every field not marked required may be left out.

Scenario fields:
- "title" (required, string): the scenario's name. It also identifies the scenario: importing a file with the same title again updates that scenario instead of creating a new one.
- "description" (string): one or two sentences for the catalogue card.
- "difficulty": "beginner", "intermediate" or "advanced".
- "estimated_time_minutes" (integer).
- "instance_type" (string): the machine SIZE key, e.g. "S" or "M" — not an operating system.
- "compatible_instance_types" (array of strings): the distribution names this scenario is written for, most preferred first.
- "os_type" (string): "deb" for Debian/Ubuntu, "alpine" for Alpine. Must match the distribution.
- "hostname" (string): the terminal's host name, lowercase letters, digits and hyphens only.
- "required_features" (array of strings): session features the scenario cannot run without, e.g. ["network"] when a script installs packages or downloads anything. Without "network" the container has NO network at all.
- "build_features" (array of strings): features held only while the container is being prepared, then removed — e.g. ["network"] to install packages in setup_script while the learner works offline.
- "flags_enabled" (boolean): true when the scenario has flag steps.
- "crash_traps" (boolean): leave false.
- "port_exposure_allowed" (boolean): true only if the learner must publish a web port.
- "session_user" (integer uid): leave out — the learner is then root. Set it (e.g. 1000) only when the lesson is about permissions, and create that user in setup_script.
- "intro_text" (markdown): shown before step 1.
- "finish_text" (markdown): shown after the last step.
- "setup_script" (bash): runs once as root when the container is created, before step 1.
- "objectives" (markdown list), "prerequisites" (markdown list): shown on the catalogue card.
- "default_locale" (string): the language every text field above is written in, e.g. "fr" or "en".
- "locales" (array of strings): every language the scenario is offered in, default_locale included.
- "translations" (array): the scenario's own text in other languages: [{"locale", "title", "description", "objectives", "prerequisites", "intro_text", "finish_text"}]. At most one entry per locale.
- "lexicon": an advanced vocabulary table. Never add one; keep it unchanged when the scenario already has it.
- "steps" (required, array, at least one): the steps, in the order the learner plays them. Do not number them.

Step fields:
- "title" (required, string).
- "step_type" (required): "terminal", "flag", "quiz" or "info".
- "text_content" (markdown): the instructions. A fenced code block whose closing fence is written \`\`\`{{exec}} becomes a block the learner clicks to run it in the terminal; \`\`\`{{copy}} makes it click-to-copy. Inline \`command\`{{exec}} works too.
- "hint_content" (markdown): progressive hints, revealed one by one. Write two or more, each under its own heading "### Hint 1", "### Hint 2", … (in French, "### Indice 1", …). The first nudges, the last nearly gives the answer.
- "verify_script" (bash): terminal steps only. See the rules below.
- "background_script" (bash): runs as root when the learner reaches the step, before they see it. Prepares that step's situation.
- "background_timeout_seconds" (integer): leave out unless a background script needs more than a minute.
- "foreground_script": leave out. It is typed into the learner's live shell.
- "intro_effect", "outro_effect": leave out unless asked; otherwise one of ${BANNER_EFFECTS.join(', ')}. "intro_text", "outro_text": the banner's words (max 500 characters).
- "show_immediate_feedback" (boolean): quiz steps — true shows right/wrong after each answer.
- "flag_path" (string): flag steps only. See the flag rules below.
- "questions" (array): quiz steps only, at least one. See the quiz rules below.
- "translations" (array): this step's text in other languages: [{"locale", "title", "text_content", "hint_content", "intro_text", "outro_text"}]. At most one entry per locale. Scripts are never translated.

Never include ids, "order" on steps, an organization, "is_public" or any flag value.`

const RULES = `## How the platform runs a scenario

The learner gets ONE Linux container (an LXC system container) and a root shell in it. There is no second machine: to teach something with several machines, run Docker inside the container (size "M" or larger, network required, and the setup script installs Docker).

### Terminal steps
- The learner clicks Verify. The verify_script then runs as root in the container, with a 10-second limit. Exit code 0 means the step is passed; anything else means "not yet".
- Check the RESULT, never the command typed: test that the file exists with the right content, the service is active, the user exists, the port answers. Never read shell history.
- Make it idempotent and read-only: running it ten times must change nothing in the container.
- On failure, print ONE short line to stderr telling the learner what is still missing (it is shown to them), in the content language. Example: \`[ -d /srv/app ] || { echo "The directory /srv/app does not exist yet." >&2; exit 1; }\`
- Start each script with #!/bin/bash and use \`set -u\`, not \`set -e\`, in verify scripts.
- A terminal step with no verify_script is passed by clicking Verify: use that only for "try this" steps.

### Flag steps (step_type "flag")
- The platform generates a secret flag per learner and per step. The learner must find it in the container and paste it.
- Either set "flag_path" to an absolute path under /tmp/, /home/, /var/ or /opt/: the platform writes the flag there (one line) when the step starts — the step's text then explains how to find or read it (e.g. it is in a file only a certain user can read).
- Or leave flag_path out and place it yourself in the step's background_script, which receives the flag in the environment variable OCF_FLAG_CURRENT. Read it, unset it immediately, then hide it: \`FLAG="$OCF_FLAG_CURRENT"; unset OCF_FLAG_CURRENT; echo "$FLAG" > /var/lib/app/secret.txt\`. Never leave it in a running process's environment.
- A background script may instead decide the answer itself by printing a line "OCF_ANSWER: <answer>" — use that when the answer is something the learner must compute (e.g. "how many lines contain ERROR?" after generating a random log).
- Flag steps have no verify_script. Set "flags_enabled": true on the scenario.

### Quiz steps (step_type "quiz")
- Each question: {"order": 1, "question_text": "...", "question_type": "...", "options": "...", "correct_answer": "...", "explanation": "...", "points": 1}.
- "options" is a JSON array of strings ENCODED AS A STRING: "options": "[\\"ls\\", \\"cd\\", \\"pwd\\"]". At least 2 options.
- "multiple_choice": one right option; correct_answer is its 0-based index as a string: "0", "1", …
- "multi_answer": several right options; correct_answer is the sorted index array without spaces, as a string: "[0,2]".
- "true_false": no options; correct_answer is "true" or "false".
- "free_text": no options; correct_answer is the exact expected text, kept short (one word or one command).
- "explanation" says why the answer is right; it is shown after answering.

### Info steps (step_type "info")
- Text only, nothing to verify. Use them sparingly, for context between practical steps.

### General
- Keep the learner's container usable: never break the shell, sudo, networking or the package manager unless that IS the exercise, and never reboot or kill PID 1.
- The distribution images are minimal: do not assume python3, curl, nginx or any other tool is installed. Install what the lab needs in setup_script, with "network" in build_features (or in required_features if the learner needs the network too).
- Scripts run non-interactively: use apt-get -y, no prompts, no editors.
- Each step's background_script must work on its own: it may run on a fresh container where earlier steps were skipped, so create whatever it needs rather than assuming the learner did it.
- Write every text field (titles, text_content, hints, explanations, verify messages, intro and finish) in the content language. JSON keys and code stay in English.`

/**
 * A complete small scenario the importer accepts, shown to the assistant as
 * the model answer. One step of each kind that needs encoding care: a terminal
 * step with a verify script, a quiz with both answer encodings, and a flag
 * step that places its own flag.
 */
export const EXAMPLE_SCENARIO = {
  title: 'Files and permissions: first steps',
  description: 'Create a directory, read a protected file and check what you learned.',
  difficulty: 'beginner',
  estimated_time_minutes: 15,
  instance_type: 'S',
  os_type: 'deb',
  hostname: 'lab',
  flags_enabled: true,
  crash_traps: false,
  default_locale: 'en',
  locales: ['en'],
  objectives: '- Create directories and files\n- Read file permissions',
  prerequisites: '- Open a terminal',
  intro_text: 'You are root on a fresh Debian machine called **lab**.',
  finish_text: 'Well done: you can now create files and read permissions.',
  steps: [
    {
      title: 'Create a project directory',
      step_type: 'terminal',
      text_content: 'Create the directory `/srv/project` and, inside it, a file `README` containing the word `hello`.\n\n```\nmkdir -p /srv/project\necho hello > /srv/project/README\n```{{exec}}',
      hint_content: '### Hint 1\nThe `mkdir` command creates directories; `-p` creates the parents too.\n\n### Hint 2\n`echo hello > /srv/project/README` writes the file.',
      verify_script: '#!/bin/bash\nset -u\n[ -d /srv/project ] || { echo "The directory /srv/project does not exist yet." >&2; exit 1; }\ngrep -qx hello /srv/project/README 2>/dev/null || { echo "/srv/project/README must contain the word hello." >&2; exit 1; }\nexit 0'
    },
    {
      title: 'Permissions quiz',
      step_type: 'quiz',
      show_immediate_feedback: true,
      text_content: 'Answer these questions about `ls -l` output.',
      questions: [
        {
          order: 1,
          question_text: 'In `-rw-r----- 1 root adm`, who may read the file?',
          question_type: 'multi_answer',
          options: '["root", "members of adm", "everyone"]',
          correct_answer: '[0,1]',
          explanation: 'The owner (root) has rw-, the group (adm) has r--, others have ---.',
          points: 1
        },
        {
          order: 2,
          question_text: 'Which command changes a file\'s permissions?',
          question_type: 'multiple_choice',
          options: '["chown", "chmod", "umask"]',
          correct_answer: '1',
          explanation: 'chmod changes the mode; chown changes the owner.',
          points: 1
        }
      ]
    },
    {
      title: 'Find the hidden flag',
      step_type: 'flag',
      text_content: 'A flag is hidden in a dot-file somewhere under `/opt/vault`. Find it, read it, and paste it below.',
      hint_content: '### Hint 1\n`ls` hides files whose name starts with a dot.\n\n### Hint 2\n`ls -la /opt/vault` shows them; then `cat` the file.',
      background_script: '#!/bin/bash\nFLAG="$OCF_FLAG_CURRENT"\nunset OCF_FLAG_CURRENT\nmkdir -p /opt/vault\necho "$FLAG" > /opt/vault/.secret\nchmod 600 /opt/vault/.secret'
    }
  ]
}

function catalogSection(catalog?: ScenarioAiCatalog | null): string {
  const lines = ['## What this platform can run']
  if (catalog?.distributions.length) {
    lines.push('Distributions (use these exact names in compatible_instance_types):')
    for (const d of catalog.distributions) {
      const extras = [
        d.os_type && `os_type "${d.os_type}"`,
        d.min_size_key && `minimum size "${d.min_size_key}"`,
        d.supported_features?.length && `features: ${d.supported_features.join(', ')}`
      ].filter(Boolean).join('; ')
      lines.push(`- "${d.name}"${d.description ? ` — ${d.description}` : ''}${extras ? ` (${extras})` : ''}`)
    }
  } else {
    lines.push('The distribution list is not available: leave compatible_instance_types out and use os_type "deb" (Debian).')
  }
  if (catalog?.sizes.length) {
    lines.push('Sizes (use the key in instance_type; pick the smallest that fits):')
    for (const s of catalog.sizes) {
      const specs = [s.memory && `${s.memory} RAM`, s.disk && `${s.disk} disk`].filter(Boolean).join(', ')
      lines.push(`- "${s.key}"${s.name ? ` ${s.name}` : ''}${specs ? ` (${specs})` : ''}`)
    }
  } else {
    lines.push('The size list is not available: use instance_type "S", or "M" for anything that runs Docker.')
  }
  if (catalog?.features?.length) {
    lines.push('Features (use these exact keys in required_features and build_features; a feature with a minimum size needs instance_type at least that size, and a distribution offers only the features listed for it unless the feature works everywhere):')
    for (const f of catalog.features) {
      const extras = [
        f.min_size_key && `minimum size "${f.min_size_key}"`,
        f.always_available && 'works on every distribution'
      ].filter(Boolean).join('; ')
      const about = [f.name, f.description].filter(Boolean).join(' — ')
      lines.push(`- "${f.key}"${about ? ` ${about}` : ''}${extras ? ` (${extras})` : ''}`)
    }
  } else {
    lines.push('The feature list is not available: the only feature to rely on is "network".')
  }
  return lines.join('\n')
}

const ANSWER_FORMAT = 'Answer with the JSON object only, in a single ```json code block, with no text before or after it.'

/** The prompt that asks an assistant to write a new scenario from the teacher's description. */
export function buildCreatePrompt(brief: ScenarioAiBrief, catalog?: ScenarioAiCatalog | null): string {
  const language = LANGUAGE_NAMES[brief.language]
  const types = brief.stepTypes.length ? brief.stepTypes : SCENARIO_AI_STEP_TYPES
  return [
    'You are an expert Linux trainer writing a hands-on lab for the Open Course Factory platform. The lab is imported as a JSON file, which the platform checks strictly: follow the format and rules below exactly.',
    `## The lab to write

${brief.description.trim()}

- Content language: ${language}. Write every title, text, hint, question, explanation and verify message in ${language}; set "default_locale": "${brief.language}" and "locales": ["${brief.language}"].
- Level: ${brief.level} (set "difficulty": "${brief.level}").
- About ${brief.stepCount} steps, using these step types: ${types.join(', ')}.`,
    CONTRACT,
    RULES,
    catalogSection(catalog),
    `## A complete example of a valid answer

\`\`\`json
${JSON.stringify(EXAMPLE_SCENARIO, null, 2)}
\`\`\``,
    `## Your answer

Before answering, check every verify script against the rules (exit 0 on success, checks results, idempotent) and every quiz answer against its options. ${ANSWER_FORMAT}`
  ].join('\n\n')
}

/** The prompt that asks an assistant to change an existing scenario, given as its JSON export. */
export function buildImprovePrompt(instruction: string, scenario: unknown, catalog?: ScenarioAiCatalog | null): string {
  return [
    'You are an expert Linux trainer improving a hands-on lab for the Open Course Factory platform. The lab is a JSON file, which the platform checks strictly when it is imported back: follow the format and rules below exactly.',
    `## What to change

${instruction.trim()}

Keep everything the request does not ask you to change exactly as it is, including scripts and fields you do not understand. Do NOT change "title": it identifies the scenario, and a new title would create a separate copy. To translate, add a "translations" entry (and the locale to "locales") instead of rewriting the original text.`,
    CONTRACT,
    RULES,
    catalogSection(catalog),
    `## The current scenario

\`\`\`json
${JSON.stringify(scenario, null, 2)}
\`\`\``,
    `## Your answer

Return the FULL updated scenario — every step, not only the changed ones. ${ANSWER_FORMAT}`
  ].join('\n\n')
}

/** The follow-up that hands the importer's refusals back to the assistant. */
export function buildFixPrompt(problems: string[]): string {
  return [
    'The platform refused your JSON with these problems:',
    problems.map(p => `- ${p}`).join('\n'),
    `Fix every one of them and change nothing else. Answer with the full corrected JSON. ${ANSWER_FORMAT}`
  ].join('\n\n')
}

export type JsonExtraction =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'empty' | 'no_object' | 'invalid'; detail?: string }

/**
 * Finds the scenario in an assistant's answer. Assistants wrap JSON in prose
 * and code fences however they are asked, so this takes the first balanced
 * {...} — after a ```json fence when there is one, since the prose or a bash
 * block before it may hold braces of its own.
 *
 * The fence's closing ``` is never searched for: the scenario's own markdown
 * holds ``` inside its strings (```{{exec}} blocks), and the brace scanner
 * already knows where the object ends.
 */
export function extractJsonObject(text: string): JsonExtraction {
  if (!text.trim()) return { ok: false, reason: 'empty' }
  const fence = /```json[^\n]*\n/i.exec(text)
  const candidate = firstBalancedObject(fence ? text.slice(fence.index + fence[0].length) : text)
  if (candidate === null) return { ok: false, reason: 'no_object' }
  try {
    const value = JSON.parse(candidate)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'no_object' }
    return { ok: true, value }
  } catch (err) {
    return { ok: false, reason: 'invalid', detail: err instanceof Error ? err.message : String(err) }
  }
}

// The text from the first "{" to the brace that closes it, skipping braces
// inside strings. An unclosed object returns the rest of the text so that
// JSON.parse reports where it is cut, rather than "no JSON found".
function firstBalancedObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1)
  }
  return text.slice(start)
}

export interface ScenarioChangeSummary {
  stepsBefore: number
  stepsAfter: number
  addedSteps: string[]
  removedSteps: string[]
  titleChanged: boolean
}

type StepsCarrier = { title?: unknown; steps?: Array<{ title?: unknown }> }

/** What an improved scenario changes at a glance: the step count, steps added and removed by title, and whether the title moved. */
export function summarizeScenarioChanges(before: StepsCarrier, after: StepsCarrier): ScenarioChangeSummary {
  const titles = (s: StepsCarrier) => (Array.isArray(s.steps) ? s.steps : []).map(step => String(step?.title ?? ''))
  const was = titles(before)
  const now = titles(after)
  return {
    stepsBefore: was.length,
    stepsAfter: now.length,
    addedSteps: now.filter(t => !was.includes(t)),
    removedSteps: was.filter(t => !now.includes(t)),
    titleChanged: String(before.title ?? '').trim() !== String(after.title ?? '').trim()
  }
}
