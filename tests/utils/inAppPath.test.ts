/**
 * Pages that take a destination from the query string (login `redirect`,
 * demo `return_url`, verify-email `redirect`, session view `returnTo`) must
 * only follow a path inside this app. `inAppPath` returns the value when it
 * resolves to this origin, and `null` otherwise so callers use their default.
 */

import { describe, it, expect } from 'vitest'
import { inAppPath } from '../../src/utils/inAppPath'

describe('inAppPath', () => {
  it.each([
    '/terminal-sessions',
    '/courses?x=1#h',
    '/a/b',
    '/scenario-editor?scenarioId=abc',
    '/a/../courses',
    '/./courses'
  ])('keeps the in-app path %j unchanged', (path) => {
    expect(inAppPath(path)).toBe(path)
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['a number', 42],
    ['an array of strings', ['/courses']],
    ['an object', { path: '/courses' }]
  ])('returns null for %s', (_label, value) => {
    expect(inAppPath(value)).toBeNull()
  })

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,x',
    'https://example.com',
    'http://example.com/courses',
    '//example.com',
    '//example.com/courses',
    '/\\example.com',
    '\\\\example.com',
    '\\/example.com',
    '/\t/example.com',
    '/\n/example.com',
    ' //example.com',
    'courses',
    './courses',
    '../courses',
    '?redirect=/courses',
    '#/courses',
    '/.//example.com',
    '/..//example.com',
    '/%2e//example.com',
    '/%2E%2E//example.com',
    '/a/..//example.com',
    '/a/b/../..//example.com',
    '/.///example.com'
  ])('returns null for %j, which is not an in-app path', (value) => {
    expect(inAppPath(value)).toBeNull()
  })
})
