/**
 * The desktop's slot: a bar with Full screen above the place where the
 * desktop's iframe is laid, the button idle until the desktop exists.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('../../src/services/domain/terminal/localMachineDesktop', () => ({
  desktopFrames: new Map<string, HTMLIFrameElement>(),
  desktopFailures: new Set<string>(),
  onDesktopFrames: () => () => {},
}))
vi.mock('../../src/services/domain/terminal/localMachine', () => ({
  desktopLearnerTerminal: vi.fn().mockResolvedValue(1),
}))
import { desktopFrames } from '../../src/services/domain/terminal/localMachineDesktop'
import DesktopSlot from '../../src/components/Terminal/DesktopSlot.vue'

function mountSlot() {
  return mount(DesktopSlot, {
    props: { terminal: 'local-t', covered: false, hold: false, title: 'Lab', sessionInfo: { expires_at: new Date(Date.now() + 3_600_000).toISOString() }, showStopButton: true },
    global: { plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })] },
  })
}

describe('DesktopSlot', () => {
  afterEach(() => desktopFrames.clear())

  it('keeps Full screen idle while the desktop starts', () => {
    const wrapper = mountSlot()
    expect(wrapper.get('[data-testid="desktop-fullscreen"]').attributes('disabled')).toBeDefined()
  })

  it('puts the desktop in full screen', async () => {
    const frame = document.createElement('iframe')
    frame.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    desktopFrames.set('local-t', frame)
    const wrapper = mountSlot()
    await flushPromises()
    await wrapper.get('[data-testid="desktop-fullscreen"]').trigger('click')
    expect(frame.requestFullscreen).toHaveBeenCalled()
  })

  it('has the console\'s header: the run\'s name, the countdown, and Stop once the desktop exists', async () => {
    const frame = document.createElement('iframe')
    desktopFrames.set('local-t', frame)
    const wrapper = mountSlot()
    await flushPromises()
    expect(wrapper.text()).toContain('Lab')
    expect(wrapper.findComponent({ name: 'SessionCountdown' }).exists()).toBe(true)
    const stop = wrapper.findAll('button').find(b => b.text().includes('Stop'))
    expect(stop).toBeDefined()
    await stop!.trigger('click')
    expect(wrapper.emitted('stop')).toHaveLength(1)
  })
})
