/**
 * The AI prompt lists this deployment's real session features. The full
 * catalogue (with minimum sizes) is admin-only, so a teacher reads the same
 * features from the session options instead; with neither, the list is empty
 * and the prompt falls back to "network".
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const getMock = vi.fn()
vi.mock('axios', () => ({ default: { get: (...args: any[]) => getMock(...args) } }))

import { useScenarioAiCatalog } from '../../src/composables/useScenarioAiCatalog'
import { buildCreatePrompt } from '../../src/utils/scenarioAiPrompt'

const DISTRIBUTIONS = [{ name: 'debian-12', prefix: 'deb', description: '', is_global: true, supported_features: ['network'] }]
const SIZES = [{ key: 'M', sort_order: 2 }, { key: 'S', sort_order: 1 }]
const forbidden = () => Promise.reject({ response: { status: 403 } })

function respond(routes: Record<string, () => Promise<any>>) {
  getMock.mockImplementation((url: string) => {
    const route = Object.keys(routes).find(r => url === r)
    return route ? routes[route]() : Promise.reject(new Error(`unexpected ${url}`))
  })
}

beforeEach(() => {
  getMock.mockReset()
})

describe('useScenarioAiCatalog', () => {
  it('reads the full feature catalogue, with minimum sizes, when the user may', async () => {
    respond({
      '/terminals/distributions': () => Promise.resolve({ data: DISTRIBUTIONS }),
      '/terminals/sizes': () => Promise.resolve({ data: SIZES }),
      '/terminals/catalog-features': () => Promise.resolve({ data: [
        { key: 'docker', name: 'Docker', min_size_key: 'M', sort_order: 2 },
        { key: 'network', name: 'Network', sort_order: 0 },
      ] }),
    })
    const catalog = await useScenarioAiCatalog().loadCatalog()
    expect(catalog.sizes.map(s => s.key)).toEqual(['S', 'M'])
    expect(catalog.features).toEqual([
      { key: 'network', name: 'Network', sort_order: 0 },
      { key: 'docker', name: 'Docker', min_size_key: 'M', sort_order: 2 },
    ])
  })

  it('falls back to the session options of a distribution when the catalogue is admin-only', async () => {
    respond({
      '/terminals/distributions': () => Promise.resolve({ data: DISTRIBUTIONS }),
      '/terminals/sizes': () => Promise.resolve({ data: SIZES }),
      '/terminals/catalog-features': forbidden,
      '/terminals/session-options': () => Promise.resolve({ data: {
        allowed_features: [{ key: 'docker', name: 'Docker', allowed: false, reason: 'not_supported' }],
      } }),
    })
    const catalog = await useScenarioAiCatalog().loadCatalog()
    expect(getMock).toHaveBeenCalledWith('/terminals/session-options', { params: { distribution: 'debian-12' } })
    expect(catalog.features?.map(f => f.key)).toEqual(['docker'])
  })

  it('tells a teacher a feature\'s minimum size when the session options carry it, and says nothing when they do not', async () => {
    respond({
      '/terminals/distributions': () => Promise.resolve({ data: DISTRIBUTIONS }),
      '/terminals/sizes': () => Promise.resolve({ data: SIZES }),
      '/terminals/catalog-features': forbidden,
      '/terminals/session-options': () => Promise.resolve({ data: {
        allowed_features: [
          { key: 'docker', name: 'Docker', min_size_key: 'M', allowed: false, reason: 'size_too_small' },
          { key: 'network', name: 'Network', allowed: true },
        ],
      } }),
    })
    const catalog = await useScenarioAiCatalog().loadCatalog()
    const prompt = buildCreatePrompt(
      { description: 'Docker lab', language: 'en', level: 'beginner', stepCount: 3, stepTypes: ['terminal'] },
      catalog,
      'en'
    )
    expect(prompt).toContain('- "docker" Docker (minimum size "M")')
    expect(prompt).toMatch(/- "network" Network\n/)
  })

  it('leaves the features empty when neither can be read, and keeps the other lists', async () => {
    respond({
      '/terminals/distributions': () => Promise.resolve({ data: DISTRIBUTIONS }),
      '/terminals/sizes': () => Promise.resolve({ data: SIZES }),
      '/terminals/catalog-features': forbidden,
      '/terminals/session-options': forbidden,
    })
    const catalog = await useScenarioAiCatalog().loadCatalog()
    expect(catalog.features).toEqual([])
    expect(catalog.distributions).toHaveLength(1)
  })
})
