import { describe, it, expect, vi, beforeEach } from 'vitest'
import { terminalKeyHandler } from '../../src/utils/terminalShortcuts'

function key(code: string, mods: Partial<KeyboardEvent> = {}, type = 'keydown') {
  return { type, code, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, preventDefault: vi.fn(), ...mods } as unknown as KeyboardEvent
}

describe('terminalKeyHandler', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  it('copies the selection on Ctrl+Shift+C instead of opening the inspector', () => {
    const handle = terminalKeyHandler(() => 'ls -la')
    const event = key('KeyC', { ctrlKey: true, shiftKey: true })

    expect(handle(event)).toBe(false)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledWith('ls -la')
  })

  it('still swallows Ctrl+Shift+C when nothing is selected', () => {
    const handle = terminalKeyHandler(() => '')
    const event = key('KeyC', { ctrlKey: true, shiftKey: true })

    expect(handle(event)).toBe(false)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('leaves Ctrl+C to the shell', () => {
    const handle = terminalKeyHandler(() => 'selected')
    const event = key('KeyC', { ctrlKey: true })

    expect(handle(event)).toBe(true)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('leaves the keyup of Ctrl+Shift+C alone', () => {
    const handle = terminalKeyHandler(() => 'selected')
    expect(handle(key('KeyC', { ctrlKey: true, shiftKey: true }, 'keyup'))).toBe(true)
  })
})
