/**
 * ParticipantActionsMenu — what a trainer may do to one participant (#384),
 * shared by the class members list and the live wall.
 *
 * The menu is presentational: it decides which items show for the
 * participant's terminals and blocks and for the viewer's rights, asks first
 * where an action is disruptive (BaseModal), and emits the confirmed action.
 * The page wires the emits to useParticipantControls.
 *
 * Who sees what:
 * - actions only target participants (class role `member`), never the viewer;
 * - a platform admin sees them on everyone, with the AdminBadge whenever the
 *   admin role is the reason they are offered;
 * - the organisation block belongs to the organisation's managers / owners; a
 *   class manager reads an organisation block, they do not lift it.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'

import ParticipantActionsMenu from '../../src/components/Groups/ParticipantActionsMenu.vue'

const GROUP_ID = 'grp-1'
const ORG_ID = 'org-1'

type Session = {
  session_id: string
  state: string
  network_feature: boolean
  network_disabled: boolean
}

function participant(overrides: Record<string, unknown> = {}, sessions: Session[] = []) {
  return {
    user_id: 'u-karim',
    user_name: 'Karim',
    role: 'member',
    class_block: null,
    org_block: null,
    global_block: false,
    sessions,
    ...overrides
  }
}

const running = (overrides: Partial<Session> = {}): Session => ({
  session_id: 's-run',
  state: 'running',
  network_feature: true,
  network_disabled: false,
  ...overrides
})

const CLASS_MANAGER = { userId: 'u-marc', isPlatformAdmin: false, managesClass: true, managesOrg: false }
const ORG_MANAGER = { userId: 'u-nadia', isPlatformAdmin: false, managesClass: true, managesOrg: true }
const ADMIN_ONLY = { userId: 'u-admin', isPlatformAdmin: true, managesClass: false, managesOrg: false }

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/classes/:id/live', name: 'ClassLive', component: { template: '<div />' } },
      { path: '/terminal-session/:sessionId', name: 'TerminalSessionView', component: { template: '<div />' } }
    ]
  })
}

const BaseModalStub = {
  name: 'BaseModal',
  props: ['visible', 'title', 'size'],
  emits: ['close'],
  template: '<div v-if="visible" class="base-modal-stub"><div class="base-modal-title">{{ title }}</div><slot /><div class="base-modal-footer"><slot name="footer" /></div></div>'
}

const AdminBadgeStub = {
  name: 'AdminBadge',
  props: ['iconOnly', 'tooltip'],
  template: '<span class="admin-badge-stub" />'
}

async function mountMenu(props: Record<string, unknown>, options: { slot?: string; locale?: 'en' | 'fr' } = {}) {
  const router = createTestRouter()
  await router.push('/')
  await router.isReady()
  const wrapper = mount(ParticipantActionsMenu, {
    props: {
      groupId: GROUP_ID,
      organizationId: ORG_ID,
      participant: participant({}, [running()]),
      participantRole: 'member',
      viewer: CLASS_MANAGER,
      context: 'members',
      ...props
    },
    slots: options.slot ? { default: options.slot } : undefined,
    attachTo: document.body,
    global: {
      plugins: [createTestI18n(options.locale), router],
      stubs: { BaseModal: BaseModalStub, AdminBadge: AdminBadgeStub }
    }
  })
  await flushPromises()
  return wrapper
}

/** Opens the ⋯ menu; returns false when there is no menu at all. */
async function openMenu(wrapper: VueWrapper): Promise<boolean> {
  const trigger = wrapper.find('.ocf-dropdown .dropdown-trigger')
  if (!trigger.exists()) return false
  await trigger.trigger('click')
  await flushPromises()
  return true
}

function item(wrapper: VueWrapper, name: string) {
  return wrapper.find(`[data-testid="participant-action-${name}"]`)
}

async function clickItem(wrapper: VueWrapper, name: string) {
  if (!wrapper.find('.ocf-dropdown-menu').exists()) await openMenu(wrapper)
  const target = item(wrapper, name)
  expect(target.exists(), `participant-action-${name} is offered`).toBe(true)
  await target.trigger('click')
  await flushPromises()
}

function modal(wrapper: VueWrapper) {
  return wrapper.find('.base-modal-stub')
}

async function confirm(wrapper: VueWrapper) {
  const button = wrapper.find('[data-testid="participant-confirm"]')
  expect(button.exists(), 'the dialog has a confirm button').toBe(true)
  await button.trigger('click')
  await flushPromises()
}

const ACTIONS = ['cut-internet', 'restore-internet', 'stop', 'block-class', 'unblock-class', 'block-org', 'unblock-org']

function offeredActions(wrapper: VueWrapper): string[] {
  return ACTIONS.filter(name => item(wrapper, name).exists())
}

describe('ParticipantActionsMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('items per terminal state', () => {
    it('offers cut internet and stop on a running session with internet', async () => {
      const wrapper = await mountMenu({})
      await openMenu(wrapper)

      expect(offeredActions(wrapper)).toEqual(['cut-internet', 'stop', 'block-class'])
    })

    it('offers restore, not cut, once internet is off', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ network_disabled: true })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'restore-internet').exists()).toBe(true)
      expect(item(wrapper, 'cut-internet').exists()).toBe(false)
    })

    it('offers no internet item on a session without the internet feature', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ network_feature: false })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'cut-internet').exists()).toBe(false)
      expect(item(wrapper, 'restore-internet').exists()).toBe(false)
      expect(item(wrapper, 'stop').exists()).toBe(true)
    })

    it('offers internet but not stop on a stopped session', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ state: 'stopped' })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'cut-internet').exists()).toBe(true)
      expect(item(wrapper, 'stop').exists()).toBe(false)
    })

    it('ignores deleted sessions', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ state: 'deleted' })]) })
      await openMenu(wrapper)

      expect(offeredActions(wrapper)).toEqual(['block-class'])
      expect(item(wrapper, 'watch').exists()).toBe(false)
      expect(item(wrapper, 'open-session').exists()).toBe(false)
    })

    it('offers unblock, not block, when the participant is blocked in the class', async () => {
      const wrapper = await mountMenu({
        participant: participant({ class_block: { reason: 'Exam', blocked_by: 'u-marc', created_at: '2026-11-14T10:00:00Z' } })
      })
      await openMenu(wrapper)

      expect(item(wrapper, 'unblock-class').exists()).toBe(true)
      expect(item(wrapper, 'block-class').exists()).toBe(false)
    })
  })

  describe('items per viewer', () => {
    it('gives a class manager no organisation item', async () => {
      const wrapper = await mountMenu({ viewer: CLASS_MANAGER })
      await openMenu(wrapper)

      expect(item(wrapper, 'block-org').exists()).toBe(false)
      expect(item(wrapper, 'unblock-org').exists()).toBe(false)
    })

    it('shows a class manager an organisation block read-only', async () => {
      const wrapper = await mountMenu({
        viewer: CLASS_MANAGER,
        participant: participant({ org_block: { reason: 'Unpaid', blocked_by: 'u-nadia', created_at: '2026-11-14T10:00:00Z' } })
      })
      await openMenu(wrapper)

      const readOnly = wrapper.find('[data-testid="participant-org-block-readonly"]')
      expect(readOnly.exists()).toBe(true)
      expect(readOnly.text()).toMatch(/organi[sz]ation/i)
      expect(readOnly.element.tagName).not.toBe('BUTTON')
      expect(item(wrapper, 'unblock-org').exists()).toBe(false)
    })

    it('gives an organisation manager the organisation block, without the admin badge', async () => {
      const wrapper = await mountMenu({ viewer: ORG_MANAGER })
      await openMenu(wrapper)

      expect(item(wrapper, 'block-org').exists()).toBe(true)
      expect(wrapper.findAllComponents({ name: 'AdminBadge' })).toHaveLength(0)
    })

    it('lets an organisation manager lift an organisation block', async () => {
      const wrapper = await mountMenu({
        viewer: ORG_MANAGER,
        participant: participant({ org_block: { reason: 'Unpaid', blocked_by: 'u-nadia', created_at: '2026-11-14T10:00:00Z' } })
      })
      await openMenu(wrapper)

      expect(item(wrapper, 'unblock-org').exists()).toBe(true)
      expect(wrapper.find('[data-testid="participant-org-block-readonly"]').exists()).toBe(false)
    })

    it('badges every item an admin gets only as admin', async () => {
      const wrapper = await mountMenu({ viewer: ADMIN_ONLY })
      await openMenu(wrapper)

      for (const name of ['cut-internet', 'stop', 'block-class', 'block-org']) {
        expect(
          item(wrapper, name).findComponent({ name: 'AdminBadge' }).exists(),
          `${name} carries the admin badge`
        ).toBe(true)
      }
    })

    it('badges only the organisation items of an admin who manages the class', async () => {
      const wrapper = await mountMenu({ viewer: { ...CLASS_MANAGER, isPlatformAdmin: true } })
      await openMenu(wrapper)

      expect(item(wrapper, 'stop').findComponent({ name: 'AdminBadge' }).exists()).toBe(false)
      expect(item(wrapper, 'block-class').findComponent({ name: 'AdminBadge' }).exists()).toBe(false)
      expect(item(wrapper, 'block-org').findComponent({ name: 'AdminBadge' }).exists()).toBe(true)
    })

    it('offers nothing on a trainer’s row to a class manager', async () => {
      const wrapper = await mountMenu({ participantRole: 'manager', viewer: CLASS_MANAGER })

      expect(await openMenu(wrapper), 'no ⋯ menu at all when it would be empty').toBe(false)
    })

    it('offers an admin the actions on a trainer’s row, badged', async () => {
      const wrapper = await mountMenu({
        participantRole: 'owner',
        viewer: { ...ORG_MANAGER, isPlatformAdmin: true }
      })
      await openMenu(wrapper)

      expect(item(wrapper, 'stop').exists()).toBe(true)
      expect(item(wrapper, 'stop').findComponent({ name: 'AdminBadge' }).exists()).toBe(true)
    })

    it('never offers the viewer actions on themselves, even as admin', async () => {
      const wrapper = await mountMenu({
        participant: participant({ user_id: 'u-admin' }, [running()]),
        viewer: ADMIN_ONLY
      })

      expect(await openMenu(wrapper)).toBe(false)
    })

    it('keeps the host page’s own items when it offers none of its own', async () => {
      const wrapper = await mountMenu(
        { participantRole: 'manager', viewer: CLASS_MANAGER },
        { slot: '<button class="ocf-dropdown-item" data-testid="host-item">Remove</button>' }
      )
      await openMenu(wrapper)

      expect(wrapper.find('[data-testid="host-item"]').exists()).toBe(true)
      expect(offeredActions(wrapper)).toEqual([])
    })

    it('puts its items beside the host page’s, in one menu', async () => {
      const wrapper = await mountMenu({}, {
        slot: '<button class="ocf-dropdown-item" data-testid="host-item">Remove</button>'
      })
      await openMenu(wrapper)

      expect(wrapper.findAll('.ocf-dropdown')).toHaveLength(1)
      const menu = wrapper.find('.ocf-dropdown-menu')
      expect(menu.find('[data-testid="host-item"]').exists()).toBe(true)
      expect(menu.find('[data-testid="participant-action-stop"]').exists()).toBe(true)
    })
  })

  describe('confirmations', () => {
    it('asks before stopping, and says the work is kept', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'stop')

      expect(wrapper.emitted('stop-sessions')).toBeUndefined()
      expect(modal(wrapper).exists()).toBe(true)
      expect(modal(wrapper).text()).toMatch(/kept|disk/i)

      await confirm(wrapper)
      expect(wrapper.emitted('stop-sessions')).toEqual([['u-karim']])
      expect(modal(wrapper).exists()).toBe(false)
    })

    it('emits nothing when the stop is cancelled', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'stop')

      await wrapper.find('[data-testid="participant-cancel"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('stop-sessions')).toBeUndefined()
      expect(modal(wrapper).exists()).toBe(false)
    })

    it('asks before cutting internet, and warns about exposed ports', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'cut-internet')

      expect(wrapper.emitted('set-network')).toBeUndefined()
      expect(modal(wrapper).text()).toMatch(/port/i)

      await confirm(wrapper)
      expect(wrapper.emitted('set-network')).toEqual([['u-karim', false]])
    })

    it('restores internet straight away', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ network_disabled: true })]) })
      await clickItem(wrapper, 'restore-internet')

      expect(wrapper.emitted('set-network')).toEqual([['u-karim', true]])
    })

    it('unblocks straight away', async () => {
      const wrapper = await mountMenu({
        participant: participant({ class_block: { reason: 'Exam', blocked_by: 'u-marc', created_at: '2026-11-14T10:00:00Z' } })
      })
      await clickItem(wrapper, 'unblock-class')

      expect(wrapper.emitted('set-class-block')).toEqual([['u-karim', { blocked: false }]])
    })

    it('words the French dialog in French', async () => {
      const en = await mountMenu({})
      await clickItem(en, 'stop')
      const enText = modal(en).text()
      en.unmount()

      const fr = await mountMenu({}, { locale: 'fr' })
      await clickItem(fr, 'stop')

      expect(modal(fr).text()).not.toBe(enText)
    })
  })

  describe('the block dialog', () => {
    it('ticks "also stop their running sessions" by default', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'block-class')

      const stopRunning = wrapper.find('[data-testid="participant-block-stop-running"]')
      expect(stopRunning.exists()).toBe(true)
      expect((stopRunning.element as HTMLInputElement).checked).toBe(true)

      await confirm(wrapper)
      const [[userId, change]] = wrapper.emitted('set-class-block') as [string, any][]
      expect(userId).toBe('u-karim')
      expect(change.blocked).toBe(true)
      expect(change.stop_running).toBe(true)
      expect(change.reason ?? '').toBe('')
    })

    it('sends the reason and an unticked stop option', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'block-class')

      await wrapper.find('[data-testid="participant-block-reason"]').setValue('  Exam in progress ')
      await wrapper.find('[data-testid="participant-block-stop-running"]').setValue(false)
      await confirm(wrapper)

      expect(wrapper.emitted('set-class-block')).toEqual([
        ['u-karim', { blocked: true, reason: 'Exam in progress', stop_running: false }]
      ])
    })

    it('caps the reason at 500 characters and counts them', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'block-class')

      const reason = wrapper.find('[data-testid="participant-block-reason"]')
      expect(reason.attributes('maxlength')).toBe('500')

      await reason.setValue('Exam start')
      expect(wrapper.find('[data-testid="participant-block-reason-count"]').text()).toMatch(/10\s*\/\s*500/)
    })

    it('blocks in the organisation through the same dialog', async () => {
      const wrapper = await mountMenu({ viewer: ORG_MANAGER })
      await clickItem(wrapper, 'block-org')

      await wrapper.find('[data-testid="participant-block-reason"]').setValue('Unpaid')
      await confirm(wrapper)

      expect(wrapper.emitted('set-org-block')).toEqual([
        ['u-karim', { blocked: true, reason: 'Unpaid', stop_running: true }]
      ])
      expect(wrapper.emitted('set-class-block')).toBeUndefined()
    })
  })

  describe('watching', () => {
    it('on the members list, links to the wall focused on the participant and to their session page', async () => {
      const wrapper = await mountMenu({ context: 'members' })
      await openMenu(wrapper)

      expect(item(wrapper, 'watch').attributes('href')).toBe(`/classes/${GROUP_ID}/live?view=wall&focus=s-run`)
      expect(item(wrapper, 'open-session').attributes('href')).toBe(`/terminal-session/s-run?group=${GROUP_ID}`)
    })

    it('on the wall, asks the wall to focus the participant', async () => {
      const wrapper = await mountMenu({ context: 'wall' })
      await clickItem(wrapper, 'watch')

      expect(wrapper.emitted('watch-screen')).toEqual([['s-run']])
    })

    it('in the focused view, offers neither: the screen and the page link are already there', async () => {
      const wrapper = await mountMenu({ context: 'focused' })
      await openMenu(wrapper)

      expect(item(wrapper, 'watch').exists()).toBe(false)
      expect(item(wrapper, 'open-session').exists()).toBe(false)
      expect(item(wrapper, 'stop').exists()).toBe(true)
    })

    it('does not offer to watch a stopped session, but still opens its page', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ state: 'stopped' })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'watch').exists()).toBe(false)
      expect(item(wrapper, 'open-session').exists()).toBe(true)
    })
  })
})
