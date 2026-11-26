// Prints the nginx variables of the desktop page's Content-Security-Policy
// (nginx.conf, location /unkernel-desktop/), from the built page: the hashes
// of its inline scripts and event handlers (the failure card's Reload button
// has onclick="location.reload()"), and the origin of the machines' image when
// it is not the front's own. Without the page (a build with no
// public/unkernel-desktop/) both are empty.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const page = 'dist/unkernel-desktop/index.html'
const html = existsSync(page) ? readFileSync(page, 'utf8') : ''
const hash = (js) => `'sha256-${createHash('sha256').update(js).digest('base64')}'`
const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(([, js]) => hash(js))
const handlers = [...new Set([...html.matchAll(/\son[a-z]+="([^"]*)"/g)].map(([, js]) => hash(js)))]
// 'unsafe-hashes' lets only the listed handlers run, not any inline handler.
const sources = [...scripts, ...(handlers.length ? ["'unsafe-hashes'", ...handlers] : [])]
const image = process.env.VITE_LOCAL_MACHINE_DISTRO_URL ?? ''
const origin = /^https?:\/\//.test(image) ? new URL(image).origin : ''

console.log(`set $desktop_script_hashes "${sources.join(' ')}";`)
console.log(`set $desktop_image_origin "${origin}";`)
