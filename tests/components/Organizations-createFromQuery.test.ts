/**
 * `/organizations?create=1` opens the creation form on arrival (#315).
 *
 * The console's personal-organization state promises "create my organization";
 * landing on a page that merely has a button somewhere on it is a different
 * promise. This matters more than convenience: the navigation hides the
 * organizations category in a personal context, so that call to action is the
 * only route a teacher has to creating a team organization.
 *
 * Since core #476 the endpoint behind it refuses an organization whose owner's
 * plan does not cover teaching, so the deep link has a second job: not to open a
 * form that can only fail, and — for the race where the plan changed after the
 * page decided — to say why the refusal happened in the user's own language.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

let routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn().mockResolvedValue(undefined),
    addRoute: vi.fn(),
    getRoutes: () => [],
    resolve: (to: unknown) => ({ href: '#', ...(to as object) }),
    currentRoute: { value: { query: {}, params: {}, meta: {} } },
  }
  return {
    useRoute: () => ({ get query() { return routeQuery } }),
    useRouter: () => router,
    createRouter: () => router,
    createWebHistory: () => ({}),
    createWebHashHistory: () => ({}),
  }
})

const createOrganization = vi.fn()
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    userOrganizations: [],
    isLoading: false,
    error: '',
    loadOrganizations: vi.fn().mockResolvedValue([]),
    createOrganization,
    updateOrganization: vi.fn(),
  }),
}))

// The org-less classroom verdict — the same one ocf-core applies when it decides
// whether to accept the organization at all. A ref, because the refusal path
// changes it mid-test and the page has to notice, exactly as the real store's
// state would make it notice.
const orgLessFeatures = ref<any>(null)
const loadEffectiveFeatures = vi.fn()
const loadCurrentUser = vi.fn()
vi.mock('../../src/stores/permissions', () => ({
  usePermissionsStore: () => ({
    canManageOrganization: () => true,
    loadCurrentUser,
    get effectiveFeatures() { return null },
    get allOrgFeatures() { return orgLessFeatures.value },
    ensureEffectiveFeaturesLoaded: vi.fn().mockResolvedValue(null),
    loadEffectiveFeatures,
  }),
}))

import i18n from '../../src/i18n'
import Organizations from '../../src/components/Pages/Organizations.vue'

async function mountOrganizations(query: Record<string, string>) {
  routeQuery = query
  setActivePinia(createPinia())

  const wrapper = mount(Organizations, {
    global: {
      plugins: [i18n],
      stubs: {
        OrganizationsList: { template: '<div class="list-stub" />' },
        OrganizationModal: {
          name: 'OrganizationModal',
          props: ['isOpen', 'error'],
          template: '<div class="modal-stub" :data-open="isOpen" :data-error="error" />',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

function modalIsOpen(wrapper: any): boolean {
  return wrapper.find('.modal-stub').attributes('data-open') === 'true'
}

function modalError(wrapper: any): string {
  return wrapper.find('.modal-stub').attributes('data-error') || ''
}

async function submitNewOrganization(wrapper: any) {
  wrapper.findComponent({ name: 'OrganizationModal' })
    .vm.$emit('submit', { name: 'formatech', display_name: 'FormaTech' })
  await flushPromises()
}

describe('Organizations page — arriving to create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery = {}
    i18n.global.locale.value = 'en'
    orgLessFeatures.value = { can_run_classrooms: true }
    loadEffectiveFeatures.mockResolvedValue(null)
    loadCurrentUser.mockResolvedValue(undefined)
  })

  it('opens the creation form when asked to', async () => {
    const wrapper = await mountOrganizations({ create: '1' })

    expect(modalIsOpen(wrapper)).toBe(true)
  })

  it('leaves the page as it was without the parameter', async () => {
    const wrapper = await mountOrganizations({})

    expect(modalIsOpen(wrapper)).toBe(false)
  })

  it('does not open a form the plan cannot submit', async () => {
    // The panel above the list already explains what is missing and links to the
    // plan; a form that can only 4xx is a worse answer than that panel.
    orgLessFeatures.value = { can_run_classrooms: false, classroom_denied_reason: 'plan_lacks_group_management' }

    const wrapper = await mountOrganizations({ create: '1' })

    expect(modalIsOpen(wrapper)).toBe(false)
  })

  it('still opens the form when an unrelated request on the page failed', async () => {
    // The form was asked for; whether the user profile came back is a different
    // question, and losing the form to it would strand the teacher on a page
    // whose only route forward is the one they already took.
    loadCurrentUser.mockRejectedValue(new Error('network'))

    const wrapper = await mountOrganizations({ create: '1' })

    expect(modalIsOpen(wrapper)).toBe(true)
  })

  it('still opens the form when the verdict never resolved', async () => {
    // Refusing on missing data would strand a paying teacher on a page with no
    // route forward. The backend still gets the last word, and its refusal is
    // handled below.
    orgLessFeatures.value = null

    const wrapper = await mountOrganizations({ create: '1' })

    expect(modalIsOpen(wrapper)).toBe(true)
  })
})

describe('Organizations page — refused by the plan gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery = {}
    i18n.global.locale.value = 'en'
    orgLessFeatures.value = { can_run_classrooms: true }
    loadEffectiveFeatures.mockResolvedValue(null)
    loadCurrentUser.mockResolvedValue(undefined)
  })

  it('explains the refusal in the user’s language instead of echoing the API', async () => {
    // The race this exists for: the page decided to show the form while the plan
    // was still classroom-capable, and it is not by the time the form is sent.
    createOrganization.mockRejectedValue({
      response: { status: 403, data: { error_message: 'user plan does not allow running classes' } },
    })
    loadEffectiveFeatures.mockImplementation(async () => {
      orgLessFeatures.value = { can_run_classrooms: false, classroom_denied_reason: 'plan_lacks_group_management' }
      return null
    })

    const wrapper = await mountOrganizations({ create: '1' })
    await submitNewOrganization(wrapper)

    expect(modalError(wrapper)).toContain('Formateur')
    expect(modalError(wrapper)).not.toContain('user plan does not allow running classes')
  })

  it('says it in French too', async () => {
    i18n.global.locale.value = 'fr'
    createOrganization.mockRejectedValue({ response: { status: 403, data: {} } })
    loadEffectiveFeatures.mockImplementation(async () => {
      orgLessFeatures.value = { can_run_classrooms: false }
      return null
    })

    const wrapper = await mountOrganizations({ create: '1' })
    await submitNewOrganization(wrapper)

    expect(modalError(wrapper)).toContain('plan Formateur')
  })

  it('keeps the backend’s own message when the plan was not the problem', async () => {
    createOrganization.mockRejectedValue({
      response: { status: 400, data: { error_message: 'you already have an organization with this name' } },
    })

    const wrapper = await mountOrganizations({ create: '1' })
    await submitNewOrganization(wrapper)

    expect(modalError(wrapper)).toBe('you already have an organization with this name')
  })

  it('falls back to a translated message when the API says nothing at all', async () => {
    createOrganization.mockRejectedValue({})

    const wrapper = await mountOrganizations({ create: '1' })
    await submitNewOrganization(wrapper)

    expect(modalError(wrapper)).toBe('The organization could not be saved. Please try again.')
  })
})
