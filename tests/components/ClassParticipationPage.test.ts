import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import type { ParticipationReport } from '../../src/services/domain/scenario/teacherService'

const getParticipationReport = vi.fn()

vi.mock('../../src/services/domain/scenario/teacherService', () => ({
  teacherService: { getParticipationReport: (...args: unknown[]) => getParticipationReport(...args) }
}))

import ClassParticipationPage from '../../src/components/Class/ClassParticipationPage.vue'
import { provideClassContext } from '../../src/composables/useClassContext'

const Host = defineComponent({
  components: { ClassParticipationPage },
  setup() {
    provideClassContext({ groupId: computed(() => 'g-1') } as never)
  },
  template: '<ClassParticipationPage />'
})

function mountPage() {
  const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
  return mount(Host, { global: { plugins: [i18n] } })
}

function reportWith(overrides: Partial<ParticipationReport> = {}): ParticipationReport {
  return {
    title: 'DevOps week',
    organization_name: 'Acme',
    from: '2026-03-02',
    to: '2026-03-06',
    timezone: 'Europe/Paris',
    generated_at: '2026-03-07T10:00:00Z',
    trainers: ['Tess Trainer'],
    learners: [
      {
        user_id: 'u-1',
        name: 'Lea Learner',
        email: 'lea@example.org',
        commands: 42,
        days: [{ date: '2026-03-02', first_activity: '2026-03-02T08:05:00Z', last_activity: '2026-03-02T16:30:00Z' }],
        scenarios: [{
          title: 'Docker basics',
          status: 'completed',
          started_at: '2026-03-02T08:10:00Z',
          completed_at: '2026-03-02T09:00:00Z',
          grade: 90,
          steps_completed: 5,
          steps_total: 5,
          verify_attempts: 7
        }]
      },
      { user_id: 'u-2', name: 'Sam Silent', email: 'sam@example.org', commands: 0, days: [], scenarios: [] }
    ],
    commands_available: true,
    ...overrides
  }
}

async function generate(wrapper: ReturnType<typeof mountPage>) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('ClassParticipationPage', () => {
  beforeEach(() => {
    getParticipationReport.mockReset()
    getParticipationReport.mockResolvedValue(reportWith())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks for the chosen period in the timezone of the browser', async () => {
    const wrapper = mountPage()
    await wrapper.find('[data-test="participation-from"]').setValue('2026-03-02')
    await wrapper.find('[data-test="participation-to"]').setValue('2026-03-06')

    await generate(wrapper)

    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    expect(getParticipationReport).toHaveBeenCalledWith('g-1', '2026-03-02', '2026-03-06', browserTimezone)
  })

  it('shows each day in the timezone of the report', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    const row = wrapper.findAll('[data-test="participation-learner"]')[0]
    expect(row.text()).toContain('Lea Learner')
    expect(row.text()).toContain('42')
    expect(row.text()).toContain('Docker basics')
    // 08:05 UTC is 09:05 in Paris, whatever timezone the test machine is in.
    expect(row.find('[data-test="participation-day"]').text()).toMatch(/09:05 AM.*05:30 PM/)
  })

  it('keeps a learner with no activity in the report, stated plainly', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    const row = wrapper.findAll('[data-test="participation-learner"]')[1]
    expect(row.text()).toContain('Sam Silent')
    expect(row.text()).toContain('No recorded activity')
  })

  it('says commands are unknown rather than zero when they could not be read', async () => {
    getParticipationReport.mockResolvedValue(reportWith({ commands_available: false }))
    const wrapper = mountPage()

    await generate(wrapper)

    const commandCell = wrapper.findAll('[data-test="participation-commands"]')[0]
    expect(commandCell.text()).toBe('Unknown')
    expect(wrapper.find('[data-test="participation-commands-warning"]').exists()).toBe(true)
  })

  it('says the report is not a record of hours attended', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    expect(wrapper.find('[data-test="participation-disclaimer"]').text()).toContain('not the hours attended')
  })

  it('shows the error and drops the previous report when generating fails', async () => {
    const wrapper = mountPage()
    await generate(wrapper)
    getParticipationReport.mockRejectedValue({ response: { data: { error: 'period too long' } } })

    await generate(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toContain('period too long')
    expect(wrapper.find('[data-test="participation-learner"]').exists()).toBe(false)
  })

  it.each([
    ['the start is after the end', '2026-03-06', '2026-03-02'],
    ['a date is empty', '', '2026-03-02']
  ])('refuses to generate when %s', async (_case, from, to) => {
    const wrapper = mountPage()
    await wrapper.find('[data-test="participation-from"]').setValue(from)
    await wrapper.find('[data-test="participation-to"]').setValue(to)

    expect(wrapper.find('[data-test="participation-generate"]').attributes('disabled')).toBeDefined()
  })

  it('prints only once there is a report to print', async () => {
    const print = vi.fn()
    vi.stubGlobal('print', print) // the test DOM has no window.print
    const wrapper = mountPage()
    const printButton = wrapper.find('[data-test="participation-print"]')
    expect(printButton.attributes('disabled')).toBeDefined()

    await generate(wrapper)
    await printButton.trigger('click')

    expect(print).toHaveBeenCalledOnce()
  })
})
