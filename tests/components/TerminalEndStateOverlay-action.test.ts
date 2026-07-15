/**
 * Tests for TerminalEndStateOverlay's action-vs-route button rendering.
 *
 * The end-state overlay historically rendered every button as a <router-link>
 * (navigation only). The live-session reconnect feature (ocf-front #278) needs
 * the primary button to trigger an in-place ACTION (reconnect) rather than a
 * route change. These tests pin that contract:
 *   - a config with primaryActionKey renders a <button> that emits `action`
 *     with the key (RED today — the overlay only knows router-links)
 *   - a plain route config still renders a <router-link> (regression fence)
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TerminalEndStateOverlay from '../../src/components/Terminal/TerminalEndStateOverlay.vue'
import type { EndStateConfig } from '../../src/composables/useEndStateConfig'

const routerLinkStub = {
  props: ['to'],
  template: '<a class="router-link-stub" :data-to="JSON.stringify(to)"><slot /></a>'
}

function mountOverlay(reason: string, config: EndStateConfig) {
  return mount(TerminalEndStateOverlay, {
    props: { reason, config },
    global: {
      stubs: { 'router-link': routerLinkStub, RouterLink: routerLinkStub }
    }
  })
}

const actionConfig: EndStateConfig = {
  icon: 'fas fa-plug',
  tone: 'warning',
  title: 'Terminal Disconnected',
  body: 'Your terminal connection was lost, but your environment is still running.',
  primaryLabel: 'Reconnect',
  primaryRoute: { name: 'TerminalSessions' },
  primaryActionKey: 'reconnect',
  secondaryLabel: 'Back to Sessions',
  secondaryRoute: { name: 'TerminalSessions' }
}

const routeConfig: EndStateConfig = {
  icon: 'fas fa-trophy',
  tone: 'success',
  title: 'Session Complete',
  body: 'Well done!',
  primaryLabel: 'View My Scenarios',
  primaryRoute: { name: 'MyScenarios' },
  secondaryLabel: 'Back to Sessions',
  secondaryRoute: { name: 'TerminalSessions' }
}

describe('TerminalEndStateOverlay — action buttons', () => {
  it('renders the primary as a <button> and emits `action` with the key when clicked', async () => {
    const wrapper = mountOverlay('disconnected', actionConfig)

    const primary = wrapper.find('button.end-state-btn')
    expect(primary.exists()).toBe(true)
    expect(primary.text()).toContain('Reconnect')

    await primary.trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')![0]).toEqual(['reconnect'])
  })

  it('still renders the secondary route as a router-link when it has no action key', () => {
    const wrapper = mountOverlay('disconnected', actionConfig)

    const secondary = wrapper.find('a.router-link-stub')
    expect(secondary.exists()).toBe(true)
    expect(secondary.text()).toContain('Back to Sessions')
  })

  it('regression: a plain route config renders the primary as a router-link (no button)', () => {
    const wrapper = mountOverlay('completed', routeConfig)

    expect(wrapper.find('button.end-state-btn').exists()).toBe(false)
    const links = wrapper.findAll('a.router-link-stub')
    expect(links.length).toBe(2)
    expect(links[0].text()).toContain('View My Scenarios')
  })
})
