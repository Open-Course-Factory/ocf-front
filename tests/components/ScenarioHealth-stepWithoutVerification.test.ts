/**
 * step_without_verification comes at two severities that mean two different
 * things (ocf-core CheckScenarioHealth): blocking is a step the learner cannot
 * get past — a quiz with no questions — and a warning is a terminal step with
 * no verify script, which Verify passes unchecked. Telling an operator that a
 * passable step is a dead end sends them hunting for a fault that is not there.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('axios', () => ({ default: { get: vi.fn() } }))

import axios from 'axios'
import ScenarioHealth from '../../src/components/Pages/Admin/ScenarioHealth.vue'

async function findingsShown(locale: 'en' | 'fr') {
  ;(axios.get as any).mockResolvedValue({
    data: [{
      scenario_id: 'sc-1',
      name: 'lab',
      title: 'Lab',
      is_public: false,
      findings: [
        { code: 'step_without_verification', severity: 'blocking', detail: '3' },
        { code: 'step_without_verification', severity: 'warning', detail: '1, 2' },
      ],
    }],
  })
  const wrapper = mount(ScenarioHealth, {
    global: {
      plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
    },
  })
  await flushPromises()
  return wrapper.findAll('.ocf-health-finding').map(f => ({
    severity: f.find('.ocf-health-severity').text(),
    sentence: f.find('.ocf-health-sentence').text(),
  }))
}

describe('ScenarioHealth — step_without_verification', () => {
  it('says a blocking step is a dead end and a warning step passes unchecked', async () => {
    const [blocking, warning] = await findingsShown('en')
    expect(blocking.severity).toBe('Blocking')
    expect(blocking.sentence).toContain('cannot get past')
    expect(blocking.sentence).toContain(': 3.')
    expect(warning.severity).toBe('Warning')
    expect(warning.sentence).toContain('no verify script')
    expect(warning.sentence).not.toContain('cannot get past')
    expect(warning.sentence).toContain(': 1, 2.')
  })

  it('does the same in French', async () => {
    const [blocking, warning] = await findingsShown('fr')
    expect(blocking.severity).toBe('Bloquant')
    expect(blocking.sentence).toContain('ne peut pas franchir')
    expect(warning.severity).toBe('Avertissement')
    expect(warning.sentence).toContain('sans script de vérification')
  })
})
