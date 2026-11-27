import axios from 'axios'
import type { MachineBoot } from '../scenario/scenarioSessionService'

/**
 * The platform's boot settings for machines in the learner's browser
 * (ocf-core, platform administrators only). A scenario may override each one.
 */
export const localMachineBootService = {
  async getDefaults(): Promise<MachineBoot> {
    return (await axios.get<MachineBoot>('/local-machines/boot-defaults')).data
  },
  /** Saves them all; ocf-core answers with what it stored. */
  async saveDefaults(boot: MachineBoot): Promise<MachineBoot> {
    return (await axios.put<MachineBoot>('/local-machines/boot-defaults', boot)).data
  }
}
