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
  EXAMPLE_SCENARIO,
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

describe('EXAMPLE_SCENARIO', () => {
  it('uses only fields the importer knows, at every level', () => {
    expect(Object.keys(EXAMPLE_SCENARIO).filter(k => !SCENARIO_KEYS.includes(k))).toEqual([])
    for (const step of EXAMPLE_SCENARIO.steps as any[]) {
      expect(Object.keys(step).filter(k => !STEP_KEYS.includes(k))).toEqual([])
      for (const q of step.questions || []) {
        expect(Object.keys(q).filter(k => !QUESTION_KEYS.includes(k))).toEqual([])
      }
    }
  })

  it('is a scenario the importer accepts: titled steps of known types, no dead-end quiz, well-encoded answers', () => {
    expect(EXAMPLE_SCENARIO.title.trim()).not.toBe('')
    expect(EXAMPLE_SCENARIO.hostname).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)
    for (const step of EXAMPLE_SCENARIO.steps as any[]) {
      expect(step.title.trim()).not.toBe('')
      expect(['terminal', 'flag', 'quiz', 'info']).toContain(step.step_type)
      if (step.step_type === 'quiz') expect(step.questions.length).toBeGreaterThan(0)
      for (const q of step.questions || []) expect(questionProblem(q), q.question_text).toBe('')
    }
  })

  it('shows both choice encodings and a flag placed from OCF_FLAG_CURRENT', () => {
    const questions = (EXAMPLE_SCENARIO.steps as any[]).flatMap(s => s.questions || [])
    expect(questions.map(q => q.question_type)).toEqual(expect.arrayContaining(['multiple_choice', 'multi_answer']))
    const flagStep = (EXAMPLE_SCENARIO.steps as any[]).find(s => s.step_type === 'flag')
    expect(flagStep.background_script).toContain('unset OCF_FLAG_CURRENT')
    expect(flagStep.verify_script).toBeUndefined()
  })

  it('survives the round trip through the prompt: the fenced example parses back to itself', () => {
    const prompt = buildCreatePrompt(brief)
    const exampleBlock = prompt.slice(prompt.indexOf('## A complete example'))
    const extracted = extractJsonObject(exampleBlock)
    expect(extracted).toEqual({ ok: true, value: EXAMPLE_SCENARIO })
  })
})

describe('buildCreatePrompt', () => {
  it('carries the teacher\'s description, the content language and the brief', () => {
    const prompt = buildCreatePrompt(brief)
    expect(prompt).toContain(brief.description)
    expect(prompt).toContain('Content language: French')
    expect(prompt).toContain('"default_locale": "fr"')
    expect(prompt).toContain('"difficulty": "intermediate"')
    expect(prompt).toContain('About 5 steps, using these step types: terminal, quiz.')
  })

  it('states the encodings the importer refuses most often', () => {
    const prompt = buildCreatePrompt(brief)
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
    })
    expect(prompt).toContain('- "debian-12" (os_type "deb"; features: network, docker)')
    expect(prompt).toContain('- "M" Medium (2GB RAM)')
    expect(prompt).toContain('- "network" Network Access — Provides outbound internet access')
    expect(prompt).toContain('- "docker" Docker (minimum size "M")')
    expect(prompt).toContain('- "effects" Terminal Effects (works on every distribution)')
    expect(prompt).not.toContain('list is not available')
  })

  it('falls back to the network feature alone when the feature list could not be read', () => {
    const prompt = buildCreatePrompt(brief, { distributions: [{ name: 'debian-12' }], sizes: [{ key: 'S' }], features: [] })
    expect(prompt).toContain('The feature list is not available: the only feature to rely on is "network".')
    expect(prompt).not.toContain('The size list is not available')
  })

  it('falls back to Debian and size S when the catalog could not be read', () => {
    const prompt = buildCreatePrompt(brief, null)
    expect(prompt).toContain('use os_type "deb"')
    expect(prompt).toContain('use instance_type "S"')
  })

  it('asks for every step type when the teacher ticked none', () => {
    expect(buildCreatePrompt({ ...brief, stepTypes: [] })).toContain('step types: terminal, flag, quiz, info.')
  })
})

describe('buildImprovePrompt', () => {
  it('sends the current scenario, the instruction, and asks for the full JSON with the title kept', () => {
    const current = { title: 'Mon TP', steps: [{ title: 'Étape 1', step_type: 'info' }] }
    const prompt = buildImprovePrompt('Traduis-le en anglais', current)
    expect(prompt).toContain('Traduis-le en anglais')
    expect(prompt).toContain(JSON.stringify(current, null, 2))
    expect(prompt).toContain('Return the FULL updated scenario')
    expect(prompt).toContain('Do NOT change "title"')
  })
})

describe('buildFixPrompt', () => {
  it('hands every problem back, one per line, and asks for the full corrected JSON', () => {
    const prompt = buildFixPrompt(['step 2 (Quiz), question 1: correct_answer "4" is not an option index', 'title is empty'])
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
