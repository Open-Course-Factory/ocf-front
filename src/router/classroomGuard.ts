import type { UserEffectiveFeatures } from '../types/user'

/**
 * Where a classroom route sends a user the backend refuses: "Mes classes", the
 * console, which shows the way out (create an organization, or upgrade).
 * `null` lets the navigation through.
 *
 * The routes carrying `requiresClassroomEntitlement` were declared for a guard
 * nobody wrote, so a URL walked straight past the locked sidebar entry. The rule
 * is the backend's `can_run_classrooms` verdict for the current context, the
 * same value the sidebar and useClassroomEntitlement read; nothing is derived
 * from the features list here.
 *
 * Only an explicit refusal redirects. With no verdict at all (the request
 * failed, or there is no plan to answer with) the page is allowed to load and
 * the backend's own refusal stands: bouncing a teacher whose features are still
 * on their way is worse than the refusal they would see on the page.
 */
export function classroomRefusalRedirect(
  features: UserEffectiveFeatures | null | undefined
): { name: string } | null {
  if (features && features.can_run_classrooms !== true) {
    return { name: 'MyClasses' }
  }
  return null
}
