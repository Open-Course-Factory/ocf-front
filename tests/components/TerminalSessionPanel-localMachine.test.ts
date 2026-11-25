/**
 * A run on a machine in the learner's browser has no container behind it, so
 * the panel shows what only the browser machine has: no command history (it is
 * recorded by tt-backend) and no pop-out window (the machine lives in this tab).
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TerminalSessionPanel from '../../src/components/Terminal/TerminalSessionPanel.vue'

const TerminalViewerStub = {
  name: 'TerminalViewer',
  props: ['popMode', 'machine'],
  template: '<div class="viewer-stub" :data-pop-mode="String(popMode)" :data-machine="machine"></div>'
}

function mountPanel(props: Record<string, unknown>) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
  return mount(TerminalSessionPanel, {
    props: { sessionInfo: { session_id: 'sess-1' }, isActive: true, ...props },
    global: { plugins: [i18n], stubs: { TerminalViewer: TerminalViewerStub, CommandHistory: true, ValidatedFlags: true } }
  })
}

describe('TerminalSessionPanel on a local machine', () => {
  it('opens the console on the local machine, without pop-out nor command history', () => {
    const wrapper = mountPanel({ machine: 'local' })
    const viewer = wrapper.find('.viewer-stub')
    expect(viewer.attributes('data-machine')).toBe('local')
    expect(viewer.attributes('data-pop-mode')).toBe('undefined')
    expect(wrapper.findComponent({ name: 'CommandHistory' }).exists()).toBe(false)
  })

  it('keeps both for a container', () => {
    const wrapper = mountPanel({})
    const viewer = wrapper.find('.viewer-stub')
    expect(viewer.attributes('data-machine')).toBe('incus')
    expect(viewer.attributes('data-pop-mode')).toBe('out')
    expect(wrapper.findComponent({ name: 'CommandHistory' }).exists()).toBe(true)
  })
})
