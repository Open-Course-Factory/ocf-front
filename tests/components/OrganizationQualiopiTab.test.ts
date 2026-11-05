import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import axios from 'axios'
import OrganizationQualiopiTab from '../../src/components/Organizations/OrganizationQualiopiTab.vue'

vi.mock('axios', () => ({ default: { get: vi.fn() } }))

const DAY_MS = 24 * 60 * 60 * 1000
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString()

function answerWith(members: unknown[], classes: unknown[]) {
  vi.mocked(axios.get).mockImplementation((async (url: string) => ({
    data: url.endsWith('/members') ? members : classes
  })) as never)
}

async function mountTab() {
  const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} } })
  const wrapper = mount(OrganizationQualiopiTab, {
    props: { organizationId: 'org-1' },
    global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } }
  })
  await flushPromises()
  return wrapper
}

describe('OrganizationQualiopiTab', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset()
  })

  it('lists coming erasures soonest first and warns about the close ones', async () => {
    answerWith(
      [
        { id: 'm1', user_id: 'later', user: { display_name: 'Later Learner' }, scheduled_erasure_at: inDays(200) },
        { id: 'm2', user_id: 'soon', user: { display_name: 'Soon Learner' }, scheduled_erasure_at: inDays(10) },
        { id: 'm3', user_id: 'staying', user: { display_name: 'Staying Learner' } }
      ],
      [{ id: 'c1', name: 'devops', display_name: 'DevOps', members: [{ user_id: 'soon' }] }]
    )

    const wrapper = await mountTab()
    const rows = wrapper.findAll('section')[0].findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Soon Learner')
    expect(rows[0].text()).toContain('In less than 30 days')
    expect(rows[0].findComponent(RouterLinkStub).props('to')).toMatchObject({ params: { id: 'c1' } })
    expect(rows[1].text()).toContain('Later Learner')
    expect(rows[1].text()).not.toContain('In less than')
    expect(wrapper.text()).not.toContain('Staying Learner')
  })

  it('warns about a class with no course days and sorts the latest course first', async () => {
    answerWith([], [
      { id: 'none', name: 'unset' },
      { id: 'old', name: 'old', course_days: ['2026-01-05'] },
      { id: 'new', name: 'new', course_days: ['2026-03-02', '2026-03-06'] }
    ])

    const wrapper = await mountTab()
    const rows = wrapper.findAll('section')[1].findAll('tbody tr')

    expect(rows.map(row => row.find('td').text())).toEqual(['new', 'old', 'unset'])
    expect(rows[0].findAll('td')[1].text()).toBe('2')
    expect(rows[2].text()).toContain('Not set')
    expect(wrapper.findAll('section')[0].text()).toContain('No departed member')
  })

  it('never claims anything was saved', async () => {
    answerWith([], [{ id: 'c1', name: 'devops', course_days: ['2026-03-02'] }])

    const wrapper = await mountTab()

    expect(wrapper.text().toLowerCase()).not.toMatch(/saved|archived|exported/)
  })

  it('says so when the data cannot be loaded', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('down'))

    const wrapper = await mountTab()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
