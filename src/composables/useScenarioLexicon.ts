import { ref, type Ref } from 'vue'
import axios from 'axios'

export interface LexiconEntry {
  key: string
  parent_key: string
  kind: string
  names: Record<string, string>
}

export interface ScenarioLexicon {
  entries: Ref<LexiconEntry[]>
  problems: Ref<string[]>
  scriptLiterals: Ref<string[]>
  isLoading: Ref<boolean>
  isSaving: Ref<boolean>
  saveError: Ref<string>
  ensureLoaded: () => Promise<void>
  reload: () => Promise<void>
  save: () => Promise<void>
}

/**
 * One scenario's vocabulary, held once and edited from more than one screen.
 *
 * The world's objects and the sentences a check prints are two very different
 * editing tasks — a room is a word in a box, a message is prose — but they are
 * one document server-side: a save replaces the whole lexicon, because entries
 * point at parents and half a lexicon has rooms inside rooms that are not there
 * yet.
 *
 * So the state lives here rather than in either screen. Two screens each
 * holding their own copy would each send the whole document on save, and the
 * one saved second would quietly undo the other's unsaved work — the loss
 * showing up later, as a French sentence that reverted to English on its own.
 *
 * Loading is lazy: whichever screen is opened first asks, and the other finds
 * it already there. A trainer who never opens either costs nothing.
 */
export function useScenarioLexicon(
  scenarioId: string,
  locales: () => string[],
  fallbackMessage: () => string
): ScenarioLexicon {
  const entries = ref<LexiconEntry[]>([])
  const problems = ref<string[]>([])
  const scriptLiterals = ref<string[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const saveError = ref('')

  let loaded = false
  let inFlight: Promise<void> | null = null

  async function fetchLexicon(): Promise<void> {
    isLoading.value = true
    saveError.value = ''
    try {
      const response = await axios.get(`/scenarios/${scenarioId}/lexicon`)
      entries.value = (response.data?.entries || []).map((e: any) => ({
        key: e.key,
        parent_key: e.parent_key || '',
        kind: e.kind || 'place',
        // Every declared language gets a box, including ones this entry has no
        // name in yet — an absent column is indistinguishable from a filled one.
        names: Object.fromEntries(
          locales().map((code: string) => [code, e.names?.[code] || ''])
        ) as Record<string, string>
      }))
      problems.value = response.data?.problems || []
      scriptLiterals.value = response.data?.script_literals || []
      loaded = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load once. Concurrent callers share the one request rather than racing:
   * both screens can mount in the same tick, and two answers landing in either
   * order is how one of them ends up displaying the other's stale document.
   */
  async function ensureLoaded(): Promise<void> {
    if (loaded) return
    if (!inFlight) {
      inFlight = fetchLexicon().finally(() => {
        inFlight = null
      })
    }
    return inFlight
  }

  async function reload(): Promise<void> {
    loaded = false
    return ensureLoaded()
  }

  async function save(): Promise<void> {
    isSaving.value = true
    saveError.value = ''
    try {
      // The whole document, never the screen's own slice: the server replaces
      // what it is sent, so sending only the messages would delete the world.
      const response = await axios.put(`/scenarios/${scenarioId}/lexicon`, {
        entries: entries.value.map(e => ({
          key: e.key,
          parent_key: e.parent_key,
          kind: e.kind,
          names: e.names
        }))
      })
      problems.value = response.data?.problems || []
      scriptLiterals.value = response.data?.script_literals || []
    } catch (err: any) {
      // A refusal names the entry at fault, so it is shown as sent rather than
      // replaced with a generic failure.
      saveError.value =
        err.response?.data?.error_message ||
        err.response?.data?.message ||
        fallbackMessage()
    } finally {
      isSaving.value = false
    }
  }

  return {
    entries,
    problems,
    scriptLiterals,
    isLoading,
    isSaving,
    saveError,
    ensureLoaded,
    reload,
    save
  }
}
