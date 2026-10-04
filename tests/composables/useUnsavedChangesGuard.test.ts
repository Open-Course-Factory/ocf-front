/**
 * The step form lives in the page, so nothing closes it on purpose: opening
 * another step, scenario or page replaces it. The guard asks first, and only
 * when there is something to lose.
 */

import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'

let leaveGuard: (() => Promise<boolean>) | null = null
vi.mock('vue-router', () => ({
  onBeforeRouteLeave: (guard: () => Promise<boolean>) => { leaveGuard = guard }
}))

import { useUnsavedChangesGuard } from '../../src/composables/useUnsavedChangesGuard'

function setup(dirty: boolean) {
  const isDirty = ref(dirty)
  let guard!: ReturnType<typeof useUnsavedChangesGuard>
  const wrapper = mount(defineComponent({
    setup() { guard = useUnsavedChangesGuard(isDirty); return () => h('div') }
  }))
  return { guard, isDirty, wrapper }
}

describe('useUnsavedChangesGuard', () => {
  it('lets the author move on at once when nothing is unsaved', async () => {
    const { guard } = setup(false)
    await expect(guard.confirmDiscard()).resolves.toBe(true)
    expect(guard.isAsking.value).toBe(false)
  })

  it('asks when there are unsaved edits, and stays when told to keep editing', async () => {
    const { guard } = setup(true)
    const answer = guard.confirmDiscard()
    expect(guard.isAsking.value).toBe(true)
    guard.answer(false)
    await expect(answer).resolves.toBe(false)
    expect(guard.isAsking.value).toBe(false)
  })

  it('moves on once the author agrees to discard', async () => {
    const { guard } = setup(true)
    const answer = guard.confirmDiscard()
    guard.answer(true)
    await expect(answer).resolves.toBe(true)
  })

  it('asks before the router leaves the page too', async () => {
    const { guard } = setup(true)
    const leaving = leaveGuard!()
    expect(guard.isAsking.value).toBe(true)
    guard.answer(false)
    await expect(leaving).resolves.toBe(false)
  })

  it('has the browser ask on a tab close, only while dirty', () => {
    const { isDirty, wrapper } = setup(true)
    const dirtyEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirtyEvent)
    expect(dirtyEvent.defaultPrevented).toBe(true)

    isDirty.value = false
    const cleanEvent = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(cleanEvent)
    expect(cleanEvent.defaultPrevented).toBe(false)
    wrapper.unmount()
  })
})
