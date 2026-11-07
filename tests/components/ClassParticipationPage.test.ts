import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import type { ParticipationReport } from '../../src/services/domain/scenario/teacherService'

const getParticipationReport = vi.fn()
const saveCourseDays = vi.fn()
const reload = vi.fn()
const downloadCsv = vi.fn()
const saveConventionReference = vi.fn()

vi.mock('../../src/utils/download', () => ({
  downloadCsv: (...args: unknown[]) => downloadCsv(...args)
}))

vi.mock('../../src/services/domain/scenario/teacherService', () => ({
  teacherService: {
    getParticipationReport: (...args: unknown[]) => getParticipationReport(...args),
    saveCourseDays: (...args: unknown[]) => saveCourseDays(...args),
    saveConventionReference: (...args: unknown[]) => saveConventionReference(...args)
  }
}))

import ClassParticipationPage from '../../src/components/Class/ClassParticipationPage.vue'
import { provideClassContext } from '../../src/composables/useClassContext'

function hostWith(courseDays: string[]) {
  return defineComponent({
    components: { ClassParticipationPage },
    setup() {
      provideClassContext({
        groupId: computed(() => 'g-1'),
        group: computed(() => ({ course_days: courseDays })),
        reload
      } as never)
    },
    template: '<ClassParticipationPage />'
  })
}

function mountPage(courseDays: string[] = []) {
  const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
  return mount(hostWith(courseDays), { global: { plugins: [i18n] } })
}

function reportWith(overrides: Partial<ParticipationReport> = {}): ParticipationReport {
  return {
    title: 'DevOps week',
    organization_name: 'Acme',
    organization_siret: '',
    organization_declaration_number: '',
    convention_reference: '',
    from: '2026-03-02',
    to: '2026-03-06',
    timezone: 'Europe/Paris',
    generated_at: '2026-03-07T10:00:00Z',
    trainers: ['Tess Trainer'],
    days: ['2026-03-02', '2026-03-03'],
    activity_days: [{ date: '2026-03-02', active_learners: 1 }, { date: '2026-03-04', active_learners: 1 }],
    other_activity_days: 0,
    learners: [
      {
        user_id: 'u-1',
        name: 'Lea Learner',
        email: 'lea@example.org',
        has_left: false,
        commands: 42,
        days: [{ date: '2026-03-02', commands: 42, first_activity: '2026-03-02T08:05:00Z', last_activity: '2026-03-02T16:30:00Z' }],
        scenarios: [{
          title: 'Docker basics',
          status: 'completed',
          grade: 90,
          steps_completed: 5,
          steps_total: 5,
          verify_attempts: 7
        }]
      },
      { user_id: 'u-2', name: 'Sam Silent', email: 'sam@example.org', has_left: true, commands: 0, days: [], scenarios: [] }
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
    saveCourseDays.mockReset()
    saveCourseDays.mockResolvedValue(undefined)
    reload.mockReset()
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
    expect(getParticipationReport).toHaveBeenCalledWith('g-1', '2026-03-02', '2026-03-06', browserTimezone, [])
  })

  it('shows each day in the timezone of the report', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    const row = wrapper.findAll('[data-test="participation-learner"]')[0]
    expect(row.text()).toContain('Lea Learner')
    expect(row.find('[data-test="participation-commands"]').text()).toBe('42')
    expect(wrapper.find('[data-test="participation-scenario"]').text()).toContain('Docker basics')
    // 08:05 UTC is 09:05 in Paris, whatever timezone the test machine is in.
    expect(row.find('[data-test="participation-day"]').text()).toMatch(/09:05 AM.*05:30 PM/)
  })

  it('keeps a learner with no activity in the report, stated plainly', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    const row = wrapper.findAll('[data-test="participation-learner"]')[1]
    expect(row.text()).toContain('Sam Silent')
    expect(row.find('[data-test="participation-day"]').text()).toBe('none')
    expect(row.find('[data-test="participation-days-active"]').text()).toBe('0/2')
    expect(row.find('[data-test="participation-commands"]').text()).toBe('None recorded')
  })

  it('identifies the organisation and the convention once filled in', async () => {
    getParticipationReport.mockResolvedValue(reportWith({
      organization_siret: '10299352400010',
      organization_declaration_number: '11755555575',
      convention_reference: 'CONV-14'
    }))
    const wrapper = mountPage()

    await generate(wrapper)

    expect(wrapper.find('[data-test="participation-siret"]').text()).toBe('10299352400010')
    expect(wrapper.find('[data-test="participation-declaration-number"]').text()).toBe('11755555575')
    expect(wrapper.find('[data-test="participation-convention-reference"]').text()).toBe('CONV-14')
  })

  it('leaves out the details nobody filled in', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    expect(wrapper.find('[data-test="participation-siret"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="participation-convention-reference"]').exists()).toBe(false)
  })

  it('saves the convention reference on the class, then reports it', async () => {
    saveConventionReference.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await generate(wrapper)
    getParticipationReport.mockClear()

    await wrapper.find('[data-test="participation-convention"]').setValue('  CONV-14 ')
    await wrapper.find('[data-test="participation-save-convention"]').trigger('click')
    await flushPromises()

    expect(saveConventionReference).toHaveBeenCalledWith('g-1', 'CONV-14')
    expect(reload).toHaveBeenCalled()
    expect(getParticipationReport).toHaveBeenCalled()
  })

  it('says so when the convention reference cannot be saved', async () => {
    saveConventionReference.mockRejectedValue(new Error('refused'))
    const wrapper = mountPage()
    await generate(wrapper)

    await wrapper.find('[data-test="participation-save-convention"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Could not save the convention reference.')
  })

  it('marks a learner who left the class', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    const rows = wrapper.findAll('[data-test="participation-learner"]')
    expect(rows[0].find('[data-test="participation-has-left"]').exists()).toBe(false)
    expect(rows[1].find('[data-test="participation-has-left"]').exists()).toBe(true)
  })

  it('opens on the saved course days and asks for them', async () => {
    const wrapper = mountPage(['2026-03-02', '2026-03-05'])
    expect((wrapper.find('[data-test="participation-from"]').element as HTMLInputElement).value).toBe('2026-03-02')
    expect((wrapper.find('[data-test="participation-to"]').element as HTMLInputElement).value).toBe('2026-03-05')

    await generate(wrapper)

    expect(getParticipationReport.mock.calls[0][4]).toEqual(['2026-03-02', '2026-03-05'])
  })

  it('offers a saved course day with no activity, so an absence can be reported', async () => {
    const wrapper = mountPage(['2026-03-05'])

    await generate(wrapper)

    const offered = wrapper.findAll('[data-test="participation-day-choice"]').map(input => (input.element as HTMLInputElement).value)
    expect(offered).toEqual(['2026-03-02', '2026-03-04', '2026-03-05'])
  })

  it('saves the ticked days on the class, then reports them', async () => {
    const wrapper = mountPage()
    await generate(wrapper)
    await wrapper.findAll('[data-test="participation-day-choice"]')[1].setValue(true)
    await wrapper.findAll('[data-test="participation-day-choice"]')[0].setValue(true)

    await wrapper.find('[data-test="participation-save-days"]').trigger('click')
    await flushPromises()

    expect(saveCourseDays).toHaveBeenCalledWith('g-1', ['2026-03-02', '2026-03-04'])
    expect(reload).toHaveBeenCalledOnce()
    expect(getParticipationReport.mock.lastCall?.[4]).toEqual(expect.arrayContaining(['2026-03-02', '2026-03-04']))
  })

  it('can still show every day once course days are set', async () => {
    const wrapper = mountPage(['2026-03-02'])
    await generate(wrapper)

    await wrapper.find('[data-test="participation-show-all"]').setValue(true)
    await flushPromises()

    expect(getParticipationReport.mock.lastCall?.[4]).toEqual([])
  })

  it('states how many days of activity the report leaves out', async () => {
    getParticipationReport.mockResolvedValue(reportWith({ other_activity_days: 3 }))
    const wrapper = mountPage(['2026-03-02'])

    await generate(wrapper)

    expect(wrapper.find('[data-test="participation-other-days"]').text()).toContain('3')
  })

  it('says commands are unknown rather than zero when they could not be read', async () => {
    getParticipationReport.mockResolvedValue(reportWith({ commands_available: false }))
    const wrapper = mountPage()

    await generate(wrapper)

    const commandCell = wrapper.findAll('[data-test="participation-commands"]')[0]
    expect(commandCell.text()).toBe('Unknown')
    expect(wrapper.find('[data-test="participation-commands-warning"]').exists()).toBe(true)
    const emptyDay = wrapper.findAll('[data-test="participation-learner"]')[1].find('[data-test="participation-day"]')
    expect(emptyDay.text()).toBe('Unknown')
  })

  it('says the report is not a record of hours attended', async () => {
    const wrapper = mountPage()

    await generate(wrapper)

    expect(wrapper.find('[data-test="participation-disclaimer"]').text()).toContain('not the hours attended')
  })

  it('shows the error and drops the previous report when generating fails', async () => {
    const wrapper = mountPage()
    await generate(wrapper)
    getParticipationReport.mockRejectedValue(new Error('period too long'))

    await generate(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toContain('could not be generated')
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

  it('exports the generated report as CSV, only once there is one', async () => {
    downloadCsv.mockClear()
    const wrapper = mountPage()
    const exportButton = wrapper.find('[data-test="participation-export-csv"]')
    expect(exportButton.attributes('disabled')).toBeDefined()

    await generate(wrapper)
    await exportButton.trigger('click')

    expect(downloadCsv).toHaveBeenCalledOnce()
    const [csv, filename] = downloadCsv.mock.calls[0]
    expect(csv).toContain('"Lea Learner","lea@example.org","no","2026-03-02"')
    expect(filename).toBe('participation-2026-03-02-2026-03-06.csv')
  })
})
