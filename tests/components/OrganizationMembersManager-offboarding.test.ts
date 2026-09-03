/**
 * Offboarded members in the organization members view (ocf-core#492): the
 * state column tells active from offboarded, an offboarded row offers
 * Reinstate to managers and Erase now to the owner, and a backend refusal is
 * shown as the backend phrased it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

const reinstateMember = vi.fn()
const eraseMember = vi.fn()
vi.mock('../../src/services/domain/organization', () => ({
  organizationService: {
    reinstateMember: (...a: any[]) => reinstateMember(...a),
    eraseMember: (...a: any[]) => eraseMember(...a)
  }
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue([]) }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'current-user-id', userRoles: [], isLoggedIn: true })
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ success: (...a: any[]) => toastSuccess(...a), error: (...a: any[]) => toastError(...a) })
}))

vi.mock('../../src/composables/useFormatters', () => ({
  useFormatters: () => ({ formatDate: (date: string) => `on ${date.slice(0, 10)}` })
}))

import OrganizationMembersManager from '../../src/components/Organizations/OrganizationMembersManager.vue'

const active = {
  id: 'm-1', user_id: 'u-1', role: 'member', is_active: true, joined_at: '2026-01-01T00:00:00Z',
  user: { id: 'u-1', email: 'jane@example.com', display_name: 'Jane' }
}
const offboarded = {
  id: 'm-2', user_id: 'u-2', role: 'member', is_active: false, joined_at: '2025-09-01T00:00:00Z',
  left_at: '2026-06-30T00:00:00Z', scheduled_erasure_at: '2027-06-30T00:00:00Z', erasure_blocked_reason: '',
  user: { id: 'u-2', email: 'sam@example.com', display_name: 'Sam' }
}
const blocked = {
  ...offboarded, id: 'm-3', user_id: 'u-3', erasure_blocked_reason: 'member is still active in another organization',
  user: { id: 'u-3', email: 'kim@example.com', display_name: 'Kim' }
}

function mountManager(props: Record<string, any> = {}) {
  setActivePinia(createPinia())
  return mount(OrganizationMembersManager, {
    props: { organizationId: 'org-77', canManage: true, isOwner: false, maxMembers: 10, ...props },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        BaseModal: {
          name: 'BaseModal',
          template: '<div class="base-modal-stub" v-if="visible"><slot /><slot name="footer" /></div>',
          props: ['visible', 'title', 'titleIcon', 'size', 'showDefaultFooter', 'confirmText', 'confirmIcon', 'cancelText', 'isLoading', 'loadingText'],
          emits: ['close', 'confirm']
        },
        AdminBadge: { template: '<span />', props: ['iconOnly', 'tooltip'] }
      }
    }
  })
}

const rowOf = (wrapper: any, name: string) =>
  wrapper.findAll('.member-card').find((card: any) => card.text().includes(name))

describe('OrganizationMembersManager offboarded members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axios.get).mockResolvedValue({ data: [offboarded, active, blocked] })
    reinstateMember.mockResolvedValue(undefined)
    eraseMember.mockResolvedValue(undefined)
  })

  it('shows every row with its state, active members first', async () => {
    const wrapper = mountManager()
    await flushPromises()

    const states = wrapper.findAll('[data-test="member-state"]').map(s => s.text())
    expect(states[0]).toBe('Active')
    expect(states[1]).toContain('Offboarded')
    expect(states[2]).toContain('Offboarded')
  })

  it('counts only active members against the seat limit', async () => {
    const wrapper = mountManager()
    await flushPromises()

    expect(wrapper.find('.member-count').text()).toBe('1 / 10 members')
  })

  it('states the erasure date of an offboarded member', async () => {
    const wrapper = mountManager()
    await flushPromises()

    expect(rowOf(wrapper, 'Sam').find('[data-test="member-state"]').text()).toContain('Erasure on 2027-06-30')
  })

  it('states why erasure is blocked, in the backend words', async () => {
    const wrapper = mountManager({ isOwner: true })
    await flushPromises()
    const row = rowOf(wrapper, 'Kim')

    expect(row.find('[data-test="member-state"]').text()).toContain('member is still active in another organization')
    expect(row.find('[data-test="erase-member"]').exists()).toBe(false)
  })

  it('offers Reinstate to a manager on an offboarded row, not the role select nor Remove', async () => {
    const wrapper = mountManager()
    await flushPromises()
    const row = rowOf(wrapper, 'Sam')

    expect(row.find('[data-test="reinstate-member"]').exists()).toBe(true)
    expect(row.find('select.role-select').exists()).toBe(false)
    expect(row.find('button.btn-danger').exists()).toBe(false)
    expect(row.find('[data-test="erase-member"]').exists()).toBe(false)
  })

  it('reinstates through the organization route and reloads', async () => {
    const wrapper = mountManager()
    await flushPromises()

    await rowOf(wrapper, 'Sam').find('[data-test="reinstate-member"]').trigger('click')
    await flushPromises()

    expect(reinstateMember).toHaveBeenCalledWith('org-77', 'u-2')
    expect(axios.get).toHaveBeenCalledTimes(2)
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('offers Erase now to the owner only when nothing blocks it, behind a confirmation naming the consequence', async () => {
    const wrapper = mountManager({ isOwner: true })
    await flushPromises()

    await rowOf(wrapper, 'Sam').find('[data-test="erase-member"]').trigger('click')
    const modal = wrapper.find('[data-test="erase-confirm"]')

    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('Sam')
    expect(modal.text()).toContain('permanently deletes')
    expect(eraseMember).not.toHaveBeenCalled()

    wrapper.findAllComponents({ name: 'BaseModal' }).find(m => m.props('visible') && m.attributes('data-test') === 'erase-confirm')!.vm.$emit('confirm')
    await flushPromises()

    expect(eraseMember).toHaveBeenCalledWith('org-77', 'u-2')
    expect(axios.get).toHaveBeenCalledTimes(2)
  })

  it('surfaces a 409 reason verbatim', async () => {
    eraseMember.mockRejectedValue({ response: { status: 409, data: { error_message: 'user owns organizations' } } })
    const wrapper = mountManager({ isOwner: true })
    await flushPromises()

    await rowOf(wrapper, 'Sam').find('[data-test="erase-member"]').trigger('click')
    wrapper.findAllComponents({ name: 'BaseModal' }).find(m => m.props('visible') && m.attributes('data-test') === 'erase-confirm')!.vm.$emit('confirm')
    await flushPromises()

    expect(toastError).toHaveBeenCalledWith('user owns organizations')
  })

  it('offers no Reinstate to someone who cannot manage members', async () => {
    const wrapper = mountManager({ canManage: false })
    await flushPromises()

    expect(rowOf(wrapper, 'Sam').find('[data-test="reinstate-member"]').exists()).toBe(false)
  })
})
