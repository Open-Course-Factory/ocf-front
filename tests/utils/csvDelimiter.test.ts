/**
 * The import preview must split a file the way the backend will.
 *
 * French Excel exports separate columns with a semicolon (or a tab), not a
 * comma, and start the file with a UTF-8 byte-order mark. The backend detects
 * the delimiter from line 1, BOM stripped, as the one among comma / semicolon /
 * tab that yields the most fields, earliest winning a tie; the front mirrors
 * that exact rule so the preview shows the same columns the import will read.
 * See ocf-core `src/organizations/utils` for the backend side of this rule.
 */

import { describe, it, expect } from 'vitest'
import { detectCsvDelimiter, parseCsvText } from '../../src/utils/csvDelimiter'

const frenchHeader = 'Nom;Né(e) le;Sexe;E-mail;Heures manquées;Entrée;Sortie'

describe('detectCsvDelimiter', () => {
  it('keeps the comma for a comma-separated header', () => {
    expect(detectCsvDelimiter('email,first_name,last_name\n')).toBe(',')
  })

  it('picks the semicolon for a French classroom export', () => {
    expect(detectCsvDelimiter(`${frenchHeader}\nDUPONT Marie;01/02/2008;F;m@x.fr;0;;`)).toBe(';')
  })

  it('picks the tab for a tab-separated export', () => {
    expect(detectCsvDelimiter('Nom\tE-mail\tSexe\nDUPONT\tm@x.fr\tF')).toBe('\t')
  })

  it('decides from the header line alone, even when a later row disagrees', () => {
    expect(detectCsvDelimiter('email,name\na@x.fr;b;c;d')).toBe(',')
  })

  it('defaults to the comma for an empty file', () => {
    expect(detectCsvDelimiter('')).toBe(',')
  })

  it('defaults to the comma for a single-column header', () => {
    expect(detectCsvDelimiter('email\na@x.fr')).toBe(',')
  })

  it('reads line 1 only, as the backend does, so a leading blank line keeps the comma', () => {
    expect(detectCsvDelimiter(`\n${frenchHeader}`)).toBe(',')
  })

  it('ignores a UTF-8 byte-order mark before the header', () => {
    expect(detectCsvDelimiter(`\uFEFF${frenchHeader}`)).toBe(';')
  })
})

describe('parseCsvText', () => {
  it('splits every column of a semicolon-separated file', () => {
    const parsed = parseCsvText(`${frenchHeader}\nDUPONT Marie;01/02/2008;F;m@x.fr;0;;`)

    expect(parsed.delimiter).toBe(';')
    expect(parsed.headers).toHaveLength(7)
    expect(parsed.headers[3]).toBe('E-mail')
    expect(parsed.rows).toEqual([['DUPONT Marie', '01/02/2008', 'F', 'm@x.fr', '0', '', '']])
  })

  it('keeps a quoted delimiter inside its field', () => {
    const parsed = parseCsvText('name,note\n"Dupont, Marie",ok')

    expect(parsed.rows).toEqual([['Dupont, Marie', 'ok']])
  })

  it('returns the headers and no rows for a header-only file', () => {
    const parsed = parseCsvText(`${frenchHeader}\n`)

    expect(parsed.headers).toHaveLength(7)
    expect(parsed.rows).toEqual([])
  })

  it('returns nothing for an empty file', () => {
    expect(parseCsvText('')).toEqual({ delimiter: ',', headers: [], rows: [] })
  })

  it('reads a French Excel export: BOM, an unnamed column, and a trailing separator on every row', () => {
    const excelExport =
      '\uFEFFname;Né(e) le;Sexe;email;Heures manquées;;Entrée;Sortie;\r\n' +
      'FAKENAME Alix;01/02/2008;F;alix.fakename@example.invalid;0;;01/09/2025;;\r\n' +
      'TESTNOM Camille;15/06/2008;M;camille.testnom@example.invalid;2;;01/09/2025;;\r\n'

    const parsed = parseCsvText(excelExport)

    expect(parsed.delimiter).toBe(';')
    expect(parsed.headers).toEqual(['name', 'Né(e) le', 'Sexe', 'email', 'Heures manquées', '', 'Entrée', 'Sortie', ''])
    expect(parsed.rows).toHaveLength(2)
    for (const row of parsed.rows) {
      expect(row).toHaveLength(parsed.headers.length)
    }
    expect(parsed.rows[0][3]).toBe('alix.fakename@example.invalid')
  })

  it('keeps a surplus field, even an empty one, so the preview shows the row the backend will reject', () => {
    const parsed = parseCsvText('email;name\na@x.fr;A;extra\nb@x.fr;B;')

    expect(parsed.rows).toEqual([['a@x.fr', 'A', 'extra'], ['b@x.fr', 'B', '']])
  })

  it('ignores blank lines and a Windows line ending', () => {
    const parsed = parseCsvText('email,name\r\n\r\na@x.fr,A\r\n')

    expect(parsed.headers).toEqual(['email', 'name'])
    expect(parsed.rows).toEqual([['a@x.fr', 'A']])
  })
})
