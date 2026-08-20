/*
 * Global test setup.
 *
 * Components mounted by a test stay mounted unless the test unmounts them, and
 * a mounted component keeps whatever it started running. `useVisiblePolling`
 * (the class console, the progression view) installs a 30s interval on mount
 * and clears it on unmount, so a wrapper left behind keeps polling: into later
 * tests, where it inflates their call counts, and past the file's teardown,
 * where `document` no longer exists and the callback throws an uncaught
 * "document is not defined". Both were seen in CI — a suite could report every
 * test passing and still exit non-zero on the unhandled errors.
 *
 * Auto-unmounting after every test removes the whole class of failure at the
 * source, rather than asking each test to remember.
 */
import { afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

enableAutoUnmount(afterEach)
