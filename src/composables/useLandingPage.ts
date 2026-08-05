/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { useUserSettingsStore } from '../stores/userSettings'
import { useTeacherGroupsStore } from '../stores/teacherGroups'
import { useOrganizationsStore } from '../stores/organizations'

// Where a user with no classes and no preference lands.
export const DEFAULT_LANDING_PAGE = '/terminal-sessions'

// Where a teacher lands instead: the console is their home (issue #309).
export const TEACHER_LANDING_PAGE = '/my-classes'

/**
 * The single answer to "where does this user land". Both the post-login
 * redirect and the home button in the top bar go through here, so the two can
 * never disagree about what home means.
 *
 * Order of authority:
 *   1. an explicit `default_landing_page` the user chose, if it is still on
 *      offer (a page whose feature flag is now off must not be honoured);
 *   2. the teaching console, for a user who teaches in the ACTIVE organization;
 *   3. terminal sessions.
 *
 * The teacher check reads the same `GET /teacher/groups` the console renders,
 * through the store cache — so landing on the console costs one request, not
 * two, and a user with no classes is never sent to a page that would greet them
 * with an empty state.
 *
 * Step 2 is organization-scoped for the same reason the console is: landing on
 * a console that shows nothing, because the classes are in an organization the
 * user is not currently in, is exactly the empty page this check exists to
 * avoid. So the organizations must be loaded before the question can be asked.
 *
 * Callers must have loaded the user settings first (both current ones already
 * do); this function only reads them.
 */
export async function resolveLandingPage(): Promise<string> {
  const settingsStore = useUserSettingsStore()
  const offeredPages = settingsStore.availablePages.map((page: { value: string }) => page.value)

  const chosenPage = settingsStore.settings.default_landing_page
  if (chosenPage && offeredPages.includes(chosenPage)) {
    return chosenPage
  }

  if (offeredPages.includes(TEACHER_LANDING_PAGE) && await teachesInActiveOrganization()) {
    return TEACHER_LANDING_PAGE
  }

  return DEFAULT_LANDING_PAGE
}

// A failed probe answers "no classes here": the login redirect must never hang
// on, or fail because of, data the user may not even need.
async function teachesInActiveOrganization(): Promise<boolean> {
  const organizationsStore = useOrganizationsStore()
  // Straight after login nothing has loaded the organizations yet, and without
  // them there is no active organization to scope against — which would read as
  // "teaches nowhere" and send every teacher to the wrong page.
  if (!organizationsStore.currentOrganization) {
    try {
      await organizationsStore.loadOrganizations()
    } catch {
      return false
    }
  }

  const teacherGroupsStore = useTeacherGroupsStore()
  await teacherGroupsStore.ensureLoaded()
  return teacherGroupsStore.managesClassInCurrentOrganization
}
