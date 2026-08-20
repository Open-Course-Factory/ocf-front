/**
 * Guards the global auto-unmount in tests/setup.ts.
 *
 * Without it, a wrapper a test forgets to unmount keeps running whatever the
 * component started — for the class console that is a 30s poll interval, which
 * then fires into later tests and past the file's teardown. That is exactly how
 * ocf-front's suite flaked in CI while reporting every test as passed.
 *
 * The two cases below are deliberately ordered: the first leaves a component
 * mounted, the second proves something unmounted it in between. If setupFiles
 * is ever dropped from vite.config.ts, the second one fails.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, onMounted, onUnmounted } from 'vue'

let mountedProbes = 0

const Probe = defineComponent({
  setup() {
    onMounted(() => { mountedProbes += 1 })
    onUnmounted(() => { mountedProbes -= 1 })
    return () => null
  },
})

describe('global test setup', () => {
  it('leaves a component mounted when the test does not unmount it', () => {
    mount(Probe)
    expect(mountedProbes).toBe(1)
  })

  it('has unmounted it before the next test runs', () => {
    expect(mountedProbes, 'tests/setup.ts must call enableAutoUnmount(afterEach)').toBe(0)
  })
})
