import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsCard from '../../src/components/UI/SettingsCard.vue'

const LONG_TITLE = 'A made-up title that is much too long to fit on one line'

describe('SettingsCard single-line title', () => {
  it('shows the full title on hover when the title is kept on one line', () => {
    const wrapper = mount(SettingsCard, { props: { title: LONG_TITLE, singleLineTitle: true } })

    expect(wrapper.find('.card-header').classes()).toContain('ocf-single-line-title')
    expect(wrapper.find('h2').attributes('title')).toBe(LONG_TITLE)
  })

  it('leaves other cards as they are', () => {
    const wrapper = mount(SettingsCard, { props: { title: LONG_TITLE } })

    expect(wrapper.find('.card-header').classes()).not.toContain('ocf-single-line-title')
    expect(wrapper.find('h2').attributes('title')).toBeUndefined()
  })
})
