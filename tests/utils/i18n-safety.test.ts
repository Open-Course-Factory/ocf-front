import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Scans translation strings for unescaped vue-i18n special characters.
 *
 * In vue-i18n v11, `@` is reserved for linked messages (@:key).
 * Literal `@` must be escaped as `{'@'}`.
 *
 * This test prevents regressions like the PasswordReset SyntaxError
 * caused by `emailPlaceholder: 'your@email.com'` after the v9→v11 upgrade.
 */

function findFilesRecursively(dir: string, extensions: string[]): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...findFilesRecursively(fullPath, extensions))
    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Extracts the <script> block content from a .vue file.
 * Returns the full content for non-.vue files.
 */
function extractScriptBlock(content: string, filePath: string): string {
  if (!filePath.endsWith('.vue')) return content
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  return scriptMatch ? scriptMatch[1] : ''
}

/**
 * Extracts only the content inside useTranslations({...}), useStoreTranslations({...}),
 * and createI18n({...}) argument blocks. For locale files, returns the full content.
 */
function extractTranslationBlocks(content: string, filePath: string): string[] {
  // Locale data files are entirely translation content
  if (filePath.includes('/locales/')) return [content]

  const blocks: string[] = []
  const patterns = ['useTranslations(', 'useStoreTranslations(', 'createI18n(']

  for (const pattern of patterns) {
    let startIdx = content.indexOf(pattern)
    while (startIdx !== -1) {
      const blockStart = content.indexOf('{', startIdx)
      if (blockStart === -1) break

      // Find matching closing brace by tracking depth
      let depth = 1
      let pos = blockStart + 1
      while (pos < content.length && depth > 0) {
        const ch = content[pos]
        if (ch === '{') depth++
        else if (ch === '}') depth--
        // Skip string contents to avoid counting braces inside strings
        else if (ch === "'" || ch === '"' || ch === '`') {
          const quote = ch
          pos++
          while (pos < content.length && content[pos] !== quote) {
            if (content[pos] === '\\') pos++ // skip escaped chars
            pos++
          }
        }
        pos++
      }

      blocks.push(content.substring(blockStart, pos))
      startIdx = content.indexOf(pattern, pos)
    }
  }

  return blocks
}

/**
 * Finds unescaped @ in string values within translation blocks.
 */
function findUnescapedAt(blocks: string[], filePath: string): string[] {
  const violations: string[] = []
  const relativePath = path.relative(path.resolve(__dirname, '../..'), filePath)

  for (const block of blocks) {
    const lines = block.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue

      // Match object property string values containing @
      const matches = trimmed.matchAll(/:\s*(['"])((?:[^'"\\]|\\.)*)@([a-zA-Z](?:[^'"\\]|\\.)*)\1/g)

      for (const match of matches) {
        const fullValue = match[2] + '@' + match[3]

        // Skip if already escaped
        if (fullValue.includes("{'@'}")) continue

        // Skip regex-like patterns
        if (fullValue.includes('[^') || fullValue.includes('\\s')) continue

        violations.push(`  ${relativePath}: ${trimmed.substring(0, 120)}`)
      }
    }
  }

  return violations
}

describe('i18n safety', () => {
  it('translation strings should not contain unescaped @ (vue-i18n v11 reserved character)', () => {
    const srcDir = path.resolve(__dirname, '../../src')
    const files = findFilesRecursively(srcDir, ['.vue', '.ts'])

    const allViolations: string[] = []

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const scriptContent = extractScriptBlock(content, file)
      if (!scriptContent) continue

      const blocks = extractTranslationBlocks(scriptContent, file)
      if (blocks.length === 0) continue

      allViolations.push(...findUnescapedAt(blocks, file))
    }

    expect(
      allViolations,
      [
        'Found unescaped @ in translation strings.',
        'In vue-i18n v11, @ is a reserved character (linked messages).',
        "Escape with literal syntax: {'@'}",
        'Example: "user@example.com" → "user{\'@\'}example.com"',
        '',
        'Violations:',
        ...allViolations
      ].join('\n')
    ).toHaveLength(0)
  })
})
