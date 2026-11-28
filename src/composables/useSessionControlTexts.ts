/**
 * The words of a session's Stop and Destroy buttons, the same on a console
 * (TerminalViewer.vue) and on a desktop (DesktopSlot.vue).
 */
import { useTranslations } from './useTranslations'

export function useSessionControlTexts() {
  const { t } = useTranslations({
    en: { sessionControls: {
      stop: 'Stop',
      stopDisabledProvisioning: 'The scenario is still being set up — Stop will be available once it is ready.',
      destroy: 'Destroy',
      destroyTooltip: 'Destroy this session permanently (the machine and its data will be lost).'
    } },
    fr: { sessionControls: {
      stop: 'Arrêter',
      stopDisabledProvisioning: 'Le scénario est encore en cours de préparation — vous pourrez l\'arrêter dès qu\'il sera prêt.',
      destroy: 'Détruire',
      destroyTooltip: 'Détruire définitivement cette session (la machine et ses données seront perdues).'
    } }
  })
  return {
    stop: () => t('sessionControls.stop'),
    /** The Stop button's title: why it waits, while it cannot stop yet. */
    stopTitle: (canStop: boolean) => t(canStop ? 'sessionControls.stop' : 'sessionControls.stopDisabledProvisioning'),
    destroy: () => t('sessionControls.destroy'),
    destroyTooltip: () => t('sessionControls.destroyTooltip')
  }
}
