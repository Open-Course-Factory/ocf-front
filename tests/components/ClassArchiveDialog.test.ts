/**
 * ClassArchiveDialog — archiving a class and offboarding the cohort that leaves
 * with it (ocf-core#491 / #492, ocf-front#330).
 *
 * The preview decides who may be offboarded here: a member still in another
 * open class of the organization keeps their access whatever the teacher
 * ticks, and one already offboarded has nothing left to switch.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const getArchivePreview = vi.fn()
const offboardMembers = vi.fn()
const archiveEntity = vi.fn()

vi.mock('../../src/services/domain/group', () => ({
  classArchiveService: { getArchivePreview: (...args: any[]) => getArchivePreview(...args) }
}))

vi.mock('../../src/services/domain/organization', () => ({
  organizationService: { offboardMembers: (...args: any[]) => offboardMembers(...args) }
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ archiveEntity: (...args: any[]) => archiveEntity(...args) })
}))

import ClassArchiveDialog from '../../src/components/Groups/ClassArchiveDialog.vue'

const group = { id: 'class-1', organization_id: 'org-1', display_name: 'DevOps 2026' }

const alice = { user_id: 'u-alice', email: 'alice@x.io', display_name: 'Alice', role: 'member', other_active_classes_in_org: 0, org_member_state: 'active' }
const bob = { user_id: 'u-bob', email: 'bob@x.io', display_name: 'Bob', role: 'member', other_active_classes_in_org: 2, org_member_state: 'active' }
const carla = { user_id: 'u-carla', email: 'carla@x.io', display_name: 'Carla', role: 'member', other_active_classes_in_org: 0, org_member_state: 'offboarded' }
const dan = { user_id: 'u-dan', email: 'dan@x.io', display_name: 'Dan', role: 'member', other_active_classes_in_org: 0, org_member_state: 'active' }

function preview(overrides: Record<string, any> = {}) {
  // Deliberately out of order: the dialog has to sort, not the backend.
  return { retention_days: 365, members: [bob, alice, carla, dan], ...overrides }
}

function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

async function mountDialog(locale = 'en') {
  const wrapper = mount(ClassArchiveDialog, {
    props: { visible: true, group },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: {
        BaseModal: {
          name: 'BaseModal',
          template: '<div class="base-modal-stub" v-if="visible"><slot /><button class="confirm-stub" :disabled="confirmDisabled" @click="$emit(\'confirm\')">{{ confirmText }}</button></div>',
          props: ['visible', 'title', 'titleIcon', 'size', 'showDefaultFooter', 'confirmText',
                  'confirmIcon', 'confirmDisabled', 'cancelText', 'isLoading', 'loadingText'],
          emits: ['close', 'confirm']
        }
      }
    }
  })
  await flushPromises()
  return wrapper
}

const rowNames = (wrapper: any) =>
  wrapper.findAll('[data-test="archive-member"]').map((row: any) => row.find('[data-test="member-name"]').text())

describe('ClassArchiveDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getArchivePreview.mockResolvedValue(preview())
    archiveEntity.mockResolvedValue({ ...group, archived_at: '2026-09-03T10:00:00Z' })
    offboardMembers.mockResolvedValue(undefined)
  })

  it('loads the preview of the class it was opened for', async () => {
    await mountDialog()
    expect(getArchivePreview).toHaveBeenCalledWith('class-1')
  })

  it('lists the members who are in no other open class first', async () => {
    const wrapper = await mountDialog()
    expect(rowNames(wrapper)).toEqual(['Alice', 'Dan', 'Bob', 'Carla'])
  })

  it('greys out a member still in other classes and says why, with no switch', async () => {
    const wrapper = await mountDialog()
    const bobRow = wrapper.findAll('[data-test="archive-member"]')[2]

    expect(bobRow.classes()).toContain('ocf-archive-member--kept')
    expect(bobRow.find('[data-test="member-reason"]').text()).toBe('In 2 other open classes of the organization')
    expect(bobRow.find('[data-test="member-left"]').exists()).toBe(false)
  })

  it('shows an already offboarded member as such, with no switch', async () => {
    const wrapper = await mountDialog()
    const carlaRow = wrapper.findAll('[data-test="archive-member"]')[3]

    expect(carlaRow.find('[data-test="member-reason"]').text()).toBe('Already offboarded')
    expect(carlaRow.find('[data-test="member-left"]').exists()).toBe(false)
  })

  it('starts every eligible member as continuing', async () => {
    const wrapper = await mountDialog()
    const switches = wrapper.findAll('[data-test="member-left"]')

    expect(switches).toHaveLength(2)
    switches.forEach(s => expect((s.element as HTMLInputElement).checked).toBe(false))
    expect(wrapper.find('[data-test="left-count"]').text()).toBe('No member will be offboarded')
  })

  it('marks the whole cohort as left in one click, and back', async () => {
    const wrapper = await mountDialog()

    await wrapper.find('[data-test="mark-all-left"]').trigger('click')
    wrapper.findAll('[data-test="member-left"]').forEach(s => expect((s.element as HTMLInputElement).checked).toBe(true))
    expect(wrapper.find('[data-test="left-count"]').text()).toBe('2 members will be offboarded')

    await wrapper.find('[data-test="mark-all-continuing"]').trigger('click')
    wrapper.findAll('[data-test="member-left"]').forEach(s => expect((s.element as HTMLInputElement).checked).toBe(false))
  })

  it('states the organization retention delay', async () => {
    const wrapper = await mountDialog()
    expect(wrapper.find('[data-test="retention-sentence"]').text())
      .toBe('Members marked as left lose access today; their accounts are erased after 365 days, the retention delay of the organization.')
  })

  it('falls back to the platform default when the preview carries no delay', async () => {
    getArchivePreview.mockResolvedValue(preview({ retention_days: undefined }))
    const wrapper = await mountDialog()
    expect(wrapper.find('[data-test="retention-sentence"]').text())
      .toBe('Members marked as left lose access today; their accounts are erased after the platform default retention delay.')
  })

  it('says it in French', async () => {
    const wrapper = await mountDialog('fr')
    expect(wrapper.find('[data-test="retention-sentence"]').text())
      .toBe('Les membres marqués comme partis perdent l’accès aujourd’hui ; leurs comptes sont effacés après 365 jours, le délai de conservation de l’organisation.')
  })

  it('archives the class, then offboards exactly the members marked as left', async () => {
    const wrapper = await mountDialog()
    const order: string[] = []
    archiveEntity.mockImplementation(async () => { order.push('archive'); return {} })
    offboardMembers.mockImplementation(async () => { order.push('offboard') })

    await wrapper.findAll('[data-test="member-left"]')[1].setValue(true)
    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()

    expect(archiveEntity).toHaveBeenCalledWith('/class-groups', 'class-1')
    expect(offboardMembers).toHaveBeenCalledWith('org-1', ['u-dan'])
    expect(order).toEqual(['archive', 'offboard'])
    expect(wrapper.emitted('archived')).toHaveLength(1)
  })

  it('does not call offboard when nobody left', async () => {
    const wrapper = await mountDialog()

    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()

    expect(archiveEntity).toHaveBeenCalledTimes(1)
    expect(offboardMembers).not.toHaveBeenCalled()
    expect(wrapper.emitted('archived')).toHaveLength(1)
  })

  it('shows the backend reason when archiving is refused and keeps the dialog open', async () => {
    const wrapper = await mountDialog()
    archiveEntity.mockRejectedValue({ response: { data: { error_message: 'you cannot manage this class' } } })

    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="archive-error"]').text()).toBe('you cannot manage this class')
    expect(offboardMembers).not.toHaveBeenCalled()
    expect(wrapper.emitted('archived')).toBeUndefined()
  })

  it('reports an offboarding refusal after the class was archived', async () => {
    const wrapper = await mountDialog()
    offboardMembers.mockRejectedValue({ response: { data: { error_message: 'an owner cannot be offboarded' } } })

    await wrapper.find('[data-test="mark-all-left"]').trigger('click')
    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="archive-error"]').text())
      .toBe('The class is archived, but offboarding failed: an owner cannot be offboarded')
    expect(wrapper.emitted('archived')).toHaveLength(1)
  })

  it('retries only the offboarding after such a failure', async () => {
    const wrapper = await mountDialog()
    offboardMembers.mockRejectedValueOnce({ response: { data: { error_message: 'temporary' } } })

    await wrapper.find('[data-test="mark-all-left"]').trigger('click')
    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()
    await wrapper.find('.confirm-stub').trigger('click')
    await flushPromises()

    expect(archiveEntity).toHaveBeenCalledTimes(1)
    expect(offboardMembers).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('archived')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.find('[data-test="archive-error"]').text()).toBe('')
  })

  it('cannot confirm while the preview failed to load', async () => {
    getArchivePreview.mockRejectedValue({ response: { data: { error_message: 'preview unavailable' } } })
    const wrapper = await mountDialog()

    expect(wrapper.find('[data-test="archive-error"]').text()).toBe('preview unavailable')
    expect((wrapper.find('.confirm-stub').element as HTMLButtonElement).disabled).toBe(true)
  })
})
