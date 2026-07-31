import { computed, onMounted } from 'vue'
import { useSubscriptionsStore } from '../stores/subscriptions'

/**
 * Single owner of "may this user run classrooms?" (#298).
 *
 * Two places invite a user toward team organizations — the organizations list
 * and the convert-to-team banner on the subscription dashboard — and neither
 * checked whether the user's plan actually grants group management. That is how
 * a trainer ends up with an organization that ignores the plan they just bought.
 *
 * The predicate lives here rather than in each component because it is one rule.
 * Written twice it drifts the moment a plan flag changes, which is the recurring
 * failure in this codebase: the same gate expressed in the UI and the backend,
 * diverging silently.
 *
 * `group_management_enabled` is true only for Formateur and École / OF, so the
 * plan flag already encodes the rule — this just reads it in one place.
 */
export function useClassroomEntitlement() {
  const subscriptionsStore = useSubscriptionsStore()

  // Absent plan means not entitled, never "assume yes". An unresolved
  // subscription must not invite someone into an organization the backend will
  // leave without classroom features.
  const canRunClassrooms = computed(
    () => subscriptionsStore.currentSubscription?.subscription_plan?.group_management_enabled === true
  )

  onMounted(async () => {
    if (!subscriptionsStore.currentSubscription) {
      await subscriptionsStore.getCurrentSubscription()
    }
  })

  return { canRunClassrooms }
}
