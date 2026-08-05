/**
 * Tests for the analytics page of a class.
 *
 * The retired "Historique des commandes" tab became a section of this page
 * rather than a page of its own: command replay is consulted when something
 * needs explaining, never in the ordinary course of following a class.
 *
 * Two contracts follow from that placement, and both are pinned here — the
 * section is folded away and costs nothing until it is opened, and the links
 * that used to point at the history tab still open it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { computed, defineComponent, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const commandHistoryMounts = vi.fn()

vi.mock('../../src/components/Groups/GroupAnalyticsTab.vue', () => ({
  default: {
    props: ['groupId', 'canEditGroup'],
    template: '<div class="analytics-stub">{{ groupId }}</div>'
  }
}))

vi.mock('../../src/components/Groups/GroupCommandHistory.vue', () => ({
  default: defineComponent({
    props: ['groupId'],
    setup(props) {
      commandHistoryMounts(props.groupId)
    },
    template: '<div class="history-stub" />'
  })
}))

import ClassAnalyticsPage from '../../src/components/Class/ClassAnalyticsPage.vue'
import { provideClassContext } from '../../src/composables/useClassContext'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

/** Stands in for ClassLayout: provides the context and renders the page. */
const Host = defineComponent({
  components: { ClassAnalyticsPage },
  setup() {
    provideClassContext({
      groupId: computed(() => 'g-1'),
      group: ref(null),
      subgroups: computed(() => []),
      ownerUser: ref(null),
      organization: ref(null),
      memberCount: computed(() => 0),
      isPlatformAdmin: computed(() => false),
      isOwner: computed(() => true),
      isManager: computed(() => false),
      canManageClass: computed(() => true),
      canDeleteClass: computed(() => true),
      reload: async () => {},
      applyMemberCountDelta: () => {}
    } as never)
  },
  template: '<ClassAnalyticsPage />'
})

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/my-classes', component: { template: '<div class="console" />' } },
      { path: '/classes/:id/analytics', name: 'ClassAnalytics', component: Host }
    ]
  })
}

async function mountAt(router: ReturnType<typeof createTestRouter>, location: string) {
  await router.push(location)
  await router.isReady()

  const wrapper = mount(Host, { global: { plugins: [createTestI18n(), router] } })
  await flushPromises()
  return wrapper
}

describe('the analytics page — command replay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the class figures without being asked', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/analytics')

    expect(wrapper.find('.analytics-stub').text()).toBe('g-1')
  })

  it('keeps the replay folded away, and costs nothing until it is opened', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/analytics')

    expect(wrapper.find('.replay-toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.history-stub').exists()).toBe(false)
    expect(commandHistoryMounts).not.toHaveBeenCalled()
  })

  it('says what the replay is for before the teacher opens it', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/analytics')

    expect(wrapper.find('.replay-toggle').text()).toContain('Command replay')
    expect(wrapper.find('.replay-help').text()).toContain('what happened in one session')
  })

  it('loads the commands of this class once it is opened', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/analytics')

    await wrapper.find('.replay-toggle').trigger('click')

    expect(wrapper.find('.history-stub').exists()).toBe(true)
    expect(commandHistoryMounts).toHaveBeenCalledWith('g-1')
    expect(wrapper.find('.replay-toggle').attributes('aria-expanded')).toBe('true')
  })

  it('opens it straight away for a link that asked for the replay', async () => {
    const wrapper = await mountAt(createTestRouter(), '/classes/g-1/analytics?section=history')

    expect(wrapper.find('.history-stub').exists()).toBe(true)
    expect(wrapper.find('.replay-toggle').attributes('aria-expanded')).toBe('true')
  })

  it('makes the open section shareable, and folding it back leaves a clean URL', async () => {
    const router = createTestRouter()
    const wrapper = await mountAt(router, '/classes/g-1/analytics')

    await wrapper.find('.replay-toggle').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/classes/g-1/analytics?section=history')

    await wrapper.find('.replay-toggle').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/classes/g-1/analytics')
  })

  it('does not stack a history entry per fold, so Back leaves the analytics', async () => {
    const router = createTestRouter()
    await router.push('/my-classes')
    const wrapper = await mountAt(router, '/classes/g-1/analytics')

    await wrapper.find('.replay-toggle').trigger('click')
    await flushPromises()
    await wrapper.find('.replay-toggle').trigger('click')
    await flushPromises()
    await wrapper.find('.replay-toggle').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toContain('section=history')

    router.back()
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/my-classes')
  })

  it('names the section in French too', async () => {
    const router = createTestRouter()
    await router.push('/classes/g-1/analytics')
    await router.isReady()

    const i18n = createTestI18n()
    i18n.global.locale.value = 'fr'
    const wrapper = mount(Host, { global: { plugins: [i18n, router] } })
    await flushPromises()

    expect(wrapper.find('.replay-toggle').text()).toContain('Relecture des commandes')
  })
})
