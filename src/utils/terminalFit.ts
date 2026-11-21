/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import type { Terminal } from '@xterm/xterm'

const MIN_FONT_SIZE = 4

/**
 * The font size at which a terminal's current grid fits its element, capped at
 * maxFontSize; null while the terminal is not laid out yet.
 *
 * For a grid that cannot reflow — someone else's PTY, which vim and top address
 * by absolute row and column — so the font gives way instead of the grid. Font
 * size rather than a CSS transform: xterm then measures its own cells, and the
 * scroll area and mouse mapping stay right.
 */
export function fontSizeToFit(terminal: Terminal, maxFontSize: number): number | null {
  const el = terminal.element
  const screen = el?.querySelector('.xterm-screen') as HTMLElement | null
  if (!el || !screen || !screen.offsetWidth || !screen.offsetHeight) return null
  const style = getComputedStyle(el)
  const width = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const height = el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
  const ratio = Math.min(width / screen.offsetWidth, height / screen.offsetHeight)
  const fitted = Math.min(maxFontSize, terminal.options.fontSize! * ratio)
  return Math.max(MIN_FONT_SIZE, Math.floor(fitted * 2) / 2)
}
