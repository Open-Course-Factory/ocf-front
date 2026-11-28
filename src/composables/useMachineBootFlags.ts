/**
 * The on/off settings of how a machine in the browser boots (MachineBoot,
 * ocf-core's LocalMachineBoot), and their names: the platform's defaults
 * (UnkernelIntegration.vue) and a scenario's overrides (ScenarioEditModal.vue)
 * show the same five. The kernel command line is not one of them.
 */
import { useTranslations } from './useTranslations'
import type { MachineBoot } from '../services/domain/scenario/scenarioSessionService'

export const MACHINE_BOOT_FLAGS = ['jit', 'verbose', 'display', 'sound', 'console_hidden'] as const satisfies readonly (keyof MachineBoot)[]
export type MachineBootFlag = typeof MACHINE_BOOT_FLAGS[number]

export function useMachineBootFlagLabel(): (flag: MachineBootFlag) => string {
  const { t } = useTranslations({
    en: { machineBootFlag: {
      jit: 'JIT compiler',
      verbose: 'Verbose boot',
      display: 'Display',
      sound: 'Sound card',
      console_hidden: 'Hide the console once the machine has booted'
    } },
    fr: { machineBootFlag: {
      jit: 'Compilateur JIT',
      verbose: 'Démarrage détaillé',
      display: 'Écran',
      sound: 'Carte son',
      console_hidden: 'Masquer la console une fois la machine démarrée'
    } }
  })
  return (flag) => t(`machineBootFlag.${flag}`)
}
