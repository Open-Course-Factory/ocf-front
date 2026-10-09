import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/help/permissions' })
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        categories: [],
        entities: [
          {
            entity: 'GroupMember',
            create: { type: 'public' },
            read: { type: 'public' },
            update: { type: 'public' },
            delete: { type: 'admin_only' }
          }
        ]
      }
    })
  }
}))

import PermissionsReference from '../../src/components/Pages/Help/PermissionsReference.vue'

describe('PermissionsReference — entity CRUD table', () => {
  it('shows a member write the backend labels public as guarded by the entity hooks', async () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })
    const wrapper = mount(PermissionsReference, {
      global: { plugins: [i18n], stubs: { RouterLink: { template: '<a><slot /></a>' } } }
    })
    await flushPromises()

    const cells = wrapper.findAll('.entity-crud-table tbody td.col-crud').map(td => td.text())
    expect(cells).toEqual([
      "Member, checked by the entity's hooks",
      'Any member',
      "Member, checked by the entity's hooks",
      'Admin only'
    ])
  })
})
