/**
 * Client-side split of a single `name` column into first_name / last_name.
 *
 * ocf-core (`src/organizations/utils/csvParser.go`, `validateUserRow`) splits
 * a lone `name` cell at its LAST space, last name first, with no way to say
 * otherwise. Class lists come in every order and with 2-to-4-word names, so
 * the user decides here, per row, where the cut is and which side is the
 * last name; the users file is then uploaded with explicit first_name and
 * last_name columns, which the backend takes as they are. Only rows the
 * backend would split itself — a name with empty first_name and last_name —
 * are touched; the column aliases mirror the backend's `columnAliases`.
 */

import { detectCsvDelimiter, splitCsvLine, type CsvDelimiter } from './csvDelimiter'

export type NameOrder = 'last_first' | 'first_last'

export interface RowSplitOverride {
  /** Number of words on the left of the cut. */
  cut: number
  order: NameOrder
}

export interface NameSplitPlan {
  order: NameOrder
  /** Rows the user adjusted by hand, keyed by data-row index (header excluded). */
  overrides: Record<number, RowSplitOverride>
}

export interface SplitName {
  firstName: string
  lastName: string
}

export interface RowSplit extends SplitName {
  words: string[]
  cut: number
  order: NameOrder
  adjusted: boolean
}

export interface NameRow {
  index: number
  name: string
}

const NAME_HEADERS = ['name', 'nom']
const FIRST_NAME_HEADERS = ['first_name', 'prénom', 'prenom']
const LAST_NAME_HEADERS = ['last_name', 'nom de famille']

export function emptyNameSplitPlan(): NameSplitPlan {
  return { order: 'last_first', overrides: {} }
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase()
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex(h => candidates.includes(normalizeHeader(h)))
}

export function findNameColumns(headers: string[]) {
  return {
    name: findColumn(headers, NAME_HEADERS),
    firstName: findColumn(headers, FIRST_NAME_HEADERS),
    lastName: findColumn(headers, LAST_NAME_HEADERS),
  }
}

function cell(row: string[], col: number): string {
  return col === -1 ? '' : (row[col] ?? '').trim()
}

/** The rows the backend would split itself: a name, and no first/last name of their own. */
export function rowsNeedingSplit(headers: string[], rows: string[][]): NameRow[] {
  const cols = findNameColumns(headers)
  if (cols.name === -1) return []
  return rows
    .map((row, index) => ({ index, name: cell(row, cols.name) }))
    .filter(({ index, name }) => name !== '' && cell(rows[index], cols.firstName) === '' && cell(rows[index], cols.lastName) === '')
}

export function nameWords(name: string): string[] {
  return name.trim().split(/\s+/).filter(word => word !== '')
}

/** `last_first` cuts before the last word (the backend's own rule); `first_last` after the first. */
export function defaultCut(wordCount: number, order: NameOrder): number {
  if (wordCount < 2) return 0
  return order === 'last_first' ? wordCount - 1 : 1
}

export function splitWords(words: string[], cut: number, order: NameOrder): SplitName {
  if (words.length < 2 || cut <= 0 || cut >= words.length) {
    return { firstName: '', lastName: words.join(' ') }
  }
  const left = words.slice(0, cut).join(' ')
  const right = words.slice(cut).join(' ')
  return order === 'last_first'
    ? { lastName: left, firstName: right }
    : { firstName: left, lastName: right }
}

export function resolveRowSplit(name: string, rowIndex: number, plan: NameSplitPlan): RowSplit {
  const words = nameWords(name)
  const override = plan.overrides[rowIndex]
  const order = override?.order ?? plan.order
  const cut = override ? Math.min(Math.max(override.cut, 0), words.length) : defaultCut(words.length, order)
  return { words, cut, order, adjusted: override !== undefined, ...splitWords(words, cut, order) }
}

/** Splits a line on the unquoted delimiter, keeping each field's raw text (quotes included). */
function splitRawFields(line: string, delimiter: CsvDelimiter): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if (char === delimiter && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

function quoteField(value: string, delimiter: CsvDelimiter): string {
  return /["\r\n]/.test(value) || value.includes(delimiter) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Rewrites the users CSV so every row the backend would split carries its
 * first_name and last_name as decided by the plan. Everything else — other
 * columns, other rows, delimiter, line endings, blank lines — is kept
 * verbatim. A file with nothing to split comes back unchanged.
 */
export function rewriteUsersCsvWithNameSplit(text: string, plan: NameSplitPlan): string {
  const bom = text.startsWith('\uFEFF') ? '\uFEFF' : ''
  const body = text.slice(bom.length)
  const newline = body.includes('\r\n') ? '\r\n' : '\n'
  const lines = body.split(/\r?\n/)
  const headerLineIndex = lines.findIndex(line => line.trim() !== '')
  if (headerLineIndex === -1) return text

  const delimiter = detectCsvDelimiter(body)
  const headers = splitCsvLine(lines[headerLineIndex], delimiter)
  const cols = findNameColumns(headers)
  if (cols.name === -1) return text

  const dataLines = lines.slice(headerLineIndex + 1)
  const rows = dataLines.filter(line => line.trim() !== '').map(line => splitCsvLine(line, delimiter))
  const toSplit = new Map(rowsNeedingSplit(headers, rows).map(row => [row.index, row.name]))
  if (toSplit.size === 0) return text

  const addColumns = cols.firstName === -1 && cols.lastName === -1
  const out = lines.slice(0, headerLineIndex)

  const headerFields = splitRawFields(lines[headerLineIndex], delimiter)
  if (addColumns) {
    headerFields.splice(cols.name, 1, 'first_name', 'last_name')
  }
  out.push(headerFields.join(delimiter))

  let rowIndex = -1
  for (const line of dataLines) {
    if (line.trim() === '') {
      out.push(line)
      continue
    }
    rowIndex++
    const fields = splitRawFields(line, delimiter)
    const name = toSplit.get(rowIndex)
    if (name === undefined) {
      if (addColumns) fields.splice(cols.name, 1, fields[cols.name] ?? '', '')
      out.push(fields.join(delimiter))
      continue
    }
    const split = resolveRowSplit(name, rowIndex, plan)
    const first = quoteField(split.firstName, delimiter)
    const last = quoteField(split.lastName, delimiter)
    if (addColumns) {
      fields.splice(cols.name, 1, first, last)
    } else {
      fields[cols.firstName] = first
      fields[cols.lastName] = last
    }
    out.push(fields.join(delimiter))
  }

  return bom + out.join(newline)
}

/** The users file as it will be uploaded: the same File when there is nothing to split. */
export async function prepareUsersFile(file: File, plan: NameSplitPlan): Promise<File> {
  const text = await file.text()
  const rewritten = rewriteUsersCsvWithNameSplit(text, plan)
  if (rewritten === text) return file
  return new File([rewritten], file.name, { type: file.type || 'text/csv' })
}
