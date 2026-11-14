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
  persistence_mode: 'persistent' | 'ephemeral'
}

function participant(overrides: Record<string, unknown> = {}, sessions: Session[] = []) {
  return {
    user_id: 'u-karim',
    user_name: 'Karim',
    role: 'member',
    class_block: null,
    org_blocked: false,
    global_block: false,
    network_cut: false,
    sessions,
    ...overrides
  }
}

const running = (overrides: Partial<Session> = {}): Session => ({
  session_id: 's-run',
  state: 'running',
  network_feature: true,
  network_disabled: false,
  persistence_mode: 'persistent',
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

// Mirrors BaseModal: its default footer (confirm in its variant, cancel, their
// test ids) unless a footer slot replaces it.
const BaseModalStub = {
  name: 'BaseModal',
  props: ['visible', 'title', 'size', 'showDefaultFooter', 'confirmText', 'cancelText', 'confirmVariant', 'confirmTestId', 'cancelTestId'],
  emits: ['close', 'confirm'],
  template: '<div v-if="visible" class="base-modal-stub"><div class="base-modal-title">{{ title }}</div><slot /><div class="base-modal-footer"><slot name="footer"><button v-if="showDefaultFooter && confirmText" type="button" :class="[\'base-modal-confirm\', confirmVariant === \'danger\' ? \'btn-danger\' : \'btn-primary\']" :data-testid="confirmTestId" @click="$emit(\'confirm\')">{{ confirmText }}</button><button v-if="showDefaultFooter && cancelText" type="button" class="base-modal-cancel" :data-testid="cancelTestId" @click="$emit(\'close\')">{{ cancelText }}</button></slot></div></div>'
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

    it('offers restore, not cut, once the participant’s internet is cut', async () => {
      const wrapper = await mountMenu({
        participant: participant({ network_cut: true }, [running({ network_disabled: true })])
      })
      await openMenu(wrapper)

      expect(item(wrapper, 'restore-internet').exists()).toBe(true)
      expect(item(wrapper, 'cut-internet').exists()).toBe(false)
    })

    it('offers both when one session is cut but the participant is not', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ network_disabled: true })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'restore-internet').exists()).toBe(true)
      expect(item(wrapper, 'cut-internet').exists()).toBe(true)
    })

    it('offers the cut on a session without the internet feature: it holds for their next sessions', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ network_feature: false })]) })
      await openMenu(wrapper)

      expect(item(wrapper, 'cut-internet').exists()).toBe(true)
      expect(item(wrapper, 'restore-internet').exists()).toBe(false)
      expect(item(wrapper, 'stop').exists()).toBe(true)
    })

    it('offers the cut to a participant with no session at all', async () => {
      const wrapper = await mountMenu({ participant: participant({}, []) })
      await clickItem(wrapper, 'cut-internet')
      await confirm(wrapper)

      expect(wrapper.emitted('set-network')).toEqual([['u-karim', false]])
    })

    it('offers restore to a participant cut with no session at all', async () => {
      const wrapper = await mountMenu({ participant: participant({ network_cut: true }, []) })
      await openMenu(wrapper)

      expect(item(wrapper, 'restore-internet').exists()).toBe(true)
      expect(item(wrapper, 'cut-internet').exists()).toBe(false)
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

      expect(offeredActions(wrapper)).toEqual(['cut-internet', 'block-class'])
      expect(item(wrapper, 'watch').exists()).toBe(false)
      expect(item(wrapper, 'open-session').exists()).toBe(false)
    })

    it('offers unblock, not block, when the participant is blocked in the class', async () => {
      const wrapper = await mountMenu({
        participant: participant({ class_block: { reason: 'Exam' } })
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
        participant: participant({ org_blocked: true })
      })
      await openMenu(wrapper)

      const readOnly = wrapper.find('[data-testid="participant-org-block-readonly"]')
      expect(readOnly.exists()).toBe(true)
      expect(readOnly.text()).toMatch(/organi[sz]ation/i)
      expect(readOnly.element.tagName).not.toBe('BUTTON')
      expect(readOnly.attributes('title')).toBeUndefined()
      expect(item(wrapper, 'unblock-org').exists()).toBe(false)
    })

    it('shows a class manager no organisation note when the organisation has not blocked them', async () => {
      const wrapper = await mountMenu({ viewer: CLASS_MANAGER, participant: participant({ org_blocked: false }, [running()]) })
      await openMenu(wrapper)

      expect(wrapper.find('[data-testid="participant-org-block-readonly"]').exists()).toBe(false)
    })

    it('lifts the organisation block from the flag alone', async () => {
      const wrapper = await mountMenu({ viewer: ORG_MANAGER, participant: participant({ org_blocked: true }, [running()]) })
      await clickItem(wrapper, 'unblock-org')

      expect(wrapper.emitted('set-org-block')).toEqual([['u-karim', { blocked: false }]])
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
        participant: participant({ org_blocked: true })
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

    it('says the cut holds for their current and new sessions in the organisation, until restored', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'cut-internet')
      const text = modal(wrapper).text()

      expect(text).toMatch(/current/i)
      expect(text).toMatch(/new/i)
      expect(text).toMatch(/organi[sz]ation/i)
      expect(text).toMatch(/until/i)
      expect(text).toMatch(/restore/i)
      expect(text).toMatch(/port/i)
    })

    it('says the same in French', async () => {
      const wrapper = await mountMenu({}, { locale: 'fr' })
      await clickItem(wrapper, 'cut-internet')
      const text = modal(wrapper).text()

      expect(text).toMatch(/en cours/i)
      expect(text).toMatch(/nouvelles/i)
      expect(text).toMatch(/organisation/i)
      expect(text).toMatch(/rétabli/i)
      expect(text).toMatch(/port/i)
    })

    it('warns before stopping a temporary session that it is deleted and its work lost', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ persistence_mode: 'ephemeral' })]) })
      await clickItem(wrapper, 'stop')
      const text = modal(wrapper).text()

      expect(text).toMatch(/delet/i)
      expect(text).toMatch(/lost/i)
      expect(text).not.toMatch(/kept/i)
    })

    it('warns in French too', async () => {
      const wrapper = await mountMenu(
        { participant: participant({}, [running({ persistence_mode: 'ephemeral' })]) },
        { locale: 'fr' }
      )
      await clickItem(wrapper, 'stop')
      const text = modal(wrapper).text()

      expect(text).toMatch(/supprim/i)
      expect(text).toMatch(/perdu/i)
    })

    it('says the work is kept when every running session is persistent', async () => {
      const wrapper = await mountMenu({
        participant: participant({}, [running(), running({ session_id: 's-2' })])
      })
      await clickItem(wrapper, 'stop')
      const text = modal(wrapper).text()

      expect(text).toMatch(/kept/i)
      expect(text).not.toMatch(/lost/i)
    })

    it('warns about the temporary one among persistent sessions', async () => {
      const wrapper = await mountMenu({
        participant: participant({}, [running(), running({ session_id: 's-tmp', persistence_mode: 'ephemeral' })])
      })
      await clickItem(wrapper, 'stop')

      expect(modal(wrapper).text()).toMatch(/lost/i)
    })

    it('restores internet straight away', async () => {
      const wrapper = await mountMenu({ participant: participant({ network_cut: true }, [running({ network_disabled: true })]) })
      await clickItem(wrapper, 'restore-internet')

      expect(wrapper.emitted('set-network')).toEqual([['u-karim', true]])
    })

    it('unblocks straight away', async () => {
      const wrapper = await mountMenu({
        participant: participant({ class_block: { reason: 'Exam' } })
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

  describe('the dialog footer', () => {
    it.each([
      ['stop', 'Stop'],
      ['cut-internet', 'Cut internet'],
      ['block-class', 'Block'],
      ['block-org', 'Block']
    ])('uses BaseModal’s own danger footer for %s, no hand-rolled one', async (action, confirmText) => {
      const wrapper = await mountMenu({ viewer: ORG_MANAGER })
      await clickItem(wrapper, action)

      const baseModal = wrapper.findComponent({ name: 'BaseModal' })
      expect(baseModal.props('showDefaultFooter')).toBe(true)
      expect(baseModal.props('confirmText')).toBe(confirmText)
      expect(baseModal.props('cancelText')).toBe('Cancel')
      expect(baseModal.props('confirmVariant')).toBe('danger')
      expect(baseModal.props('confirmTestId')).toBe('participant-confirm')
      expect(baseModal.props('cancelTestId')).toBe('participant-cancel')
      const footerButtons = modal(wrapper).findAll('.base-modal-footer button')
      expect(footerButtons.map(b => b.attributes('data-testid'))).toEqual(['participant-confirm', 'participant-cancel'])
      expect(footerButtons[0].classes()).toContain('base-modal-confirm')
      expect(footerButtons[0].classes()).toContain('btn-danger')
    })

    it('closes on BaseModal’s close (overlay, ✕) without emitting', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'stop')

      wrapper.findComponent({ name: 'BaseModal' }).vm.$emit('close')
      await flushPromises()

      expect(modal(wrapper).exists()).toBe(false)
      expect(wrapper.emitted('stop-sessions')).toBeUndefined()
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

    it('warns that a temporary running session is lost while "also stop" is ticked', async () => {
      const wrapper = await mountMenu({ participant: participant({}, [running({ persistence_mode: 'ephemeral' })]) })
      await clickItem(wrapper, 'block-class')

      expect(modal(wrapper).text()).toMatch(/lost/i)

      await wrapper.find('[data-testid="participant-block-stop-running"]').setValue(false)
      expect(modal(wrapper).text()).not.toMatch(/lost/i)
    })

    it('warns in French in the block dialog too', async () => {
      const wrapper = await mountMenu(
        { participant: participant({}, [running({ persistence_mode: 'ephemeral' })]) },
        { locale: 'fr' }
      )
      await clickItem(wrapper, 'block-class')

      expect(modal(wrapper).text()).toMatch(/perdu/i)
    })

    it('says the work is kept in the block dialog when the running sessions are persistent', async () => {
      const wrapper = await mountMenu({})
      await clickItem(wrapper, 'block-class')

      expect(modal(wrapper).text()).toMatch(/kept/i)
      expect(modal(wrapper).text()).not.toMatch(/lost/i)
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

  describe('neutral French', () => {
    const GENDERED = /Bloqué |débloqué|Votre formateur/

    it('words the dialogs without gendered forms', async () => {
      for (const action of ['stop', 'cut-internet', 'block-class', 'block-org']) {
        const wrapper = await mountMenu({ viewer: ORG_MANAGER }, { locale: 'fr' })
        await clickItem(wrapper, action)
        expect(modal(wrapper).text(), `${action} dialog`).not.toMatch(GENDERED)
        wrapper.unmount()
      }
    })

    it('labels the block reason without naming the learner by a gendered noun', async () => {
      const wrapper = await mountMenu({}, { locale: 'fr' })
      await clickItem(wrapper, 'block-class')

      const label = wrapper.find('label[for="participant-block-reason"]')
      expect(label.exists()).toBe(true)
      expect(label.text()).not.toMatch(/l[’']apprenant|du participant/i)
    })

    it('words the read-only organisation note without gendered forms', async () => {
      const wrapper = await mountMenu(
        { viewer: CLASS_MANAGER, participant: participant({ org_blocked: true }, [running()]) },
        { locale: 'fr' }
      )
      await openMenu(wrapper)

      expect(wrapper.find('[data-testid="participant-org-block-readonly"]').text()).not.toMatch(GENDERED)
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
