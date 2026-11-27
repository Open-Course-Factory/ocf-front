/**
 * The platform's boot settings for machines in the learner's browser, which
 * only administrators edit.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockGet = vi.fn()
const mockPut = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args)
  }
}))
import { createTestI18n } from '../helpers/entityModalHelper'
import UnkernelIntegration from '../../src/components/Pages/Admin/UnkernelIntegration.vue'

const DEFAULTS = { jit: true, verbose: false, display: true, sound: true, append: '', console_hidden: false }

async function mountPage() {
  const wrapper = mount(UnkernelIntegration, { global: { plugins: [createTestI18n()] } })
  await flushPromises()
  return wrapper
}

const box = (wrapper: Awaited<ReturnType<typeof mountPage>>, key: string) =>
  wrapper.get(`[data-testid="unkernel-${key}"]`).element as HTMLInputElement

describe('UnkernelIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { ...DEFAULTS } })
    mockPut.mockImplementation(async (_url: string, body: unknown) => ({ data: body }))
  })

  it('shows the platform\'s boot settings', async () => {
    const wrapper = await mountPage()
    expect(mockGet).toHaveBeenCalledWith('/local-machines/boot-defaults')
    expect(box(wrapper, 'jit').checked).toBe(true)
    expect(box(wrapper, 'verbose').checked).toBe(false)
    expect(box(wrapper, 'append').value).toBe('')
  })

  it('saves every setting', async () => {
    const wrapper = await mountPage()
    await wrapper.get('[data-testid="unkernel-verbose"]').setValue(true)
    await wrapper.get('[data-testid="unkernel-console_hidden"]').setValue(true)
    await wrapper.get('[data-testid="unkernel-append"]').setValue('console=hvc0 quiet')
    await wrapper.get('[data-testid="unkernel-boot-form"]').trigger('submit')
    await flushPromises()
    expect(mockPut).toHaveBeenCalledWith('/local-machines/boot-defaults',
      { ...DEFAULTS, verbose: true, console_hidden: true, append: 'console=hvc0 quiet' })
  })

  it('shows why ocf-core refused a command line', async () => {
    mockPut.mockRejectedValueOnce({ response: { status: 400, data: { error_message: 'append has a newline' } } })
    const wrapper = await mountPage()
    await wrapper.get('[data-testid="unkernel-boot-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('append has a newline')
  })

  it('offers no form when the settings cannot be read', async () => {
    mockGet.mockRejectedValueOnce(new Error('down'))
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="unkernel-boot-form"]').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
