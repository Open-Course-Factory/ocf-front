/**
 * RED tests for the supervisor's read-only-by-default control gate (issue #288,
 * MR !275).
 *
 * The full SupervisionViewer mounts native xterm (dynamic imports) and a live
 * WebSocket, which is too heavy and too incidental to unit-test the one behavior
 * that actually matters for safety: a supervisor must start READ-ONLY (no
 * keystroke is ever forwarded to the learner's shell) until they explicitly
 * press "Take hand", and the button must then toggle to "Release hand". So this
 * behavior is pinned at the composable/logic level; the visual grid/xterm wiring
 * is out of scope (and is not unit-testable).
 *
 * Production surface these tests define (to be implemented by frontend-dev):
 *   src/composables/useSupervisionControl.ts
 *     export function useSupervisionControl(
 *       getSocket: () => Pick<WebSocket,'send'|'readyState'> | null
 *     ): {
 *       hasControl: Ref<boolean>          // false => read-only
 *       takeHand(): void                  // sends take_hand, hasControl = true
 *       releaseHand(): void               // sends release_hand, hasControl = false
 *       forwardKeystroke(data: string): void   // no-op unless hasControl
 *       controlActionKey: ComputedRef<'takeHand' | 'releaseHand'>  // drives the button label
 *     }
 *
 * The composable reuses sendTakeHand / sendReleaseHand from supervisionProtocol,
 * so the wire format is pinned once (in terminalSupervision.test.ts).
 */

import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useSupervisionControl } from '../../src/composables/useSupervisionControl'

function fakeSocket() {
  return { send: vi.fn(), readyState: WebSocket.OPEN }
}

describe('useSupervisionControl — read-only default', () => {
  it('starts read-only (hasControl=false) with the button in "take hand" state', () => {
    const { hasControl, controlActionKey } = useSupervisionControl(() => fakeSocket())
    expect(hasControl.value).toBe(false)
    expect(controlActionKey.value).toBe('takeHand')
  })

  it('does NOT forward keystrokes while read-only', () => {
    const socket = fakeSocket()
    const { forwardKeystroke } = useSupervisionControl(() => socket)
    forwardKeystroke('rm -rf /\r')
    expect(socket.send).not.toHaveBeenCalled()
  })
})

describe('useSupervisionControl — take / release toggle', () => {
  it('takeHand grants control, sends take_hand, and flips the button to "release"', () => {
    const socket = fakeSocket()
    const { hasControl, takeHand, controlActionKey } = useSupervisionControl(() => socket)

    takeHand()

    expect(hasControl.value).toBe(true)
    expect(controlActionKey.value).toBe('releaseHand')
    expect(socket.send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({ type: 'take_hand' })
  })

  it('forwards keystrokes only after control has been taken', () => {
    const socket = fakeSocket()
    const { takeHand, forwardKeystroke } = useSupervisionControl(() => socket)

    takeHand()
    socket.send.mockClear()
    forwardKeystroke('ls\r')

    expect(socket.send).toHaveBeenCalledWith('ls\r')
  })

  it('releaseHand drops control, sends release_hand, and flips the button back', () => {
    const socket = fakeSocket()
    const { hasControl, takeHand, releaseHand, controlActionKey, forwardKeystroke } =
      useSupervisionControl(() => socket)

    takeHand()
    releaseHand()

    expect(hasControl.value).toBe(false)
    expect(controlActionKey.value).toBe('takeHand')
    expect(JSON.parse(socket.send.mock.calls[1][0])).toEqual({ type: 'release_hand' })

    // Back to read-only: keystrokes are no longer forwarded.
    socket.send.mockClear()
    forwardKeystroke('whoami\r')
    expect(socket.send).not.toHaveBeenCalled()
  })
})

/**
 * Issue #288 UX bug: the "You are in control" / "Vous avez le contrôle" chip was
 * driven by the GLOBAL controlled state (set by ANY trainer's took_hand frame),
 * so when a DIFFERENT trainer held the hand the current trainer was wrongly told
 * they were in control.
 *
 * `hasControl` is the LOCAL signal (this client took the hand) and drives the
 * "you are in control" affordance. `isControlledByOther` is the new computed that
 * distinguishes "someone ELSE holds the hand" — the composable reads the global
 * controlled state via an optional getter passed as the 2nd argument, WITHOUT
 * letting it leak into `hasControl`.
 *
 * Added surface (implement to this):
 *   useSupervisionControl(
 *     getSocket: () => Pick<WebSocket,'send'|'readyState'> | null,
 *     isGloballyControlled?: () => boolean,
 *   ): SupervisionControl & { isControlledByOther: ComputedRef<boolean> }
 */
describe('useSupervisionControl — local vs global control (issue #288 chip bug)', () => {
  const fakeSocket = () => ({ send: vi.fn(), readyState: WebSocket.OPEN })

  it('isControlledByOther is false when no global-control info is provided', () => {
    const { isControlledByOther } = useSupervisionControl(() => fakeSocket())
    expect(isControlledByOther.value).toBe(false)
  })

  it('when ANOTHER trainer holds the hand, hasControl stays false and isControlledByOther is true', () => {
    const globallyControlled = ref(true)
    const { hasControl, isControlledByOther } = useSupervisionControl(
      () => fakeSocket(),
      () => globallyControlled.value,
    )
    // The global controlled flag must NEVER leak into the local "you are in control" signal.
    expect(hasControl.value).toBe(false)
    expect(isControlledByOther.value).toBe(true)
  })

  it('when THIS client took the hand, isControlledByOther is false even though global control is also true', () => {
    // The server echoes our own took_hand back into the global state.
    const globallyControlled = ref(false)
    const socket = fakeSocket()
    const { takeHand, hasControl, isControlledByOther } = useSupervisionControl(
      () => socket,
      () => globallyControlled.value,
    )

    takeHand()
    globallyControlled.value = true

    expect(hasControl.value).toBe(true)
    expect(isControlledByOther.value).toBe(false)
  })

  it('reflects a live switch: another trainer takes over after we release', () => {
    const globallyControlled = ref(false)
    const socket = fakeSocket()
    const { takeHand, releaseHand, hasControl, isControlledByOther } = useSupervisionControl(
      () => socket,
      () => globallyControlled.value,
    )

    takeHand()
    globallyControlled.value = true
    expect(isControlledByOther.value).toBe(false)

    releaseHand()
    // We released but the session is still globally controlled by someone else.
    expect(hasControl.value).toBe(false)
    expect(isControlledByOther.value).toBe(true)
  })
})
