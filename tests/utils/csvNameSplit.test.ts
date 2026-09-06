/**
 * A class list's single `name` column is split on the client, per row, and the
 * users file is uploaded with explicit first_name / last_name columns.
 *
 * The backend only ever cut at the last space, last name first; a
 * first-name-first export imported every learner under the wrong last name,
 * and 3-or-4-word names have no single right cut. Everything the user did
 * not decide must reach the backend verbatim.
 */

import { describe, it, expect } from 'vitest'

import {
  defaultCut,
  emptyNameSplitPlan,
  findNameColumns,
  prepareUsersFile,
  resolveRowSplit,
  rewriteUsersCsvWithNameSplit,
  rowsNeedingSplit,
  splitWords,
  type NameSplitPlan,
} from '../../src/utils/csvNameSplit'

function plan(overrides: Partial<NameSplitPlan> = {}): NameSplitPlan {
  return { ...emptyNameSplitPlan(), ...overrides }
}

describe('defaultCut and splitWords', () => {
  it('cuts before the last word for last name first, the rule the backend applied', () => {
    expect(defaultCut(2, 'last_first')).toBe(1)
    expect(defaultCut(4, 'last_first')).toBe(3)
    expect(splitWords(['DE', 'LA', 'FONTAINE', 'Jean'], 3, 'last_first')).toEqual({ lastName: 'DE LA FONTAINE', firstName: 'Jean' })
  })

  it('cuts after the first word for first name first', () => {
    expect(defaultCut(3, 'first_last')).toBe(1)
    expect(splitWords(['Jean', 'Marie', 'DUPONT'], 1, 'first_last')).toEqual({ firstName: 'Jean', lastName: 'Marie DUPONT' })
  })

  it('keeps a single word as the last name only, whatever the order', () => {
    expect(defaultCut(1, 'first_last')).toBe(0)
    expect(splitWords(['Madonna'], 0, 'last_first')).toEqual({ firstName: '', lastName: 'Madonna' })
    expect(splitWords(['Madonna'], 0, 'first_last')).toEqual({ firstName: '', lastName: 'Madonna' })
  })
})

describe('resolveRowSplit', () => {
  it('follows the plan order for a row without override', () => {
    const split = resolveRowSplit('Marie DUPONT', 0, plan({ order: 'first_last' }))
    expect(split).toMatchObject({ firstName: 'Marie', lastName: 'DUPONT', cut: 1, adjusted: false })
  })

  it('uses the row override, cut and order, over the plan order', () => {
    const split = resolveRowSplit('Jean Marie DE LA FONTAINE', 4, plan({ order: 'last_first', overrides: { 4: { cut: 2, order: 'first_last' } } }))
    expect(split).toMatchObject({ firstName: 'Jean Marie', lastName: 'DE LA FONTAINE', cut: 2, adjusted: true })
  })

  it('flags a single-word name', () => {
    expect(resolveRowSplit('Madonna', 0, plan())).toMatchObject({ words: ['Madonna'], cut: 0, firstName: '', lastName: 'Madonna' })
  })
})

describe('findNameColumns and rowsNeedingSplit', () => {
  it('resolves the French headers the backend aliases, BOM included', () => {
    expect(findNameColumns(['﻿Nom', 'Prénom', 'E-mail'])).toEqual({ name: 0, firstName: 1, lastName: -1 })
    expect(findNameColumns(['email', 'first_name', 'last_name'])).toEqual({ name: -1, firstName: 1, lastName: 2 })
  })

  it('lists only rows with a name and no first/last name of their own', () => {
    const headers = ['email', 'name', 'first_name', 'last_name']
    const rows = [
      ['a@x.fr', 'DUPONT Marie', 'Marie', 'DUPONT'],
      ['b@x.fr', 'MARTIN Jean', '', ''],
      ['c@x.fr', '', '', ''],
    ]
    expect(rowsNeedingSplit(headers, rows)).toEqual([{ index: 1, name: 'MARTIN Jean' }])
  })
})

describe('rewriteUsersCsvWithNameSplit', () => {
  it('replaces the name column with first_name and last_name, last name first by default', () => {
    const out = rewriteUsersCsvWithNameSplit('email,name,role\na@x.fr,DUPONT Marie,member\n', plan())
    expect(out).toBe('email,first_name,last_name,role\na@x.fr,Marie,DUPONT,member\n')
  })

  it('splits 2, 3 and 4-word names first name first when asked', () => {
    const text = 'email,name\na@x.fr,Marie DUPONT\nb@x.fr,Jean Marie DUPONT\nc@x.fr,Jean DE LA FONTAINE\n'
    const out = rewriteUsersCsvWithNameSplit(text, plan({ order: 'first_last' }))
    expect(out).toBe('email,first_name,last_name\na@x.fr,Marie,DUPONT\nb@x.fr,Jean,Marie DUPONT\nc@x.fr,Jean,DE LA FONTAINE\n')
  })

  it('splits 3 and 4-word names last name first by default', () => {
    const text = 'email,name\nb@x.fr,DUPONT Jean Marie\nc@x.fr,DE LA FONTAINE Jean\n'
    expect(rewriteUsersCsvWithNameSplit(text, plan())).toBe('email,first_name,last_name\nb@x.fr,Marie,DUPONT Jean\nc@x.fr,Jean,DE LA FONTAINE\n')
  })

  it('applies a per-row override and leaves the other rows on the default', () => {
    const text = 'email,name\na@x.fr,DUPONT Jean Marie\nb@x.fr,MARTIN Jean\n'
    const out = rewriteUsersCsvWithNameSplit(text, plan({ overrides: { 0: { cut: 1, order: 'last_first' } } }))
    expect(out).toBe('email,first_name,last_name\na@x.fr,Jean Marie,DUPONT\nb@x.fr,Jean,MARTIN\n')
  })

  it('puts a single-word name in last_name with an empty first_name', () => {
    expect(rewriteUsersCsvWithNameSplit('email,name\na@x.fr,Madonna\n', plan())).toBe('email,first_name,last_name\na@x.fr,,Madonna\n')
  })

  it('reads a quoted name and keeps the other quoted fields verbatim', () => {
    const text = 'email,name,note\na@x.fr,"DUPONT, Marie","said ""hi"", left"\n'
    const out = rewriteUsersCsvWithNameSplit(text, plan({ order: 'first_last' }))
    expect(out).toBe('email,first_name,last_name,note\na@x.fr,"DUPONT,",Marie,"said ""hi"", left"\n')
  })

  it('keeps a semicolon delimiter, the BOM and Windows line endings', () => {
    const text = '﻿Nom;E-mail;Sexe\r\nDUPONT Marie;a@x.fr;F\r\n'
    expect(rewriteUsersCsvWithNameSplit(text, plan())).toBe('﻿first_name;last_name;E-mail;Sexe\r\nMarie;DUPONT;a@x.fr;F\r\n')
  })

  it('fills only the blank first_name/last_name cells when the file already has those columns', () => {
    const text = 'email,name,first_name,last_name\na@x.fr,DUPONT Marie,Marie,DUPONT\nb@x.fr,Jean MARTIN,,\n'
    const out = rewriteUsersCsvWithNameSplit(text, plan({ order: 'first_last' }))
    expect(out).toBe('email,name,first_name,last_name\na@x.fr,DUPONT Marie,Marie,DUPONT\nb@x.fr,Jean MARTIN,Jean,MARTIN\n')
  })

  it('returns a file with no name column, or nothing to split, unchanged', () => {
    const explicit = 'email,first_name,last_name\na@x.fr,Marie,DUPONT\n'
    expect(rewriteUsersCsvWithNameSplit(explicit, plan())).toBe(explicit)
    const filled = 'email,name,first_name,last_name\na@x.fr,DUPONT Marie,Marie,DUPONT\n'
    expect(rewriteUsersCsvWithNameSplit(filled, plan())).toBe(filled)
    expect(rewriteUsersCsvWithNameSplit('', plan())).toBe('')
    expect(rewriteUsersCsvWithNameSplit('email,name\n', plan())).toBe('email,name\n')
  })

  it('keeps blank lines where they are', () => {
    const text = 'email,name\n\na@x.fr,DUPONT Marie\n\n'
    expect(rewriteUsersCsvWithNameSplit(text, plan())).toBe('email,first_name,last_name\n\na@x.fr,Marie,DUPONT\n\n')
  })
})

describe('prepareUsersFile', () => {
  it('returns the very same File when there is nothing to split', async () => {
    const file = new File(['email,first_name,last_name\na@x.fr,Marie,DUPONT\n'], 'users.csv', { type: 'text/csv' })
    expect(await prepareUsersFile(file, plan())).toBe(file)
  })

  it('returns a new File of the same name carrying the split columns', async () => {
    const file = new File(['email,name\na@x.fr,Marie DUPONT\n'], 'classe.csv', { type: 'text/csv' })
    const prepared = await prepareUsersFile(file, plan({ order: 'first_last' }))
    expect(prepared).not.toBe(file)
    expect(prepared.name).toBe('classe.csv')
    expect(await prepared.text()).toBe('email,first_name,last_name\na@x.fr,Marie,DUPONT\n')
  })
})
