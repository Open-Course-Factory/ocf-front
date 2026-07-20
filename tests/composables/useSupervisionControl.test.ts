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
