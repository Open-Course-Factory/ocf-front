/**
 * The prompts handed to a teacher's AI assistant, and the reading of its answer.
 *
 * The prompt is the whole contract an assistant sees: if it leaves out a field
 * or an encoding the importer insists on, every answer comes back refused. The
 * example inside it is what assistants copy most faithfully, so it must itself
 * be a file the importer accepts — the shape check below mirrors ocf-core's
 * SeedScenarioInput and the quiz rules of scenarioContentValidation.go.
 */
import { describe, it, expect } from 'vitest'
import {
  BANNER_EFFECTS,
  EXAMPLE_SCENARIOS,
  buildCreatePrompt,
  buildImprovePrompt,
  buildFixPrompt,
  extractJsonObject,
  summarizeScenarioChanges,
  type ScenarioAiBrief
} from '../../src/utils/scenarioAiPrompt'

// The JSON keys of ocf-core's SeedScenarioInput, SeedStepInput and SeedQuestionInput.
const SCENARIO_KEYS = [
  'title', 'description', 'difficulty', 'estimated_time_minutes', 'instance_type', 'hostname', 'os_type',
  'flags_enabled', 'allowed_flag_paths', 'crash_traps', 'port_exposure_allowed', 'session_user', 'is_public',
  'intro_text', 'finish_text', 'setup_script', 'objectives', 'prerequisites', 'default_locale', 'locales',
  'compatible_instance_types', 'required_features', 'build_features', 'translations', 'lexicon', 'steps'
]
const STEP_KEYS = [
  'title', 'step_type', 'show_immediate_feedback', 'text_content', 'hint_content', 'verify_script',
  'background_script', 'foreground_script', 'intro_effect', 'intro_text', 'outro_effect', 'outro_text',
  'background_timeout_seconds', 'background_async', 'has_flag', 'flag_path', 'flag_level', 'questions', 'translations'
]
const QUESTION_KEYS = ['order', 'question_text', 'question_type', 'options', 'correct_answer', 'explanation', 'points']

/** What the importer would refuse in a quiz question, mirroring questionProblem in ocf-core. */
function questionProblem(q: any): string {
  if (q.question_type === 'multiple_choice' || q.question_type === 'multi_answer') {
    const options = JSON.parse(q.options)
    if (!Array.isArray(options) || options.length < 2) return 'options'
    if (q.question_type === 'multiple_choice') {
      const index = Number(q.correct_answer)
      return String(index) === q.correct_answer && index >= 0 && index < options.length ? '' : 'answer'
    }
    const indexes = JSON.parse(q.correct_answer)
    const sorted = [...new Set(indexes as number[])].sort((a, b) => a - b)
    return JSON.stringify(sorted) === q.correct_answer && sorted[sorted.length - 1] < options.length ? '' : 'answer'
  }
  if (q.question_type === 'true_false') return ['true', 'false'].includes(q.correct_answer) ? '' : 'answer'
  if (q.question_type === 'free_text') return q.correct_answer?.trim() ? '' : 'answer'
  return 'type'
}

const brief: ScenarioAiBrief = {
  description: 'Teach nginx: install it, serve a page, read the access log.',
  language: 'fr',
  level: 'intermediate',
  stepCount: 5,
  stepTypes: ['terminal', 'quiz']
}

/** Every key at every depth, with arrays reduced to their items' keys: the shape a file has. */
function shape(value: any): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, shape(value[k])]))
  return typeof value
}

describe.each(['en', 'fr'] as const)('EXAMPLE_SCENARIOS.%s', language => {
  const example = EXAMPLE_SCENARIOS[language]

  it('uses only fields the importer knows, at every level', () => {
    expect(Object.keys(example).filter(k => !SCENARIO_KEYS.includes(k))).toEqual([])
    for (const step of example.steps as any[]) {
      expect(Object.keys(step).filter(k => !STEP_KEYS.includes(k))).toEqual([])
      for (const q of step.questions || []) {
        expect(Object.keys(q).filter(k => !QUESTION_KEYS.includes(k))).toEqual([])
      }
    }
  })

  it('is a scenario the importer accepts: titled steps of known types, no dead-end quiz, well-encoded answers', () => {
    expect(example.title.trim()).not.toBe('')
    expect(example.hostname).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)
    for (const step of example.steps as any[]) {
      expect(step.title.trim()).not.toBe('')
      expect(['terminal', 'flag', 'quiz', 'info']).toContain(step.step_type)
      if (step.step_type === 'quiz') expect(step.questions.length).toBeGreaterThan(0)
      for (const q of step.questions || []) expect(questionProblem(q), q.question_text).toBe('')
    }
  })

  it('shows both choice encodings and a flag placed from OCF_FLAG_CURRENT', () => {
    const questions = (example.steps as any[]).flatMap(s => s.questions || [])
    expect(questions.map(q => q.question_type)).toEqual(expect.arrayContaining(['multiple_choice', 'multi_answer']))
    const flagStep = (example.steps as any[]).find(s => s.step_type === 'flag')
    expect(flagStep.background_script).toContain('unset OCF_FLAG_CURRENT')
    expect(flagStep.verify_script).toBeUndefined()
  })

  it('is written in its own language and splits its hints the way the importer does', () => {
    expect(example.default_locale).toBe(language)
    expect(example.locales).toEqual([language])
    const heading = language === 'fr' ? '### Indice 1' : '### Hint 1'
    for (const step of example.steps as any[]) if (step.hint_content) expect(step.hint_content).toContain(heading)
  })

  it('has exactly the English example\'s shape and encodings: only the learner-facing text differs', () => {
    expect(shape(example)).toEqual(shape(EXAMPLE_SCENARIOS.en))
    const encodings = (s: any) => s.steps.flatMap((st: any) => (st.questions || []).map((q: any) => [q.question_type, q.correct_answer]))
    expect(encodings(example)).toEqual(encodings(EXAMPLE_SCENARIOS.en))
  })

  it('survives the round trip through the prompt, whatever language the instructions are in', () => {
    for (const promptLanguage of ['en', 'fr'] as const) {
      const prompt = buildCreatePrompt({ ...brief, language }, null, promptLanguage)
      const exampleBlock = prompt.slice(prompt.indexOf('```json'))
      expect(extractJsonObject(exampleBlock)).toEqual({ ok: true, value: example })
    }
  })
})

/**
 * The tokens the importer reads, as a prompt mentions them: quoted field
 * names and enum values, snake_case names, OCF_ variables, flag paths and the
 * answer encodings. Both languages must name exactly the same ones.
 */
function contractTokens(text: string): string[] {
  const tokens = [
    ...[...text.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)"/g)].map(m => `"${m[1]}"`),
    ...(text.match(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g) || []),
    ...(text.match(/\bOCF_[A-Z_]+\b/g) || []),
    ...(text.match(/\/(?:tmp|home|var|opt)\//g) || []),
    ...(text.match(/"\[0,2\]"|```\{\{(?:exec|copy)\}\}|exit 0|set -u|#!\/bin\/bash|10/g) || []),
  ]
  return [...new Set(tokens)].sort()
}

describe('the prompt in French and in English', () => {
  const catalog = {
    distributions: [{ name: 'debian-12', os_type: 'deb', min_size_key: 'S', supported_features: ['network'] }],
    sizes: [{ key: 'S', name: 'Small', memory: '1GB', disk: '10GB' }],
    features: [{ key: 'docker', name: 'Docker', min_size_key: 'M', always_available: true }]
  }

  it.each([false, true])('states every contract rule in both languages, step effects %s: the same field names, enum values and encodings', (effects) => {
    const create = (l: 'en' | 'fr') => buildCreatePrompt({ ...brief, language: 'en' }, catalog, l, { effects })
    expect(contractTokens(create('fr'))).toEqual(contractTokens(create('en')))
    const improve = (l: 'en' | 'fr') => buildImprovePrompt('x', { title: 'T', steps: [] }, catalog, l, { effects })
    expect(contractTokens(improve('fr'))).toEqual(contractTokens(improve('en')))
  })

  // Step banners are behind the scenario_step_effects flag: off (the default),
  // the prompt does not advertise them; the importer still accepts them.
  it('asks for step effects only when they are offered', () => {
    for (const lang of ['en', 'fr'] as const) {
      const off = buildCreatePrompt(brief, catalog, lang)
      expect(off).not.toContain('intro_effect')
      expect(off).not.toContain('"outro_text"')
      const on = buildCreatePrompt(brief, catalog, lang, { effects: true })
      expect(on).toContain('intro_effect')
      expect(on).toContain('"outro_text"')
      for (const effect of BANNER_EFFECTS) expect(on).toContain(effect)
    }
  })

  it('names enough of the contract for the comparison to mean something', () => {
    const tokens = contractTokens(buildCreatePrompt(brief, catalog, 'en'))
    for (const token of ['"title"', '"step_type"', '"multi_answer"', '"true_false"', 'verify_script', 'flag_path', 'OCF_FLAG_CURRENT', 'OCF_ANSWER', '/opt/', '"[0,2]"', '"network"'])
      expect(tokens).toContain(token)
  })

  it('writes the instructions in French with vouvoiement, and the content language separately', () => {
    const prompt = buildCreatePrompt({ ...brief, language: 'en' }, null, 'fr')
    expect(prompt).toContain('Vous êtes un formateur Linux expert')
    expect(prompt).toContain('Langue du contenu : anglais')
    expect(prompt).toContain('"default_locale": "en"')
    expect(prompt).toContain('Répondez uniquement avec l\'objet JSON')
    expect(prompt).not.toContain('You are an expert')
    expect(extractJsonObject(prompt.slice(prompt.indexOf('```json')))).toEqual({ ok: true, value: EXAMPLE_SCENARIOS.en })
  })

  it('translates the catalogue section and its fallbacks', () => {
    expect(buildCreatePrompt(brief, catalog, 'fr')).toContain('- "docker" Docker (taille minimale "M"; fonctionne sur toutes les distributions)')
    expect(buildCreatePrompt(brief, null, 'fr')).toContain('la seule sur laquelle compter est "network"')
  })

  it('writes the fix-up prompt in either language, the server\'s problems unchanged', () => {
    const problems = ['step 2 (Quiz), question 1: correct_answer "4" is not an option index']
    const fr = buildFixPrompt(problems, 'fr')
    expect(fr).toContain('La plateforme a refusé votre JSON')
    expect(fr).toContain(`- ${problems[0]}`)
    expect(buildFixPrompt(problems, 'en')).toContain('The platform refused your JSON')
  })
})

describe('buildCreatePrompt', () => {
  it('carries the teacher\'s description, the content language and the brief', () => {
    const prompt = buildCreatePrompt(brief, null, 'en')
    expect(prompt).toContain(brief.description)
    expect(prompt).toContain('Content language: French')
    expect(prompt).toContain('"default_locale": "fr"')
    expect(prompt).toContain('"difficulty": "intermediate"')
    expect(prompt).toContain('About 5 steps, using these step types: terminal, quiz.')
  })

  it('states the encodings the importer refuses most often', () => {
    const prompt = buildCreatePrompt(brief, null, 'en')
    expect(prompt).toContain('ENCODED AS A STRING')
    expect(prompt).toContain('0-based index as a string')
    expect(prompt).toContain('"[0,2]"')
    expect(prompt).toContain('OCF_FLAG_CURRENT')
    expect(prompt).toContain('OCF_ANSWER:')
    expect(prompt).toContain('Exit code 0 means the step is passed')
    expect(prompt).toContain('### Hint 1')
    expect(prompt).toMatch(/single ```json code block/)
  })

  it('lists the platform\'s distributions and sizes when it has them', () => {
    const prompt = buildCreatePrompt(brief, {
      distributions: [{ name: 'debian-12', os_type: 'deb', supported_features: ['network', 'docker'] }],
      sizes: [{ key: 'S', name: 'Small', memory: '1GB' }, { key: 'M', name: 'Medium', memory: '2GB' }],
      features: [
        { key: 'network', name: 'Network Access', description: 'Provides outbound internet access' },
        { key: 'docker', name: 'Docker', min_size_key: 'M' },
        { key: 'effects', name: 'Terminal Effects', always_available: true }
      ]
    }, 'en')
    expect(prompt).toContain('- "debian-12" (os_type "deb"; features: network, docker)')
    expect(prompt).toContain('- "M" Medium (2GB RAM)')
    expect(prompt).toContain('- "network" Network Access — Provides outbound internet access')
    expect(prompt).toContain('- "docker" Docker (minimum size "M")')
    expect(prompt).toContain('- "effects" Terminal Effects (works on every distribution)')
    expect(prompt).not.toContain('list is not available')
  })

  it('falls back to the network feature alone when the feature list could not be read', () => {
    const prompt = buildCreatePrompt(brief, { distributions: [{ name: 'debian-12' }], sizes: [{ key: 'S' }], features: [] }, 'en')
    expect(prompt).toContain('The feature list is not available: the only feature to rely on is "network".')
    expect(prompt).not.toContain('The size list is not available')
  })

  it('falls back to Debian and size S when the catalog could not be read', () => {
    const prompt = buildCreatePrompt(brief, null, 'en')
    expect(prompt).toContain('use os_type "deb"')
    expect(prompt).toContain('use instance_type "S"')
  })

  it('asks for every step type when the teacher ticked none', () => {
    expect(buildCreatePrompt({ ...brief, stepTypes: [] }, null, 'en')).toContain('step types: terminal, flag, quiz, info.')
  })
})

describe('buildImprovePrompt', () => {
  it('sends the current scenario, the instruction, and asks for the full JSON with the title kept', () => {
    const current = { title: 'Mon TP', steps: [{ title: 'Étape 1', step_type: 'info' }] }
    const prompt = buildImprovePrompt('Traduis-le en anglais', current, null, 'en')
    expect(prompt).toContain('Traduis-le en anglais')
    expect(prompt).toContain(JSON.stringify(current, null, 2))
    expect(prompt).toContain('Return the FULL updated scenario')
    expect(prompt).toContain('Do NOT change "title"')
  })
})

describe('buildFixPrompt', () => {
  it('hands every problem back, one per line, and asks for the full corrected JSON', () => {
    const prompt = buildFixPrompt(['step 2 (Quiz), question 1: correct_answer "4" is not an option index', 'title is empty'], 'en')
    expect(prompt).toContain('- step 2 (Quiz), question 1: correct_answer "4" is not an option index\n- title is empty')
    expect(prompt).toContain('full corrected JSON')
  })
})

describe('extractJsonObject', () => {
  const scenario = { title: 'Lab', steps: [{ title: 'One', text_content: '```\nls\n```{{exec}}' }] }

  it('reads a bare JSON answer', () => {
    expect(extractJsonObject(JSON.stringify(scenario))).toEqual({ ok: true, value: scenario })
  })

  it('reads JSON inside a ```json fence surrounded by prose', () => {
    const answer = `Sure! Here is your lab:\n\n\`\`\`json\n${JSON.stringify(scenario, null, 2)}\n\`\`\`\n\nLet me know if you want changes {or more steps}.`
    expect(extractJsonObject(answer)).toEqual({ ok: true, value: scenario })
  })

  it('skips braces in a bash block before the json fence', () => {
    const answer = `First run:\n\`\`\`bash\nfor f in {a,b}; do echo $f; done\n\`\`\`\nThen import:\n\`\`\`json\n${JSON.stringify(scenario)}\n\`\`\``
    expect(extractJsonObject(answer)).toEqual({ ok: true, value: scenario })
  })

  it('is not fooled by ``` and braces inside the JSON strings', () => {
    const tricky = { title: 'a } b', steps: [{ title: 'x', text_content: 'say "}" then ```{{copy}}' }] }
    expect(extractJsonObject(`\`\`\`json\n${JSON.stringify(tricky)}\n\`\`\``)).toEqual({ ok: true, value: tricky })
  })

  it('reads an untagged fence too', () => {
    expect(extractJsonObject(`\`\`\`\n${JSON.stringify(scenario)}\n\`\`\``)).toEqual({ ok: true, value: scenario })
  })

  it('reports a truncated answer as invalid JSON, with the parser\'s reason', () => {
    const result = extractJsonObject('```json\n{"title": "Lab", "steps": [')
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({ reason: 'invalid' })
    expect((result as any).detail).toBeTruthy()
  })

  it('reports an answer with no object, an empty answer and a bare array', () => {
    expect(extractJsonObject('I cannot help with that.')).toEqual({ ok: false, reason: 'no_object' })
    expect(extractJsonObject('   \n')).toEqual({ ok: false, reason: 'empty' })
    expect(extractJsonObject('[1, 2]')).toEqual({ ok: false, reason: 'no_object' })
  })
})

describe('summarizeScenarioChanges', () => {
  const before = { title: 'Lab', steps: [{ title: 'A' }, { title: 'B' }] }

  it('counts steps and names the ones added and removed', () => {
    const after = { title: 'Lab', steps: [{ title: 'A' }, { title: 'C' }, { title: 'D' }] }
    expect(summarizeScenarioChanges(before, after)).toEqual({
      stepsBefore: 2, stepsAfter: 3, addedSteps: ['C', 'D'], removedSteps: ['B'], titleChanged: false
    })
  })

  it('flags a changed title, ignoring surrounding spaces', () => {
    expect(summarizeScenarioChanges(before, { ...before, title: ' Lab ' }).titleChanged).toBe(false)
    expect(summarizeScenarioChanges(before, { ...before, title: 'Lab (English)' }).titleChanged).toBe(true)
  })

  it('treats a missing steps list as no steps', () => {
    expect(summarizeScenarioChanges(before, { title: 'Lab' })).toMatchObject({ stepsAfter: 0, removedSteps: ['A', 'B'] })
  })
})
