// Exits 0 when this pipeline's change is only a release version bump, so CI
// can skip re-testing code that is identical to what already passed. Any doubt
// (unknown base, missing history, any other file or field) exits 1: run tests.
//
// A version bump touches VERSION, package.json's "version" and the two root
// "version" fields of package-lock.json — nothing else.
import { execFileSync } from 'node:child_process'

const BUMP_FILES = new Set(['VERSION', 'package.json', 'package-lock.json'])
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })

function withoutVersion(file, text) {
  const json = JSON.parse(text)
  delete json.version
  if (file === 'package-lock.json') delete json.packages?.['']?.version
  return JSON.stringify(json)
}

function isVersionOnly(base) {
  if (!base || /^0+$/.test(base)) return false
  const changed = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean)
  if (changed.length === 0 || !changed.every(f => BUMP_FILES.has(f))) return false
  return changed
    .filter(f => f !== 'VERSION')
    .every(f => withoutVersion(f, git('show', `${base}:${f}`)) === withoutVersion(f, git('show', `HEAD:${f}`)))
}

// MR pipelines diff against the target branch; branch pushes against the push's previous tip.
const base = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA || process.env.CI_COMMIT_BEFORE_SHA
let skip = false
try {
  skip = isVersionOnly(base)
} catch {
  skip = false // base outside the shallow clone, unparsable JSON, ...: test
}
console.log(skip ? `Version-only change since ${base}: skipping.` : 'Not a version-only change: running.')
process.exit(skip ? 0 : 1)
