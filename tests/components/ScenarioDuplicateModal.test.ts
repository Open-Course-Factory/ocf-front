/**
 * A scenario someone may only read — a platform scenario, say — is copied into
 * an organization or class they manage, and the editor opens the copy.
 *
 * Each destination has its own endpoint, and the copy never goes onto the
 * platform. Which organizations and classes qualify is copyScopesFor's rule
 * (useScenarioCreateScopes-copy.test.ts); here it is stubbed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed } from 'vue'
import { createTestI18n } from '../helpers/entityModalHelper'

const postMock = vi.fn()
vi.mock('axios', () => ({ default: { post: (...args: any[]) => postMock(...args) } }))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn() })
}))

const OWN_ORG = { kind: 'org' as const, id: 'org-own', name: 'Where it lives' }
const ORG = { kind: 'org' as const, id: 'org-1', name: 'Labinux' }
const GROUP = { kind: 'group' as const, id: 'grp-1', name: 'Test Class' }
const SCOPES: Record<string, any> = { [`org:${ORG.id}`]: ORG, [`org:${OWN_ORG.id}`]: OWN_ORG, [`group:${GROUP.id}`]: GROUP, 'platform:*': { kind: 'platform' } }
vi.mock('../../src/composables/useScenarioCreateScopes', () => ({
  useScenarioCreateScopes: () => ({
    orgScopes: computed(() => [ORG, OWN_ORG].map(o => ({ id: o.id, name: o.name }))),
    groupScopes: computed(() => [{ id: GROUP.id, name: GROUP.name }]),
    platformScopeAvailable: computed(() => true),
    parseScopeKey: (key: string) => SCOPES[key] ?? null,
    copyScopesFor: () => ({ orgs: [ORG], groups: [{ id: GROUP.id, name: GROUP.name }] })
  })
}))

import ScenarioDuplicateModal from '../../src/components/ScenarioEditor/ScenarioDuplicateModal.vue'

function mountModal(scenario = { id: 'sc-public', organization_id: OWN_ORG.id }) {
  return mount(ScenarioDuplicateModal, {
    props: { visible: true, scenario },
    global: { plugins: [createTestI18n()] },
    attachTo: document.body
  })
}

const confirm = (wrapper: ReturnType<typeof mountModal>) =>
  wrapper.get('.base-modal-footer .btn-primary')

beforeEach(() => postMock.mockReset().mockResolvedValue({ data: { id: 'sc-copy', title: 'Copy' } }))

describe('ScenarioDuplicateModal', () => {
  it('offers the copy destinations, never the platform', () => {
    const wrapper = mountModal()
    const values = wrapper.findAll('#duplicate-target option').map(o => o.attributes('value')).filter(Boolean)
    expect(values).toEqual([`org:${ORG.id}`, `group:${GROUP.id}`])
    wrapper.unmount()
  })

  it('cannot copy before a destination is chosen', async () => {
    const wrapper = mountModal()
    expect(confirm(wrapper).attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('copies into an organization and hands back the copy', async () => {
    const wrapper = mountModal()
    await wrapper.get('#duplicate-target').setValue(`org:${ORG.id}`)
    await confirm(wrapper).trigger('click')
    await flushPromises()

    expect(postMock).toHaveBeenCalledWith('/organizations/org-1/scenarios/sc-public/duplicate')
    expect(wrapper.emitted('duplicated')).toEqual([[{ id: 'sc-copy', title: 'Copy' }]])
    wrapper.unmount()
  })

  it('copies into a class through the class endpoint', async () => {
    const wrapper = mountModal()
    await wrapper.get('#duplicate-target').setValue(`group:${GROUP.id}`)
    await confirm(wrapper).trigger('click')
    await flushPromises()

    expect(postMock).toHaveBeenCalledWith('/groups/grp-1/scenarios/sc-public/duplicate')
    wrapper.unmount()
  })

  it('stays open, handing back nothing, when the copy is refused', async () => {
    postMock.mockRejectedValueOnce({ response: { status: 403, data: { error_message: 'no' } } })
    const wrapper = mountModal()
    await wrapper.get('#duplicate-target').setValue(`org:${ORG.id}`)
    await confirm(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.emitted('duplicated')).toBeUndefined()
    wrapper.unmount()
  })
})
