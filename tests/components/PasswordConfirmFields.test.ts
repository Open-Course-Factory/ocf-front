import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import PasswordConfirmFields from '../../src/components/Common/PasswordConfirmFields.vue'
import { passwordConfirmed } from '../../src/utils/passwordConfirmation'

function mountFields() {
  const password = ref('')
  const confirm = ref('')
  const wrapper = mount(
    {
      components: { PasswordConfirmFields },
      setup: () => ({ password, confirm }),
      template: '<PasswordConfirmFields v-model:password="password" v-model:confirm="confirm" id-prefix="t" />'
    },
    {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
      }
    }
  )
  return { wrapper, password, confirm }
}

describe('PasswordConfirmFields', () => {
  it('binds both masked fields to the parent', async () => {
    const { wrapper, password, confirm } = mountFields()

    expect(wrapper.find('#t-password').attributes('type')).toBe('password')
    expect(wrapper.find('#t-password-confirm').attributes('type')).toBe('password')
    expect(wrapper.find('#t-password').attributes('minlength')).toBe('8')

    await wrapper.find('#t-password').setValue('correct-horse')
    await wrapper.find('#t-password-confirm').setValue('correct-horse')

    expect(password.value).toBe('correct-horse')
    expect(confirm.value).toBe('correct-horse')
  })

  it('keeps the mismatch line in the layout and fills it only on a mismatch', async () => {
    const { wrapper } = mountFields()
    const line = () => wrapper.find('.ocf-password-mismatch')

    expect(line().exists()).toBe(true)
    expect(line().text()).toBe('')

    await wrapper.find('#t-password').setValue('correct-horse')
    await wrapper.find('#t-password-confirm').setValue('something-else')

    expect(line().text()).toBe('Passwords do not match')
  })
})

describe('passwordConfirmed', () => {
  it('requires the minimum length and a matching confirmation', () => {
    expect(passwordConfirmed('', '')).toBe(false)
    expect(passwordConfirmed('short', 'short')).toBe(false)
    expect(passwordConfirmed('long-enough', 'long-enougH')).toBe(false)
    expect(passwordConfirmed('long-enough', 'long-enough')).toBe(true)
  })
})
