/**
 * The agent is the learner's tab working for the scenario engine: ocf-core
 * sends it the commands a container would get from tt-backend (setup, checks,
 * foreground scripts), and it runs them in the machine it booted.
 */
import { describe, it, expect, vi } from 'vitest'
import { answerAgentRequest, type AgentMachine } from '../../src/services/domain/terminal/localMachine'

function machine(result: Partial<{ stdout: string; stderr: string; exitCode: number | null; signal: number | null }> | Error) {
  const exec = vi.fn(async () => {
    if (result instanceof Error) throw result
    return { stdout: '', stderr: '', exitCode: 0, signal: null, ...result }
  })
  return { exec } satisfies AgentMachine
}

describe('answerAgentRequest', () => {
  it('runs exec as root with the environment, and answers its result under the same id', async () => {
    const m = machine({ stdout: 'out', stderr: 'err', exitCode: 3 })
    const reply = await answerAgentRequest(m, null, { id: 7, op: 'exec', command: ['sh', '-c', 'exit 3'], env: { K: 'v' }, timeout: 10 })

    expect(reply).toEqual({ id: 7, exit_code: 3, stdout: 'out', stderr: 'err' })
    const [file, args, opts] = m.exec.mock.calls[0] as unknown as [string, string[], Record<string, unknown>]
    expect(file).toBe('sh')
    expect(args).toEqual(['-c', 'exit 3'])
    expect(opts).toMatchObject({ user: 'root', env: { K: 'v' } })
    expect(opts.signal).toBeInstanceOf(AbortSignal)
  })

  it('reports a program a signal ended as 128 + the signal, as a shell does', async () => {
    const reply = await answerAgentRequest(machine({ exitCode: null, signal: 9 }), null, { id: 1, op: 'exec', command: ['yes'], timeout: 5 })
    expect(reply).toMatchObject({ exit_code: 137 })
  })

  it('answers an error, never a result, when the command could not run', async () => {
    const reply = await answerAgentRequest(machine(new Error('ABORTED')), null, { id: 2, op: 'exec', command: ['sleep', '99'], timeout: 1 })
    expect(reply).toEqual({ id: 2, error: 'ABORTED' })
  })

  it('refuses an exec without a command', async () => {
    const m = machine({})
    const reply = await answerAgentRequest(m, null, { id: 3, op: 'exec', command: [] })
    expect(reply).toMatchObject({ id: 3, error: expect.any(String) })
    expect(m.exec).not.toHaveBeenCalled()
  })

  it('types console text into the open shell', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const reply = await answerAgentRequest(machine({}), { write }, { id: 4, op: 'console', data: 'cd /srv\n' })
    expect(write).toHaveBeenCalledWith('cd /srv\n')
    expect(reply).toEqual({ id: 4 })
  })

  it('says no_console when no shell is open, as tt-backend says 409', async () => {
    const reply = await answerAgentRequest(machine({}), null, { id: 5, op: 'console', data: 'ls\n' })
    expect(reply).toEqual({ id: 5, error: 'no_console' })
  })

  it('refuses an unknown request', async () => {
    const reply = await answerAgentRequest(machine({}), null, { id: 6, op: 'format-disk' })
    expect(reply).toMatchObject({ id: 6, error: expect.any(String) })
  })
})
