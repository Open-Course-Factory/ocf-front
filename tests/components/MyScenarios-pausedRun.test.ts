/**
 * Scenario history: a paused run reads as paused, and only a resumable run
 * offers Resume.
 *
 * GET /scenario-sessions/my carries `resumable` and `resume_mode` ("live" |
 * "paused", absent when the run cannot be resumed). The page used to offer
 * Resume on `status === 'active'` alone — the same re-derivation that sent the
 * launcher into a container deleted the day before (see
 * ScenarioLauncher-deadRun.test.ts). It must follow the backend's verdict, and
 * show a paused run distinctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const getMySessionsMock = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    abandonSession: vi.fn().mockResolvedValue(undefined),
  },
}))

import MyScenarios from '../../src/components/Pages/MyScenarios.vue'

function mountPage(locale: 'en' | 'fr' = 'en') {
  return mount(MyScenarios, {
    global: {
      plugins: [createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false,
      })],
      stubs: {
        ProgressBar: true,
        'router-link': { props: ['to'], template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>' },
      }
    }
  })
}

const BASE_RUN = {
  id: 'sess-1',
  scenario_id: 'sc1',
  scenario_title: 'GameShell',
  status: 'active',
  terminal_session_id: 'term-1',
  current_step: 4,
  total_steps: 36,
  completed_steps: 3,
  started_at: new Date().toISOString(),
}

function resumeLinks(wrapper: ReturnType<typeof mountPage>) {
  return wrapper.findAll('.router-link-stub').filter(a => /Resume|Reprendre/.test(a.text()))
}

describe('MyScenarios — paused and non-resumable runs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a paused run as paused', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    const badge = wrapper.find('[data-testid="scenario-paused-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toMatch(/Paused/)
  })

  it('shows the paused state in French', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage('fr')
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').text()).toMatch(/En pause/)
  })

  it('still offers Resume on a paused run, into its session view', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'paused' }])

    const wrapper = mountPage()
    await flushPromises()

    const links = resumeLinks(wrapper)
    expect(links).toHaveLength(1)
    expect(links[0].attributes('data-to')).toContain('term-1')
  })

  it('shows no paused badge on a live run', async () => {
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: true, resume_mode: 'live' }])

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-testid="scenario-paused-badge"]').exists()).toBe(false)
    expect(resumeLinks(wrapper)).toHaveLength(1)
  })

  it('offers no Resume on a completed run', async () => {
    getMySessionsMock.mockResolvedValue([
      { ...BASE_RUN, status: 'completed', resumable: false, completed_at: new Date().toISOString(), grade: 100 }
    ])

    const wrapper = mountPage()
    await flushPromises()

    expect(resumeLinks(wrapper)).toHaveLength(0)
    expect(wrapper.find('[data-testid="scenario-paused-badge"]').exists()).toBe(false)
  })

  it('offers no Resume on an "active" run the backend reports as not resumable', async () => {
    // The row still reads active because nothing has looked at its terminal,
    // which is gone. Resume would lead into a dead container.
    getMySessionsMock.mockResolvedValue([{ ...BASE_RUN, resumable: false }])

    const wrapper = mountPage()
    await flushPromises()

    expect(resumeLinks(wrapper)).toHaveLength(0)
  })
})
