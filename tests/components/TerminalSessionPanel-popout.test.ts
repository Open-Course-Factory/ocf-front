/**
 * Popping the console out of the page and back in.
 *
 * The page swaps its console for a placeholder while the popup is open, asks
 * the popup to close when "Bring it back" is clicked, and remounts the console
 * once the popup is gone, however it was closed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TerminalSessionPanel from '../../src/components/Terminal/TerminalSessionPanel.vue'
import { POP_IN_MESSAGE } from '../../src/composables/useTerminalPopout'

const TerminalViewerStub = {
  name: 'TerminalViewer',
  props: ['popMode'],
  emits: ['pop'],
  template: '<div class="viewer-stub" :data-pop-mode="popMode" @click="$emit(\'pop\')"></div>'
}

function mountPanel() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
  return mount(TerminalSessionPanel, {
    props: { sessionInfo: { session_id: 'sess-1' }, isActive: true, showHistory: false },
    global: {
      plugins: [i18n],
      stubs: { TerminalViewer: TerminalViewerStub, CommandHistory: true, ValidatedFlags: true }
    }
  })
}

describe('TerminalSessionPanel pop-out', () => {
  let popup: { closed: boolean; postMessage: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.useFakeTimers()
    popup = { closed: false, postMessage: vi.fn() }
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('offers the pop-out button on the inline console', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.viewer-stub').attributes('data-pop-mode')).toBe('out')
  })

  it('opens the session in a marked popup and shows a placeholder instead of the console', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.viewer-stub').trigger('click')

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('/terminal/sess-1?header=true&footer=false&popout=1'),
      'ocf-terminal-sess-1',
      expect.any(String)
    )
    expect(wrapper.find('.viewer-stub').exists()).toBe(false)
    expect(wrapper.find('[data-testid="terminal-popped-out"]').exists()).toBe(true)
  })

  it('asks the popup to close itself, then brings the console back once it has', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.viewer-stub').trigger('click')

    await wrapper.find('[data-testid="terminal-pop-in"]').trigger('click')
    expect(popup.postMessage).toHaveBeenCalledWith(POP_IN_MESSAGE, window.location.origin)

    popup.closed = true
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(wrapper.find('.viewer-stub').exists()).toBe(true)
  })

  it('sends the pop-in request again while the popup is still open, since a loading popup drops it', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.viewer-stub').trigger('click')
    await wrapper.find('[data-testid="terminal-pop-in"]').trigger('click')

    vi.advanceTimersByTime(1100)
    expect(popup.postMessage.mock.calls.length).toBeGreaterThanOrEqual(3)

    popup.closed = true
    vi.advanceTimersByTime(600)
    const sent = popup.postMessage.mock.calls.length
    vi.advanceTimersByTime(2000)
    expect(popup.postMessage.mock.calls.length).toBe(sent)
  })

  it('brings the console back when the user closes the popup window', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.viewer-stub').trigger('click')

    popup.closed = true
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(wrapper.find('.viewer-stub').exists()).toBe(true)
  })

  it('keeps the console in the page when the browser blocks the popup', async () => {
    vi.mocked(window.open).mockReturnValue(null)
    const wrapper = mountPanel()
    await wrapper.find('.viewer-stub').trigger('click')
    expect(wrapper.find('.viewer-stub').exists()).toBe(true)
  })
})
