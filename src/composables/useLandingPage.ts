/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */

import { useUserSettingsStore } from '../stores/userSettings'
import { useTeacherGroupsStore } from '../stores/teacherGroups'

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
 *   2. the teaching console, for a user who owns or manages at least one class;
 *   3. terminal sessions.
 *
 * The teacher check reads the same `GET /teacher/groups` the console renders,
 * through the store cache — so landing on the console costs one request, not
 * two, and a user with no classes is never sent to a page that would greet them
 * with an empty state.
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

  if (offeredPages.includes(TEACHER_LANDING_PAGE) && await managesAnyClass()) {
    return TEACHER_LANDING_PAGE
  }

  return DEFAULT_LANDING_PAGE
}

// A failed probe answers "no classes": the login redirect must never hang on,
// or fail because of, an aggregate the user may not even need.
async function managesAnyClass(): Promise<boolean> {
  const teacherGroupsStore = useTeacherGroupsStore()
  await teacherGroupsStore.ensureLoaded()
  return teacherGroupsStore.managesAnyClass
}
