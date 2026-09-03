/**
 * CSV delimiter detection for the bulk-import preview.
 *
 * French Excel exports separate columns with a semicolon or a tab, and start
 * the file with a UTF-8 byte-order mark. The delimiter is read from the
 * first line, BOM stripped, as the one among comma, semicolon and tab that
 * yields the most fields on a plain split; ties fall to the earlier
 * candidate, so a single-column or empty header keeps the comma.
 *
 * This mirrors the backend rule in ocf-core `src/organizations/utils`
 * (users CSV parsing). Change both together: the preview must show the
 * columns the import will actually read.
 */

export type CsvDelimiter = ',' | ';' | '\t'

const CANDIDATES: CsvDelimiter[] = [',', ';', '\t']

export interface ParsedCsv {
  delimiter: CsvDelimiter
  headers: string[]
  rows: string[][]
}

function stripBom(text: string): string {
  return text.startsWith('\uFEFF') ? text.slice(1) : text
}

function lines(text: string): string[] {
  return stripBom(text).split(/\r?\n/)
}

function nonEmptyLines(text: string): string[] {
  return lines(text).filter(line => line.trim() !== '')
}

export function detectCsvDelimiter(text: string): CsvDelimiter {
  const header = lines(text)[0]
  let best: CsvDelimiter = ','
  let bestCount = 0
  for (const candidate of CANDIDATES) {
    const count = header.split(candidate).length
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }
  return best
}

/** Splits one line on the delimiter, keeping a quoted delimiter inside its field. */
export function splitCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  fields.push(current.trim())
  return fields
}

export function parseCsvText(text: string): ParsedCsv {
  const lines = nonEmptyLines(text)
  if (lines.length === 0) {
    return { delimiter: ',', headers: [], rows: [] }
  }

  const delimiter = detectCsvDelimiter(text)
  // Rows are shown with exactly the fields they have: the backend rejects a
  // row whose field count differs from the header, and the preview must show
  // the same picture rather than a table the import will not accept.
  return {
    delimiter,
    headers: splitCsvLine(lines[0], delimiter),
    rows: lines.slice(1).map(line => splitCsvLine(line, delimiter)),
  }
}
