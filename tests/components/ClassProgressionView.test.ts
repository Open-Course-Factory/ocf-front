/**
 * Tests for ClassProgressionView — the exam view of a class (#310): what the
 * teacher sees between opening the tab and walking over to a learner.
 *
 * It reads ONE endpoint, GET /teacher/groups/:id/live-progress, which is the
 * point of the issue: presence and scenario progress used to come from two
 * places joined on nothing.
 *
 * The empty and degenerate shapes get as much attention as the happy one — a
 * class with nobody in it, a class with no scenario assigned, and a scenario
 * with no step are all states an invigilator can land on.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const getGroupLiveProgress = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupLiveProgress: (...args: unknown[]) => getGroupLiveProgress(...args)
  }
}))

import ClassProgressionView from '../../src/components/Groups/ClassProgressionView.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function assignment(overrides: Record<string, unknown> = {}) {
  return {
    assignment_id: 'a-1',
    scenario_id: 'sc-1',
    scenario_title: 'Docker — the basics',
    status: 'in_progress',
    current_step: 3,
    total_steps: 6,
    hints_used: 0,
    current_step_elapsed_seconds: 120,
    ...overrides
  }
}

function learner(userId: string, userName: string, overrides: Record<string, unknown> = {}) {
  return {
    user_id: userId,
    user_name: userName,
    connected: true,
    idle: false,
    terminal_session_id: `sess-${userId}`,
    assignments: [assignment()],
    ...overrides
  }
}

function mountView() {
  return mount(ClassProgressionView, {
    props: { groupId: 'g-1' },
    global: { plugins: [createTestI18n()] }
  })
}

function learnerNames(wrapper: ReturnType<typeof mountView>) {
  return wrapper.findAll('.ocf-prog-name').map(n => n.text())
}

describe('ClassProgressionView — loading the class', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getGroupLiveProgress.mockResolvedValue([learner('u-1', 'Léa Simon')])
  })

  it('asks for the progress of the class it was given, and lists its learners', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(getGroupLiveProgress).toHaveBeenCalledWith('g-1')
    expect(learnerNames(wrapper)).toEqual(['Léa Simon'])
  })

  it('shows a skeleton until the first rows arrive, then the rows', async () => {
    let resolveLoad!: (rows: unknown[]) => void
    getGroupLiveProgress.mockReturnValue(new Promise(resolve => { resolveLoad = resolve }))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-skeleton').exists()).toBe(true)
    expect(wrapper.find('.ocf-prog-table').exists()).toBe(false)

    resolveLoad([learner('u-1', 'Léa Simon')])
    await flushPromises()

    expect(wrapper.find('.ocf-clp-skeleton').exists()).toBe(false)
    expect(learnerNames(wrapper)).toEqual(['Léa Simon'])
  })

  it('keeps the rows on screen when a later refresh fails', async () => {
    const wrapper = mountView()
    await flushPromises()

    getGroupLiveProgress.mockRejectedValueOnce({ response: { status: 500 } })
    await wrapper.find('.ocf-btn').trigger('click')
    await flushPromises()

    expect(learnerNames(wrapper)).toEqual(['Léa Simon'])
    expect(wrapper.find('.ocf-clp-inline-error').exists()).toBe(true)
  })

  it('offers a retry when the very first load fails', async () => {
    getGroupLiveProgress.mockRejectedValueOnce({ response: { status: 403 } })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-state-error').exists()).toBe(true)
    expect(wrapper.find('.ocf-clp-skeleton').exists()).toBe(false)

    getGroupLiveProgress.mockResolvedValueOnce([learner('u-1', 'Léa Simon')])
    await wrapper.find('.ocf-clp-state-error .ocf-btn').trigger('click')
    await flushPromises()

    expect(learnerNames(wrapper)).toEqual(['Léa Simon'])
  })
})

describe('ClassProgressionView — classes with nothing in them', () => {
  beforeEach(() => vi.clearAllMocks())

  it('says the class is empty rather than showing an empty table', async () => {
    getGroupLiveProgress.mockResolvedValue([])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-state').exists()).toBe(true)
    expect(wrapper.find('.ocf-prog-table').exists()).toBe(false)
  })

  it('names the missing people rather than the missing sessions', async () => {
    // A class of teaching staff only returns no row at all since core !361:
    // the endpoint lists apprenants, and its teacher is not one. "Nobody has
    // started" would be a different, and false, statement — there is nobody to.
    getGroupLiveProgress.mockResolvedValue([])

    const wrapper = mountView()
    await flushPromises()

    const emptyState = wrapper.find('.ocf-clp-state').text()
    expect(emptyState).toBe('This class has no learner yet')
    expect(emptyState).not.toContain('session')
  })

  it('still lists the members when no scenario is assigned', async () => {
    getGroupLiveProgress.mockResolvedValue([
      learner('u-1', 'Léa Simon', { assignments: [] }),
      learner('u-2', 'Karim Benali', { assignments: [] })
    ])

    const wrapper = mountView()
    await flushPromises()

    expect(learnerNames(wrapper)).toEqual(['Karim Benali', 'Léa Simon'])
    expect(wrapper.find('.ocf-clp-note').exists()).toBe(true)
    // Nothing to spread over, and nothing to sort by.
    expect(wrapper.find('.ocf-dist').exists()).toBe(false)
    expect(wrapper.find('.ocf-clp-sorts').exists()).toBe(false)
  })

  it('draws no distribution strip for a scenario without steps', async () => {
    getGroupLiveProgress.mockResolvedValue([
      learner('u-1', 'Léa Simon', {
        assignments: [assignment({ total_steps: 0, current_step: 0 })]
      })
    ])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-dist').exists()).toBe(false)
    expect(learnerNames(wrapper)).toEqual(['Léa Simon'])
  })
})

describe('ClassProgressionView — reading the class at a glance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getGroupLiveProgress.mockResolvedValue([
      learner('u-1', 'Karim', { assignments: [assignment({ current_step: 4, hints_used: 0 })] }),
      learner('u-2', 'Léa', { assignments: [assignment({ current_step: 3, hints_used: 2 })] }),
      learner('u-3', 'Nadia', {
        connected: false,
        terminal_session_id: undefined,
        assignments: [assignment({ status: 'completed', grade: 91 })]
      })
    ])
  })

  it('counts how many of the class are connected', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-presence').text()).toContain('2')
    expect(wrapper.find('.ocf-clp-presence').text()).toContain('3')
  })

  it('spreads the class over the steps, finished in its own column', async () => {
    const wrapper = mountView()
    await flushPromises()

    const counts = wrapper.findAll('.ocf-dist-col').map(col => col.find('.ocf-dist-count').text())
    // Steps 1..6 then "finished": one learner on step 3, one on step 4, one done.
    expect(counts).toEqual(['', '', '1', '1', '', '', '1'])
  })

  it('names the watched scenario when there is only one', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-scenario').text()).toBe('Docker — the basics')
    expect(wrapper.find('.ocf-clp-picker').exists()).toBe(false)
  })

  it('reorders the rows when the teacher sorts by hints', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(learnerNames(wrapper)).toEqual(['Léa', 'Karim', 'Nadia'])

    const [byStep, byHints] = wrapper.findAll('.ocf-clp-chip')
    expect(byStep.attributes('aria-pressed')).toBe('true')

    await byHints.trigger('click')

    expect(learnerNames(wrapper)[0]).toBe('Léa')
    expect(byHints.attributes('aria-pressed')).toBe('true')
    expect(byStep.attributes('aria-pressed')).toBe('false')
  })
})

describe('ClassProgressionView — the deadline', () => {
  beforeEach(() => vi.clearAllMocks())

  async function mountWithDeadline(minutesFromNow: number) {
    const deadline = new Date(Date.now() + minutesFromNow * 60_000).toISOString()
    getGroupLiveProgress.mockResolvedValue([
      learner('u-1', 'Léa', { assignments: [assignment({ deadline })] })
    ])
    const wrapper = mountView()
    await flushPromises()
    return wrapper
  }

  it('counts down to the end of the exam, in amber when it is close', async () => {
    const wrapper = await mountWithDeadline(42)

    const chip = wrapper.find('.ocf-clp-deadline')
    expect(chip.text()).toContain('42m')
    expect(chip.classes()).toContain('ocf-clp-deadline-close')
  })

  it('stays quiet about a deadline that is still hours away', async () => {
    const wrapper = await mountWithDeadline(5 * 60)

    expect(wrapper.find('.ocf-clp-deadline').classes()).not.toContain('ocf-clp-deadline-close')
  })

  it('says the deadline has passed instead of counting backwards', async () => {
    const wrapper = await mountWithDeadline(-10)

    expect(wrapper.find('.ocf-clp-deadline').text()).not.toContain('-')
  })

  it('shows no countdown when the assignment has no deadline', async () => {
    getGroupLiveProgress.mockResolvedValue([learner('u-1', 'Léa')])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.ocf-clp-deadline').exists()).toBe(false)
  })
})
