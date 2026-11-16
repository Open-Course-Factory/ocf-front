/**
 * Switches the jsdom tab between visible and hidden the way a browser does:
 * `document.hidden` / `visibilityState` change, then `visibilitychange` fires.
 */
export function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  Object.defineProperty(document, 'visibilityState', {
    value: hidden ? 'hidden' : 'visible',
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}
