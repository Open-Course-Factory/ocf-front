/**
 * The eight-tab class page became five real pages, so every link a teacher
 * already has — a bookmark, a browser-history entry, a URL pasted in a chat —
 * points at a page that no longer exists.
 *
 * Contract pinned here: each retired `?tab=` value lands on the page its content
 * moved to, carrying what the link was asking for, and nothing dead-ends.
 */

import { describe, it, expect } from 'vitest'
import { classPageForRetiredTab } from '../../src/router/classPages'

function redirectFor(query: Record<string, string> = {}) {
  return classPageForRetiredTab('g-1', query) as {
    name: string
    params: { id: string }
    query: Record<string, string>
  }
}

describe('old class links — where each retired tab goes', () => {
  it.each([
    ['overview', 'ClassSettings'],
    ['members', 'ClassMembers'],
    ['scenarios', 'ClassScenarios'],
    ['live', 'ClassLive'],
    ['activity', 'ClassLive'],
    ['analytics', 'ClassAnalytics'],
    ['history', 'ClassAnalytics'],
    ['settings', 'ClassSettings'],
  ])('sends ?tab=%s to the %s page', (tab, expectedRoute) => {
    expect(redirectFor({ tab }).name).toBe(expectedRoute)
  })

  it('keeps the class it was opened for', () => {
    expect(redirectFor({ tab: 'members' }).params).toEqual({ id: 'g-1' })
  })
})

describe('old class links — values that mean nothing', () => {
  it('opens the live page for a link with no tab at all', () => {
    expect(redirectFor().name).toBe('ClassLive')
  })

  it('opens the live page rather than dead-ending on an unknown tab', () => {
    expect(redirectFor({ tab: 'bogus' }).name).toBe('ClassLive')
  })

  it('opens the live page for an empty tab value', () => {
    expect(redirectFor({ tab: '' }).name).toBe('ClassLive')
  })

  it('ignores a repeated tab parameter instead of guessing which one was meant', () => {
    const redirect = classPageForRetiredTab('g-1', { tab: ['members', 'settings'] }) as {
      name: string
    }
    expect(redirect.name).toBe('ClassLive')
  })
})

describe('old class links — what they carry over', () => {
  it('still asks for the wall when the link asked for the wall', () => {
    expect(redirectFor({ tab: 'live', view: 'wall' }).query).toEqual({ view: 'wall' })
  })

  it('asks for the wall through the retired activity key too', () => {
    expect(redirectFor({ tab: 'activity', view: 'wall' }).query).toEqual({ view: 'wall' })
  })

  it('opens the command replay section for a link to the history tab', () => {
    expect(redirectFor({ tab: 'history' }).query).toEqual({ section: 'history' })
  })

  it('does not carry a view onto a page that has no representations', () => {
    expect(redirectFor({ tab: 'members', view: 'wall' }).query).toEqual({})
  })

  it('leaves a plain class link with a clean URL', () => {
    expect(redirectFor({ tab: 'analytics' }).query).toEqual({})
  })
})
