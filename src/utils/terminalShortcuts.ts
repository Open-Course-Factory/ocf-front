/**
 * Terminal keyboard shortcuts
 *
 * In a terminal, Ctrl+Shift+C means "copy". In the browser it opens the
 * inspector, which reaches the page first and so can be taken back. Ctrl+W
 * (delete word) cannot: the browser closes the tab without telling the page,
 * so the console asks before leaving instead (see TerminalViewer).
 *
 * Returns a handler for xterm's `attachCustomKeyEventHandler`: `false` means
 * xterm must not process the key.
 */
export function terminalKeyHandler(getSelection: () => string) {
  return (event: KeyboardEvent): boolean => {
    if (event.type !== 'keydown' || !event.ctrlKey || !event.shiftKey || event.code !== 'KeyC') return true
    event.preventDefault()
    const selection = getSelection()
    if (selection) navigator.clipboard?.writeText(selection).catch(() => {})
    return false
  }
}
