/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  getCast,
  isPresetEffect,
  presetNames,
  DEFAULT_INTRO_PRESET,
  DEFAULT_OUTRO_PRESET
} from '../../src/services/domain/scenario/effectAssets'

vi.mock('axios')

const VALID_CAST =
  JSON.stringify({ version: 2, width: 20, height: 5 }) +
  '\n' +
  JSON.stringify([0.1, 'o', 'hello'])

describe('effectAssets', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset()
  })

  it('classifies bare names as presets and paths as API assets', () => {
    expect(isPresetEffect('intro-decrypt')).toBe(true)
    expect(isPresetEffect('/project-files/abc/content')).toBe(false)
  })

  it('ships the default presets in the canned library', () => {
    expect(presetNames()).toContain(DEFAULT_INTRO_PRESET)
    expect(presetNames()).toContain(DEFAULT_OUTRO_PRESET)
  })

  it('loads and parses a canned preset without touching the network', async () => {
    const cast = await getCast(DEFAULT_INTRO_PRESET)
    expect(cast).not.toBeNull()
    expect(cast!.width).toBe(80)
    expect(cast!.height).toBe(24)
    expect(cast!.events.length).toBeGreaterThan(0)
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('resolves null for an unknown preset name', async () => {
    await expect(getCast('no-such-preset')).resolves.toBeNull()
  })

  it('fetches API asset paths as raw text and parses them', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: VALID_CAST })
    const cast = await getCast('/project-files/abc/content')
    expect(cast).not.toBeNull()
    expect(cast!.events).toEqual([{ t: 0.1, data: 'hello' }])
    expect(axios.get).toHaveBeenCalledWith(
      '/project-files/abc/content',
      expect.objectContaining({ responseType: 'text' })
    )
  })

  it('memoizes successful loads per reference', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: VALID_CAST })
    await getCast('/project-files/memo/content')
    await getCast('/project-files/memo/content')
    expect(axios.get).toHaveBeenCalledTimes(1)
  })

  it('resolves null on fetch failure without caching the failure', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('network down'))
    await expect(getCast('/project-files/flaky/content')).resolves.toBeNull()

    vi.mocked(axios.get).mockResolvedValueOnce({ data: VALID_CAST })
    await expect(getCast('/project-files/flaky/content')).resolves.not.toBeNull()
    expect(axios.get).toHaveBeenCalledTimes(2)
  })

  it('resolves null for an asset that is not a valid recording', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: 'not a cast' })
    await expect(getCast('/project-files/bad/content')).resolves.toBeNull()
  })
})
