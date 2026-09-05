/**
 * A placeholder in a translated message must be filled by vue-i18n, never by
 * a string replace on the result.
 *
 * `t('key')` where the message contains `{name}` returns the message with
 * `{name}` ALREADY substituted — with nothing, because no parameter was
 * passed. A subsequent `.replace('{name}', value)` therefore has nothing to
 * match, and the user sees the sentence with a hole in it:
 *
 *     "Your session expires in  minutes."
 *
 * Nothing throws and nothing logs. The mistake spread by copy-paste to six
 * files before anyone noticed, which is why it is pinned here rather than left
 * to review.
 *
 * The fix is always the same shape:
 *
 *     t('key', { name: value })      instead of      t('key').replace('{name}', value)
 *
 * This test scans the source rather than any single component, because the bug
 * is a habit, not a location.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const SRC = join(__dirname, '../../src')

/**
 * Files allowed to call `.replace()` on a `{placeholder}`.
 *
 * Only safe when the string never passed through vue-i18n. Add to this list
 * only after confirming that — the default answer is to pass an i18n parameter
 * instead.
 */
const ALLOWED = new Set([
  // Replaces on a plain { en, fr } object read directly from a local catalogue,
  // never on a t() result, so vue-i18n never sees the placeholder.
  'composables/usePlanFormatters.ts',
])

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.(ts|vue)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('i18n placeholders are interpolated by vue-i18n', () => {
  it('no source file string-replaces a {placeholder}', () => {
    // A quote of any kind, then an opening brace: the shape of a placeholder
    // being patched in after the fact.
    const pattern = /\.replace\(\s*['"`]\{/

    const offenders: string[] = []
    for (const file of sourceFiles(SRC)) {
      const rel = relative(SRC, file).replace(/\\/g, '/')
      if (ALLOWED.has(rel)) continue

      const content = readFileSync(file, 'utf8')
      content.split('\n').forEach((line, index) => {
        if (pattern.test(line)) {
          offenders.push(`${rel}:${index + 1}  ${line.trim()}`)
        }
      })
    }

    expect(
      offenders,
      'Pass the value as an i18n parameter instead:\n' +
        "  t('key', { name: value })   not   t('key').replace('{name}', value)\n\n" +
        offenders.join('\n')
    ).toEqual([])
  })
})
