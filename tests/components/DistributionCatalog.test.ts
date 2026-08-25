/**
 * The terminal-distribution catalogue screen.
 *
 * This replaces typing image names into a text field, which is why it exists:
 * a mistyped name matches nothing and fails silently, so the names must come
 * from the backend and be chosen, never written.
 *
 * The screen sends the whole withheld set rather than a delta, and renders what
 * comes back rather than what it sent, so the boxes and the stored value cannot
 * drift apart.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const mockGet = vi.fn()
const mockPut = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  }
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
    te: () => true,
    locale: ref('en'),
  }),
  useStoreTranslations: () => ({ t: (k: string) => k, te: () => true, locale: ref('en') })
}))

import DistributionCatalog from '../../src/components/Pages/Admin/DistributionCatalog.vue'

const catalog = [
  { name: 'Alpine', description: 'Alpine 3.22', min_size_key: 'xs', offered: true },
  { name: 'Debian', description: 'Debian 13', min_size_key: 'xs', offered: true },
  { name: 'challenge-deb', description: 'Rogue-Lite base', min_size_key: 's', offered: false },
]

async function mountPage() {
  const wrapper = mount(DistributionCatalog)
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('DistributionCatalog — choosing what the launcher offers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: catalog.map(e => ({ ...e })) })
    mockPut.mockImplementation((_url, body) =>
      Promise.resolve({
        data: catalog.map(e => ({ ...e, offered: !body.withheld.includes(e.name) })),
      })
    )
  })

  it('lists every distribution the backend can run, including withheld ones', async () => {
    const wrapper = await mountPage()

    // The withheld entry must appear here — this is the only screen that can
    // give it its visibility back.
    const text = wrapper.find('[data-test="distribution-list"]').text()
    for (const name of ['Alpine', 'Debian', 'challenge-deb']) {
      expect(text).toContain(name)
    }
  })

  it('reflects what is currently offered rather than assuming', async () => {
    const wrapper = await mountPage()

    expect((wrapper.find('[data-test="offer-Debian"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.find('[data-test="offer-challenge-deb"]').element as HTMLInputElement).checked).toBe(false)
  })

  it('cannot be saved until something actually changes', async () => {
    const wrapper = await mountPage()
    const save = wrapper.find('[data-test="save-catalog"]')

    expect(save.attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="offer-Alpine"]').setValue(false)
    expect(save.attributes('disabled')).toBeUndefined()
  })

  it('sends the whole withheld set, by name, from the checkboxes', async () => {
    const wrapper = await mountPage()

    await wrapper.find('[data-test="offer-Alpine"]').setValue(false)
    await wrapper.find('[data-test="save-catalog"]').trigger('click')
    await flushPromises()

    expect(mockPut).toHaveBeenCalledTimes(1)
    const [url, body] = mockPut.mock.calls[0]
    expect(url).toBe('/terminals/admin/distribution-catalog')
    // Alpine was just unticked; challenge-deb was already withheld and must
    // stay so — sending only the change would have silently republished it.
    expect(body.withheld.sort()).toEqual(['Alpine', 'challenge-deb'])
  })

  it('can give a withheld distribution its visibility back', async () => {
    const wrapper = await mountPage()

    await wrapper.find('[data-test="offer-challenge-deb"]').setValue(true)
    await wrapper.find('[data-test="save-catalog"]').trigger('click')
    await flushPromises()

    expect(mockPut.mock.calls[0][1].withheld).toEqual([])
  })

  it('renders what the server stored, not what it was asked to store', async () => {
    // The server refuses to withhold Debian and answers with it still offered.
    mockPut.mockResolvedValue({
      data: catalog.map(e => ({ ...e, offered: true })),
    })

    const wrapper = await mountPage()
    await wrapper.find('[data-test="offer-Debian"]').setValue(false)
    await wrapper.find('[data-test="save-catalog"]').trigger('click')
    await flushPromises()

    expect((wrapper.find('[data-test="offer-Debian"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('[data-test="save-catalog"]').attributes('disabled')).toBeDefined()
  })

  it('surfaces a failed save instead of pretending it worked', async () => {
    mockPut.mockRejectedValue({ response: { data: { error_message: 'backend unreachable' } } })

    const wrapper = await mountPage()
    await wrapper.find('[data-test="offer-Alpine"]').setValue(false)
    await wrapper.find('[data-test="save-catalog"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="save-error"]').text()).toContain('backend unreachable')
    expect(wrapper.find('[data-test="save-ok"]').exists()).toBe(false)
  })
})
