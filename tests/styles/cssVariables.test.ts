import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// A var() on an undefined custom property drops the declaration (no fallback)
// or always resolves to the fallback, i.e. a hardcoded value posing as a token.
// No third-party exclusions today: nothing in src reads --el-*, --vf-* or xterm vars.
// Blind spots: var() inside .ts strings is not scanned; a `--x:` inside a CSS comment counts as defined.
// The lookbehind keeps BEM modifiers (`.badge--remove:hover`) from counting as definitions.

const root = resolve(__dirname, '../..')
const src = join(root, 'src')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  )
}

const files = walk(src).filter((f) => /\.(css|vue|ts)$/.test(f))
const sources = files.map((f) => ({ file: relative(root, f), text: readFileSync(f, 'utf8') }))

// `--x:` in CSS and inline styles, `'--x': …` in :style bindings, setProperty('--x', …) in scripts.
const defined = new Set<string>()
for (const { text } of sources) {
  for (const m of text.matchAll(/(?<![\w-])(--[\w-]+)['"`]?\s*:/g)) defined.add(m[1])
  for (const m of text.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) defined.add(m[1])
}

type Uses = Map<string, Map<string, number>>
const noFallback: Uses = new Map()
const withFallback: Uses = new Map()
for (const { file, text } of sources) {
  if (file.endsWith('.ts')) continue
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*(,?)/g)) {
    if (defined.has(m[1])) continue
    const group = m[2] ? withFallback : noFallback
    const perFile = group.get(m[1]) ?? new Map<string, number>()
    perFile.set(file, (perFile.get(file) ?? 0) + 1)
    group.set(m[1], perFile)
  }
}

function report(title: string, uses: Uses): string {
  if (uses.size === 0) return ''
  const lines = [...uses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, perFile]) => {
    const where = [...perFile.entries()].map(([f, n]) => `${f} x${n}`).join(', ')
    return `  ${name}: ${where}`
  })
  return `${title}:\n${lines.join('\n')}\n`
}

describe('CSS custom properties', () => {
  it('every var(--x) used in src is defined somewhere in src', () => {
    const message =
      report('no fallback (declaration is dropped)', noFallback) +
      report('has fallback (fallback always wins)', withFallback)
    expect(message, message).toBe('')
  })
})
