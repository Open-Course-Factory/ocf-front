/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

/**
 * Bounded polling helper.
 *
 * Repeatedly invokes `getter` until `predicate(value)` returns true or the
 * maximum number of attempts is reached. The first call is made immediately
 * (no initial delay). Between attempts the helper waits `intervalMs` ms.
 *
 * Typical use case: waiting for an eventually-consistent backend state to
 * catch up after an action (e.g. Stripe webhook syncing a plan change).
 *
 * @param getter    Async function returning the value to inspect. Called
 *                  with no arguments; any thrown error is propagated.
 * @param predicate Returns true when the desired condition is met.
 * @param opts      `intervalMs` (default 500) and `maxAttempts` (default 20)
 *                  — default budget is ~10 seconds.
 * @returns         `{ matched: true, value }` on success, or
 *                  `{ matched: false, value }` with the LAST getter result
 *                  on timeout.
 */
export async function pollUntil<T>(
  getter: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<{ matched: boolean; value: T }> {
  const intervalMs = opts.intervalMs ?? 500
  const maxAttempts = opts.maxAttempts ?? 20

  let lastValue: T = undefined as unknown as T

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, intervalMs))
    }

    // Errors from getter propagate out — we do NOT swallow them.
    lastValue = await getter()

    if (predicate(lastValue)) {
      return { matched: true, value: lastValue }
    }
  }

  return { matched: false, value: lastValue }
}
