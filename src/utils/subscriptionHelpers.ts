/**
 * Subscription-classification helpers.
 *
 * Keep this file free of Vue-specific imports so any component or store can
 * consume it — callers keep their own `computed` wrappers around these pure
 * predicates.
 */

/**
 * Minimal structural shape consumed by `isAssignedSubscription`. Both the full
 * `Subscription` type (from `../types/subscription`) and the looser object
 * shapes some call sites carry satisfy it — we only read the two fields the
 * assigned/managed-by-org rule depends on.
 */
interface AssignableSubscriptionLike {
  subscription_type?: string | null
  subscription_batch_id?: string | null
}

/**
 * Single source of truth for "is this an assigned (organization-managed)
 * subscription?".
 *
 * A subscription is assigned when either it is explicitly stamped
 * `subscription_type === 'assigned'` OR it carries a `subscription_batch_id`
 * (assigned via a bulk-license batch, even if `subscription_type` was never
 * stamped). Both halves matter: a batch-assigned learner without an explicit
 * type must still be treated as managed-by-org, or they see a self-service
 * purchase page they cannot use (issue #266).
 */
export function isAssignedSubscription(sub?: AssignableSubscriptionLike | null): boolean {
  return sub?.subscription_type === 'assigned' || !!sub?.subscription_batch_id
}
