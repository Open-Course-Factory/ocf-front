/**
 * Returns `raw` when it is a path inside this app, otherwise `null`.
 *
 * Pages that take a destination from the query string (login `redirect`,
 * demo `return_url`, verify-email `redirect`, session view `returnTo`) only
 * follow same-origin paths, so a query parameter can never send the browser
 * elsewhere. Backslashes, whitespace and control characters are refused
 * outright: browsers normalise them in ways that can turn `/\host` or
 * `/\t/host` into `//host`. The original string is returned untouched.
 */
export function inAppPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null
  // eslint-disable-next-line no-control-regex
  if (/[\\\s\u0000-\u001f\u007f]/.test(raw)) return null
  try {
    const url = new URL(raw, window.location.origin)
    return url.origin === window.location.origin ? raw : null
  } catch {
    return null
  }
}
