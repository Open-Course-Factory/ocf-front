/**
 * The sitemap and robots.txt in public/ are hand-written, so nothing stops
 * them from drifting away from the router. Two invariants keep them honest:
 * every sitemap URL is a route that exists and needs no login, and robots.txt
 * points crawlers at the sitemap.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import router from '../../src/router'

const publicDir = resolve(__dirname, '../../public')
const sitemap = readFileSync(resolve(publicDir, 'sitemap.xml'), 'utf8')
const robots = readFileSync(resolve(publicDir, 'robots.txt'), 'utf8')

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]))

describe('public/sitemap.xml', () => {
  it('lists at least the landing and pricing pages', () => {
    const paths = sitemapUrls.map(u => u.pathname)
    expect(paths).toContain('/')
    expect(paths).toContain('/pricing')
  })

  it.each(sitemapUrls.map(u => [u.pathname]))('%s is a declared route open without login', (path) => {
    const resolved = router.resolve(path)
    expect(resolved.matched.length, `${path} must match a declared route`).toBeGreaterThan(0)
    expect(resolved.meta.requiresAuth, `${path} must be reachable without login`).toBe(false)
  })

  it('uses one absolute origin for every URL', () => {
    const origins = new Set(sitemapUrls.map(u => u.origin))
    expect(origins.size).toBe(1)
  })
})

describe('public/robots.txt', () => {
  it('points crawlers at the sitemap on the same origin', () => {
    const [origin] = [...new Set(sitemapUrls.map(u => u.origin))]
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`)
  })
})
