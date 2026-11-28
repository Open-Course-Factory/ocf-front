/**
 * Whether this browser can run a lab's machine, and why not: the card says
 * it before launch, and the launch tells ocf-core.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { computerTooSmall, localMachineUnavailable } from '../../src/services/domain/terminal/localMachineFit'

const wasm = WebAssembly as unknown as Record<string, unknown>

function withJspi(on: boolean) {
  for (const name of ['promising', 'Suspending']) {
    if (on) Object.defineProperty(wasm, name, { value: () => {}, configurable: true })
    else delete wasm[name]
  }
}

function withUserAgent(ua: string, maxTouchPoints = 0) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true })
}

const DESKTOP_CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

describe('the computer\'s memory', () => {
  // Chrome never says more than 8 GiB: a 32 GB laptop reads 8.
  it('counts a computer the browser caps at 8 GiB as big enough for any machine', () => {
    expect(computerTooSmall(8192, 8)).toBe(false)
  })

  it('refuses a machine twice as big as a computer the browser says is smaller', () => {
    expect(computerTooSmall(4096, 4)).toBe(true)
  })
})

describe('localMachineUnavailable', () => {
  afterEach(() => {
    withJspi(false)
    withUserAgent(DESKTOP_CHROME)
  })

  it('says nothing in a desktop browser with JSPI', () => {
    withJspi(true)
    withUserAgent(DESKTOP_CHROME)
    expect(localMachineUnavailable(1024)).toBeUndefined()
  })

  it('blames the browser without JSPI', () => {
    withJspi(false)
    withUserAgent(DESKTOP_CHROME)
    expect(localMachineUnavailable(1024)).toBe('browser')
  })

  it('blames the device on a phone, and on an iPad that calls itself a Mac', () => {
    withJspi(true)
    withUserAgent('Mozilla/5.0 (Linux; Android 14) Mobile Safari/537.36')
    expect(localMachineUnavailable(1024)).toBe('device')
    withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 5)
    expect(localMachineUnavailable(1024)).toBe('device')
  })

  it('blames the memory of a computer too small for the machine', () => {
    withJspi(true)
    withUserAgent(DESKTOP_CHROME)
    Object.defineProperty(navigator, 'deviceMemory', { value: 4, configurable: true })
    expect(localMachineUnavailable(4096)).toBe('memory')
    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true })
  })
})
