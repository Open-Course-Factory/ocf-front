/**
 * useScenarioAiCatalog
 * ────────────────────
 * What the platform can run, for the "with AI" prompt: distributions, sizes
 * and session features, read live so the prompt names what this deployment
 * really offers rather than what the local catalogue happened to hold.
 *
 * Every list is optional. One that cannot be read is left empty and the
 * prompt falls back to safe defaults for it (Debian, size S, the network
 * feature), so a failure is never the teacher's problem.
 */
import { terminalService } from '../services/domain/terminal/terminalService'
import type { Distribution } from '../types/terminal'
import type { ScenarioAiCatalog } from '../utils/scenarioAiPrompt'

const orEmpty = <T>(list: Promise<T[]>) => list.catch(() => [] as T[])

// GET /terminals/catalog-features carries each feature's minimum size but is
// admin-only. Anyone who may launch a session reads the same features, without
// the minimum size, from the session options of any distribution: those list
// the whole feature catalogue, each marked allowed or not for that pick.
async function loadFeatures(distributions: Distribution[]): Promise<NonNullable<ScenarioAiCatalog['features']>> {
  try {
    const features = await terminalService.getCatalogFeatures()
    return [...features].sort((a, b) => a.sort_order - b.sort_order)
  } catch {
    if (!distributions.length) return []
    return terminalService.getSessionOptions(distributions[0].name)
      .then(options => options.allowed_features || [])
      .catch(() => [])
  }
}

export function useScenarioAiCatalog() {
  let catalog: Promise<ScenarioAiCatalog> | null = null

  async function readCatalog(): Promise<ScenarioAiCatalog> {
    const [distributions, sizes] = await Promise.all([
      orEmpty(terminalService.getDistributions()),
      orEmpty(terminalService.getSizes())
    ])
    return {
      distributions,
      sizes: [...sizes].sort((a, b) => a.sort_order - b.sort_order),
      features: await loadFeatures(distributions)
    }
  }

  /** The catalogue, read once per component and reused for every prompt it writes. */
  function loadCatalog(): Promise<ScenarioAiCatalog> {
    catalog ??= readCatalog()
    return catalog
  }

  return { loadCatalog }
}
