# Subscription Upgrade Debug Guide

## Issue
After calling the upgrade endpoint, an invoice is created but the subscription plan doesn't change in the UI.

## Steps to Debug

### 1. Check Browser Console
After attempting a plan change, check the browser console for these logs:
- `Upgrade response:` - What did the backend return?
- `Reloading subscription after upgrade...`
- `Updated subscription:` - Does this show the new plan?
- `Updated usage metrics:` - Do the limits reflect the new plan?

### 2. Check Backend Logs
Look for errors or warnings in the OCF Core backend logs related to:
- Stripe subscription update
- Database subscription update
- The `/api/v1/subscriptions/upgrade` endpoint

### 3. Verify Backend Implementation
The backend should:
1. ✅ Update the subscription in Stripe via `stripe.Subscription.modify()`
2. ✅ Update the subscription in the database with new `subscription_plan_id`
3. ✅ Return the updated subscription object with the new plan

### 4. Check Stripe Dashboard
Go to Stripe Dashboard → Subscriptions and verify:
- Was the subscription actually updated?
- Does it show the new plan/price?
- Was an invoice created for the proration?

## Potential Backend Issues

### Issue 1: Subscription Not Updated in Database
**Symptom:** Stripe shows the new plan, but API returns old plan

**Fix:** Ensure the backend updates the database after Stripe update:
```rust
// After successful Stripe update
subscription.subscription_plan_id = new_plan_id;
subscription.updated_at = Utc::now();
subscription.save(pool).await?;
```

### Issue 2: Stripe Subscription Not Updated
**Symptom:** Database might update but Stripe still shows old plan

**Fix:** Ensure the Stripe subscription is actually being modified:
```rust
let updated_stripe_sub = stripe_client
    .update_subscription(
        &subscription.stripe_subscription_id,
        UpdateSubscriptionParams {
            items: vec![UpdateSubscriptionItem {
                id: current_item_id,
                price: Some(new_stripe_price_id),
                ..Default::default()
            }],
            proration_behavior: Some(proration_behavior),
            ..Default::default()
        }
    )
    .await?;
```

### Issue 3: Returning Stale Data
**Symptom:** Backend returns success but with old subscription data

**Fix:** Ensure the endpoint returns the freshly updated subscription:
```rust
// Reload subscription from database after update
let updated_subscription = Subscription::get_by_id(pool, subscription_id).await?;
Ok(Json(updated_subscription))
```

## Quick Test Commands

### Check Current Subscription via API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/subscriptions/current
```

### Check if Plan Changed in Response
Look for `subscription_plan_id` or `plan_id` field in the response

### Force Refresh Frontend
After backend fix, hard refresh the browser (Ctrl+Shift+R) to ensure no caching

## Expected API Response

The `/subscriptions/upgrade` endpoint should return:
```json
{
  "id": "subscription-uuid",
  "user_id": "user-uuid",
  "subscription_plan_id": "NEW-PLAN-UUID",  // ← Should be updated
  "stripe_subscription_id": "sub_xxx",
  "status": "active",
  "current_period_start": "...",
  "current_period_end": "...",
  "plan": {
    "id": "NEW-PLAN-UUID",
    "name": "Solo",  // ← Should show new plan
    "price_amount": 1000,
    ...
  }
}
```

## Frontend Debugging

If backend is working correctly but UI still shows old plan, check:

1. **Cache issue**: Hard refresh (Ctrl+Shift+R)
2. **State not updating**: Check `currentSubscription.value` in console
3. **Component not re-rendering**: Check if plan comparison logic is correct

## Next Steps

1. Try the plan change again with console open
2. Share the console logs (especially the "Upgrade response" and "Updated subscription")
3. Check the backend logs for any errors
4. Verify in Stripe Dashboard if the subscription actually changed
