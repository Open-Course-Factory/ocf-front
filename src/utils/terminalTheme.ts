/**
 * Terminal Theme Utility
 * Provides XTerm.js theme configuration based on CSS variables
 * Supports dark mode and ensures consistency across terminal components
 */

/**
 * Get a CSS variable value from the document root
 * @param variableName - CSS variable name (with or without --)
 * @returns The computed CSS variable value
 */
function getCSSVariable(variableName: string): string {
  const name = variableName.startsWith('--') ? variableName : `--${variableName}`
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

/**
 * XTerm.js Theme interface
 */
export interface ITerminalTheme {
  background?: string
  foreground?: string
  cursor?: string
  selection?: string
  black?: string
  red?: string
  green?: string
  yellow?: string
  blue?: string
  magenta?: string
  cyan?: string
  white?: string
  brightBlack?: string
  brightRed?: string
  brightGreen?: string
  brightYellow?: string
  brightBlue?: string
  brightMagenta?: string
  brightCyan?: string
  brightWhite?: string
}

/**
 * Build XTerm.js theme from CSS variables
 * Falls back to hardcoded values if CSS variables are not available
 *
 * @returns XTerm.js compatible theme object
 *
 * @example
 * import { getTerminalTheme } from '../../utils/terminalTheme'
 *
 * const terminal = new Terminal({
 *   theme: getTerminalTheme(),
 *   fontSize: 14,
 *   // ... other options
 * })
 */
export function getTerminalTheme(): ITerminalTheme {
  try {
    return {
      background: getCSSVariable('terminal-bg') || '#1e1e1e',
      foreground: getCSSVariable('terminal-fg') || '#d4d4d4',
      cursor: getCSSVariable('terminal-cursor') || '#ffffff',
      selection: getCSSVariable('terminal-selection') || '#264f78',

      // ANSI colors
      black: getCSSVariable('terminal-ansi-black') || '#000000',
      red: getCSSVariable('terminal-ansi-red') || '#f44747',
      green: getCSSVariable('terminal-ansi-green') || '#6a9955',
      yellow: getCSSVariable('terminal-ansi-yellow') || '#dcdcaa',
      blue: getCSSVariable('terminal-ansi-blue') || '#569cd6',
      magenta: getCSSVariable('terminal-ansi-magenta') || '#c586c0',
      cyan: getCSSVariable('terminal-ansi-cyan') || '#4ec9b0',
      white: getCSSVariable('terminal-ansi-white') || '#d4d4d4',

      // Bright ANSI colors
      brightBlack: getCSSVariable('terminal-ansi-bright-black') || '#6a6a6a',
      brightRed: getCSSVariable('terminal-ansi-red') || '#f44747',
      brightGreen: getCSSVariable('terminal-ansi-green') || '#6a9955',
      brightYellow: getCSSVariable('terminal-ansi-yellow') || '#dcdcaa',
      brightBlue: getCSSVariable('terminal-ansi-blue') || '#569cd6',
      brightMagenta: getCSSVariable('terminal-ansi-magenta') || '#c586c0',
      brightCyan: getCSSVariable('terminal-ansi-cyan') || '#4ec9b0',
      brightWhite: getCSSVariable('terminal-ansi-bright-white') || '#ffffff',
    }
  } catch (error) {
    console.warn('Failed to load terminal theme from CSS variables, using defaults:', error)

    // Fallback to default theme
    return {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      selection: '#264f78',
      black: '#000000',
      red: '#f44747',
      green: '#6a9955',
      yellow: '#dcdcaa',
      blue: '#569cd6',
      magenta: '#c586c0',
      cyan: '#4ec9b0',
      white: '#d4d4d4',
      brightBlack: '#6a6a6a',
      brightRed: '#f44747',
      brightGreen: '#6a9955',
      brightYellow: '#dcdcaa',
      brightBlue: '#569cd6',
      brightMagenta: '#c586c0',
      brightCyan: '#4ec9b0',
      brightWhite: '#ffffff',
    }
  }
}

/**
 * Update terminal theme dynamically (e.g., when theme changes)
 * @param terminal - XTerm.js Terminal instance
 *
 * @example
 * // Update theme when dark mode toggles
 * watch(isDarkMode, () => {
 *   if (terminal.value) {
 *     updateTerminalTheme(terminal.value)
 *   }
 * })
 */
export function updateTerminalTheme(terminal: any): void {
  if (terminal && terminal.options) {
    terminal.options.theme = getTerminalTheme()
  }
}
