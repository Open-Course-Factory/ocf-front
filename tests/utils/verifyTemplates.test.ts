/**
 * The verify-script templates are shell that ocf-core runs with `sh -c` in the
 * learner's container. A snippet that does not parse fails every learner, and
 * one that passes when it should not lets everyone through — so each is parsed
 * by a real `sh -n`, and the ones that need nothing special are run for real.
 */

import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'

import { VERIFY_TEMPLATES, insertSnippet, templateLocale } from '../../src/utils/verifyTemplates'

function sh(args: string[], script: string) {
  return spawnSync('sh', [...args, '-c', script], { encoding: 'utf8' })
}

function template(key: string) {
  const found = VERIFY_TEMPLATES.find(tpl => tpl.key === key)
  if (!found) throw new Error(`no template ${key}`)
  return found
}

/** The English snippet with its placeholders filled in. */
function filled(key: string, values: Record<string, string>) {
  return Object.entries(values).reduce((script, [name, value]) => script.split(`__${name}__`).join(value), template(key).script('en'))
}

describe('verify templates', () => {
  it.each(VERIFY_TEMPLATES.flatMap(tpl => (['en', 'fr'] as const).map(locale => [tpl.key, locale] as const)))(
    '%s (%s) is valid POSIX sh',
    (key, locale) => {
      const result = sh(['-n'], template(key).script(locale))
      expect(result.stderr).toBe('')
      expect(result.status).toBe(0)
    }
  )

  it('labels every template in both languages and leaves something to fill in', () => {
    for (const tpl of VERIFY_TEMPLATES) {
      expect(tpl.label.en).not.toBe('')
      expect(tpl.label.fr).not.toBe('')
      expect(tpl.script('en')).toMatch(/__[A-Z_]+__/)
    }
  })

  it.each([
    ['file-exists', { FILE: '/etc/passwd' }, { FILE: '/no/such/file' }],
    ['dir-exists', { DIRECTORY: '/etc' }, { DIRECTORY: '/no/such/dir' }],
    ['file-contains', { FILE: '/etc/passwd', TEXT: 'root' }, { FILE: '/etc/passwd', TEXT: 'no-such-text-anywhere' }],
    ['user-exists', { USER: 'root' }, { USER: 'no-such-user-here' }],
    ['output-matches', { EXPECTED_OUTPUT: 'hello', COMMAND: 'echo hello' }, { EXPECTED_OUTPUT: 'bye', COMMAND: 'echo hello' }]
  ])('%s passes silently when met and explains itself when not', (key, met, unmet) => {
    const pass = sh([], filled(key, met))
    expect(pass.status).toBe(0)
    expect(pass.stdout).toBe('')

    const failure = sh([], filled(key, unmet))
    expect(failure.status).toBe(1)
    expect(failure.stdout.trim()).not.toBe('')
  })

  it('chains: a script made of several snippets fails at the first unmet one', () => {
    const script = [filled('dir-exists', { DIRECTORY: '/etc' }), filled('file-exists', { FILE: '/no/such/file' })].join('\n')
    const result = sh([], script)
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('/no/such/file')
  })

  it('writes the message in the scenario language', () => {
    expect(templateLocale('fr')).toBe('fr')
    expect(templateLocale('fr-FR')).toBe('fr')
    expect(templateLocale('en')).toBe('en')
    expect(templateLocale('de')).toBe('en')
    expect(templateLocale(undefined)).toBe('en')
    expect(template('file-exists').script('fr')).toContain("n'existe pas encore")
  })
})

describe('insertSnippet', () => {
  it('fills an empty script and selects the first placeholder', () => {
    const { text, selection } = insertSnippet('', 0, "file='__FILE__'\ntest")
    expect(text).toBe("file='__FILE__'\ntest\n")
    expect(text.slice(selection.start, selection.end)).toBe('__FILE__')
  })

  it('appends rather than inserting above a shebang when the caret is at 0', () => {
    const { text } = insertSnippet('#!/bin/bash\necho hi\n', 0, 'X')
    expect(text).toBe('#!/bin/bash\necho hi\n\nX\n')
  })

  it('goes after the check holding the caret, never inside it', () => {
    const script = "a='1'\ncheck a\n\nb='2'\ncheck b\n"
    const { text, selection } = insertSnippet(script, 3, "v='__V__'")
    expect(text).toBe("a='1'\ncheck a\n\nv='__V__'\n\nb='2'\ncheck b\n")
    expect(text.slice(selection.start, selection.end)).toBe('__V__')
  })

  it('appends after the last check when the caret is in it', () => {
    expect(insertSnippet("a='1'\ncheck a\n", 3, 'X').text).toBe("a='1'\ncheck a\n\nX\n")
  })
})
