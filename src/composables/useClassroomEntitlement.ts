import { computed, onMounted } from 'vue'
import { usePermissionsStore } from '../stores/permissions'
import { useCurrentUserStore } from '../stores/currentUser'
import type { ClassroomDeniedReason } from '../types/user'

/**
 * Single owner of "may this user run classrooms?" (#298, #300).
 *
 * This used to read `group_management_enabled` off the personal subscription,
 * while `permissions.isFeatureInAnyOrg` read a union across organizations and the
 * router guard read the same union again — three derivations, three answers. A
 * trainer on a personal Trial who belonged to an org holding Formateur was
 * simultaneously refused the convert-to-team CTA, shown the groups menu, and
 * allowed to buy seats.
 *
 * The rule now has one owner and it is the backend (ocf-core#453). This composable
 * reads that verdict; it does not reconstruct it. In particular it must NOT test
 * the features list for "group_management": that list is a union answering
 * "available somewhere", which is the gray-out question — a different and more
 * permissive one.
 *
 * The backend answers TWO questions and the caller has to pick the right one —
 * see `canRunClassrooms` and `planAllowsClassrooms` below.
 */
export function useClassroomEntitlement() {
  const permissionsStore = usePermissionsStore()
  const currentUserStore = useCurrentUserStore()

  /**
   * "May this user run classes in the organization currently in context?"
   *
   * Role-aware, so a student in a school is refused even though they inherit a
   * plan that grants classrooms (ocf-core#460), and false by design inside a
   * personal organization, which holds no classes whatever plan its owner bought
   * (ocf-core#475).
   *
   * Absent verdict means not entitled, never "assume yes": an unresolved response
   * must not invite someone into a class the backend will then refuse.
   */
  const canRunClassrooms = computed(
    () => permissionsStore.effectiveFeatures?.can_run_classrooms === true
  )

  /**
   * "Does the plan this user holds allow teaching at all?" — no organization in
   * the question. This is `can_create_organization` from GET /auth/permissions,
   * which ocf-core computes with the very `CanRunClassrooms(userID, nil)` call
   * that the create-organization gate applies (core#476, alongside
   * `can_create_group` and convert-to-team #458), so a screen keyed on it cannot
   * offer what the endpoint behind it refuses.
   *
   * Deliberately NOT `canRunClassrooms` above. That one is scoped to the active
   * organization and is false inside a personal one by design, so asking it
   * whether a trainer may create their FIRST organization refuses every trainer
   * who does not have one yet — including the one who just bought Formateur.
   *
   * Deliberately NOT the org-less /users/me/features either, tempting as the name
   * is: that aggregate reads organization subscriptions only, never the caller's
   * personal one, and 404s for a user whose plan is personal — which is this
   * exact trainer. It would answer "unknown" precisely where the answer matters.
   *
   * Three states, and the third carries a product decision: null means no verdict
   * has been fetched. Reading that as "no" turns a slow request into an upgrade
   * pitch shown to someone who already paid. Callers therefore keep offering the
   * ordinary action while it is null and let the backend refuse — the refusal is
   * handled and explains itself (see Organizations.vue).
   */
  const planAllowsClassrooms = computed<boolean | null>(
    () => currentUserStore.canCreateOrganization
  )

  /**
   * Why not, for screens that can say something more useful than "upgrade".
   * Telling someone to buy their way past a role check is worse than silence.
   */
  const deniedReason = computed<ClassroomDeniedReason | null>(
    () => permissionsStore.effectiveFeatures?.classroom_denied_reason ?? null
  )

  /** True when buying a better plan would actually change the answer. */
  const deniedByPlan = computed(
    () => deniedReason.value === 'no_plan' || deniedReason.value === 'plan_lacks_group_management'
  )

  onMounted(() => {
    // Neither request may take the mounting screen down with it: a verdict that
    // does not arrive stays unresolved, and unresolved has a defined meaning on
    // every screen that reads one.
    permissionsStore.ensureEffectiveFeaturesLoaded().catch(() => {})
    currentUserStore.ensurePermissionsLoaded().catch(() => {})
  })

  return { canRunClassrooms, planAllowsClassrooms, deniedReason, deniedByPlan }
}
