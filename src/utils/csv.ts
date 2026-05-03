/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * CSV helpers shared across components.
 *
 * sanitizeCSVField protects against:
 *   - Embedded quotes / commas / newlines (standard RFC 4180 quoting).
 *   - Spreadsheet formula injection (=, +, -, @ at field start), which can
 *     execute commands when the CSV is opened in Excel / Google Sheets.
 *     The leading character is escaped by prefixing the value with a single
 *     quote, which the spreadsheet treats as a text marker rather than a
 *     formula trigger.
 */

export function sanitizeCSVField(value: unknown): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@]/.test(s)) {
    s = "'" + s
  }
  return `"${s.replace(/"/g, '""')}"`
}
