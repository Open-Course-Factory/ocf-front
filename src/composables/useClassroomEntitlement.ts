import { computed, onMounted } from 'vue'
import { usePermissionsStore } from '../stores/permissions'
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
 * The verdict is also role-aware when the backend has an organization context, so
 * a student in a school is refused even though they inherit a plan that grants
 * classrooms (ocf-core#460).
 */
export function useClassroomEntitlement() {
  const permissionsStore = usePermissionsStore()

  // Absent verdict means not entitled, never "assume yes". An unresolved
  // response must not invite someone into an organization the backend will then
  // leave without classroom features.
  const canRunClassrooms = computed(
    () => permissionsStore.effectiveFeatures?.can_run_classrooms === true
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

  onMounted(async () => {
    if (!permissionsStore.effectiveFeatures) {
      await permissionsStore.loadEffectiveFeatures()
    }
  })

  return { canRunClassrooms, deniedReason, deniedByPlan }
}
