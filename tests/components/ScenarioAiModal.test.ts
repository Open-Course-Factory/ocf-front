/**
 * The "with AI" modal: what the teacher sees when the assistant's answer is
 * refused, and what is sent when it is accepted.
 *
 * A refusal must list every problem the importer named, one per line, with a
 * button that copies a follow-up prompt for the assistant — the loop the
 * feature exists for. An improvement must go back to the scenario's own scope
 * and keep its title unless the teacher says otherwise, or the import creates
 * a second scenario instead of updating the first.
 *
 * The scopes are stubbed (one organization, one class); the services are real,
 * with axios at the boundary.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { computed } from 'vue'

const getMock = vi.fn()
const postMock = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => getMock(...args),
    post: (...args: any[]) => postMock(...args),
  },
}))

const ORG = { kind: 'org' as const, id: 'org-1', name: 'Labinux' }
vi.mock('../../src/composables/useScenarioCreateScopes', () => ({
  useScenarioCreateScopes: () => ({
    orgScopes: computed(() => [{ id: ORG.id, name: ORG.name }]),
    groupScopes: computed(() => []),
    platformScopeAvailable: computed(() => false),
    availableCreateScopes: computed(() => [ORG]),
    parseScopeKey: (key: string) => (key === `org:${ORG.id}` ? ORG : null),
    pickDefaultScopeKey: () => `org:${ORG.id}`,
    scopeKeyForScenario: (s: { organization_id?: string }) => (s.organization_id === ORG.id ? `org:${ORG.id}` : ''),
    loadScopeSources: () => Promise.resolve([]),
  }),
}))

import ScenarioAiModal from '../../src/components/ScenarioEditor/ScenarioAiModal.vue'
import { buildFixPrompt } from '../../src/utils/scenarioAiPrompt'

const CURRENT = { title: 'Réseau de base', steps: [{ title: 'Pinguer', step_type: 'terminal' }] }

function mountModal(props: Record<string, unknown>, uiLocale: 'en' | 'fr' = 'en'): VueWrapper {
  return mount(ScenarioAiModal, {
    props: { visible: false, ...props },
    global: {
      plugins: [createI18n({
        legacy: false, locale: uiLocale, fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
    },
  })
}

async function openAndWritePrompt(wrapper: VueWrapper, field: string, text: string) {
  await wrapper.setProps({ visible: true })
  await flushPromises()
  await wrapper.find(field).setValue(text)
  await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
  await flushPromises()
  await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
  await flushPromises()
}

const clipboard = { writeText: vi.fn(() => Promise.resolve()) }

beforeEach(() => {
  getMock.mockReset()
  postMock.mockReset()
  clipboard.writeText.mockClear()
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
  getMock.mockImplementation((url: string) => {
    if (url.includes('/export')) return Promise.resolve({ data: CURRENT })
    return Promise.reject(new Error('catalog unavailable'))
  })
})

describe('ScenarioAiModal — create', () => {
  it('lists every problem of a refused answer and copies a fix prompt naming them', async () => {
    const problems = [
      'step 2 (Quiz), question 1: correct_answer "4" is not an option index (0 to 1 for 2 options)',
      'step 3 (x): step_type "lab" is not one of terminal, flag, quiz, info',
    ]
    postMock.mockRejectedValue({
      response: { status: 400, data: { error_code: 400, error_message: 'The scenario has 2 problem(s) to fix', details: problems } },
    })
    const wrapper = mountModal({ mode: 'create' })
    await openAndWritePrompt(wrapper, '#ai-description', 'A lab about ping')

    await wrapper.find('#ai-answer').setValue('Here you go:\n```json\n{"title": "Ping", "steps": [{"title": "a"}]}\n```')
    await wrapper.find('[data-testid="scenario-ai-import"]').trigger('click')
    await flushPromises()

    expect(postMock).toHaveBeenCalledWith('/organizations/org-1/scenarios/import-json', { title: 'Ping', steps: [{ title: 'a' }] })
    const list = wrapper.find('[data-testid="scenario-import-problems"]')
    expect(list.text()).toContain('The platform refused this answer (2 problem(s))')
    expect(list.findAll('li').map(li => li.text())).toEqual(problems)
    expect(wrapper.emitted('imported')).toBeUndefined()

    await wrapper.find('[data-testid="scenario-ai-copy-fix"]').trigger('click')
    await flushPromises()
    expect(clipboard.writeText).toHaveBeenCalledWith(buildFixPrompt(problems, 'en'))
  })

  it('keeps Import disabled and says why while the answer holds no JSON', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await openAndWritePrompt(wrapper, '#ai-description', 'A lab about ping')

    await wrapper.find('#ai-answer').setValue('Sorry, I need more details.')
    expect(wrapper.find('[data-testid="scenario-ai-import"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="scenario-ai-parse-status"]').text()).toBe('No JSON object found in this answer.')
  })

  it('puts the description and the contract in the prompt shown and copied', async () => {
    const wrapper = mountModal({ mode: 'create' })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    await wrapper.find('#ai-description').setValue('Teach cron jobs')
    await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
    await flushPromises()

    const prompt = (wrapper.find('[data-testid="scenario-ai-prompt"]').element as HTMLTextAreaElement).value
    expect(prompt).toContain('Teach cron jobs')
    expect(prompt).toContain('## The JSON format')
    await wrapper.find('[data-testid="scenario-ai-copy-prompt"]').trigger('click')
    await flushPromises()
    expect(clipboard.writeText).toHaveBeenCalledWith(prompt)
  })
})

describe('ScenarioAiModal — improve', () => {
  const scenario = { id: 'sc-1', title: CURRENT.title, organization_id: ORG.id }

  it('sends the export along, warns about a changed title and imports into the scenario\'s own org with its title kept', async () => {
    postMock.mockResolvedValue({ data: { id: 'sc-1' } })
    const wrapper = mountModal({ mode: 'improve', scenario })
    await wrapper.setProps({ visible: true })
    await flushPromises()
    await wrapper.find('#ai-instruction').setValue('Translate it into English')
    await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
    await flushPromises()

    expect(getMock).toHaveBeenCalledWith('/scenarios/sc-1/export', { params: { format: 'json' } })
    const prompt = (wrapper.find('[data-testid="scenario-ai-prompt"]').element as HTMLTextAreaElement).value
    expect(prompt).toContain('"title": "Réseau de base"')
    expect(prompt).toContain('Translate it into English')

    await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
    const answer = { title: 'Basic networking', steps: [...CURRENT.steps, { title: 'Traceroute', step_type: 'terminal' }] }
    await wrapper.find('#ai-answer').setValue('```json\n' + JSON.stringify(answer) + '\n```')

    const changes = wrapper.find('[data-testid="scenario-ai-changes"]')
    expect(changes.text()).toContain('Steps: 1 → 2')
    expect(changes.text()).toContain('+ Traceroute')
    expect(wrapper.find('[data-testid="scenario-ai-title-changed"] input').element).toHaveProperty('checked', true)

    await wrapper.find('[data-testid="scenario-ai-import"]').trigger('click')
    await flushPromises()
    expect(postMock).toHaveBeenCalledWith('/organizations/org-1/scenarios/import-json', { ...answer, title: CURRENT.title })
    expect(wrapper.emitted('imported')?.[0]).toEqual([{ id: 'sc-1' }])
  })
})

describe('ScenarioAiModal — prompt language', () => {
  const promptText = (wrapper: VueWrapper) =>
    (wrapper.find('[data-testid="scenario-ai-prompt"]').element as HTMLTextAreaElement).value
  const selected = (wrapper: VueWrapper, selector: string) => (wrapper.find(selector).element as HTMLSelectElement).value

  it('defaults the prompt and the content to the UI language, and rewrites the prompt when switched', async () => {
    const wrapper = mountModal({ mode: 'create' }, 'fr')
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(selected(wrapper, '[data-testid="scenario-ai-prompt-language"]')).toBe('fr')
    expect(selected(wrapper, '#ai-language')).toBe('fr')

    await wrapper.find('#ai-description').setValue('Les tâches cron')
    await wrapper.find('[data-testid="scenario-ai-next"]').trigger('click')
    await flushPromises()
    expect(promptText(wrapper)).toContain('Vous êtes un formateur Linux expert')
    expect(promptText(wrapper)).toContain('Langue du contenu : français')

    await wrapper.find('[data-testid="scenario-ai-prompt-language"]').setValue('en')
    expect(promptText(wrapper)).toContain('You are an expert Linux trainer')
    expect(promptText(wrapper)).toContain('Content language: English')
    expect(promptText(wrapper)).toContain('Les tâches cron')
  })

  it('keeps a content language the teacher chose when the prompt language changes', async () => {
    const wrapper = mountModal({ mode: 'create' }, 'en')
    await wrapper.setProps({ visible: true })
    await flushPromises()
    expect(selected(wrapper, '[data-testid="scenario-ai-prompt-language"]')).toBe('en')

    await wrapper.find('#ai-language').setValue('fr')
    await wrapper.find('[data-testid="scenario-ai-prompt-language"]').setValue('fr')
    await wrapper.find('[data-testid="scenario-ai-prompt-language"]').setValue('en')
    expect(selected(wrapper, '#ai-language')).toBe('fr')
  })

  it('writes the improve prompt and the fix-up prompt in the chosen language', async () => {
    postMock.mockRejectedValue({ response: { status: 400, data: { details: ['title is empty'] } } })
    const wrapper = mountModal({ mode: 'improve', scenario: { id: 'sc-1', title: CURRENT.title, organization_id: ORG.id } }, 'fr')
    await openAndWritePrompt(wrapper, '#ai-instruction', 'Ajoute une étape')
    await wrapper.find('[data-testid="scenario-ai-prompt-language"]').setValue('fr')
    await wrapper.find('#ai-answer').setValue('{"title": "", "steps": []}')
    await wrapper.find('[data-testid="scenario-ai-import"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="scenario-ai-copy-fix"]').trigger('click')
    await flushPromises()
    expect(clipboard.writeText).toHaveBeenCalledWith(buildFixPrompt(['title is empty'], 'fr'))

    await wrapper.findAll('.base-modal-footer .btn-secondary')[0].trigger('click')
    expect(promptText(wrapper)).toContain('Vous êtes un formateur Linux expert et vous améliorez')
  })
})
