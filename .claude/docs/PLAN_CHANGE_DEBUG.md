# Plan Change Not Showing - Debug Guide

## The Backend is Working ✅

Your backend webhook shows:
```
🔄 Plan change detected: Trial -> Solo
✅ Updated usage limits
```

The backend is 100% correct. The issue is purely frontend.

---

## Step-by-Step Debugging

### 1. Open Browser Console

Before changing the plan, open the browser developer console (F12).

### 2. Change Your Plan

Try changing from Trial to Solo plan.

### 3. Check Console Logs

You should see these logs in order:

```javascript
// From upgradePlan in subscriptions.ts
"Upgrade response:" { /* response from /api/v1/subscriptions/upgrade */ }

// After 1 second delay
"Reloading subscription after upgrade..."

// After getCurrentSubscription()
"Updated subscription:" {
  id: "...",
  subscription_plan_id: "0199ba59-a771-7e30-b46d-be461cd41a8b",  // ← Should be Solo ID
  plan_name: "???",  // ← What does this show?
  status: "active",
  ...
}

// After getUsageMetrics()
"Updated usage metrics:" [ /* usage limits */ ]

// From SubscriptionCard.vue
"[SubscriptionCard] Looking up plan:" {
  planId: "0199ba59-a771-7e30-b46d-be461cd41a8b",  // ← Should be Solo ID
  subscription: { /* full subscription */ },
  availablePlans: [
    { id: "...", name: "Trial" },
    { id: "0199ba59-a771-7e30-b46d-be461cd41a8b", name: "Solo" },  // ← Should see Solo
    { id: "...", name: "Team" },
    ...
  ]
}

"[SubscriptionCard] Found plan:" {
  id: "0199ba59-a771-7e30-b46d-be461cd41a8b",
  name: "Solo",  // ← Should find Solo
  ...
}
```

---

## What to Look For

### ✅ GOOD - Backend Returned New Plan ID

```javascript
"Updated subscription:" {
  subscription_plan_id: "0199ba59-a771-7e30-b46d-be461cd41a8b"  // Solo UUID
}
```

If you see the **new Solo UUID**, the backend API is working.

---

### ❌ BAD - Frontend Still Showing Old Plan

**Case 1: `plan_name` field is cached**

```javascript
"Updated subscription:" {
  subscription_plan_id: "0199ba59-a771-7e30-b46d-be461cd41a8b",  // ✅ Solo ID (NEW)
  plan_name: "Trial"  // ❌ Still showing Trial (OLD)
}
```

**Problem:** Backend is returning a denormalized `plan_name` field that's stale.

**Solution:** Backend should remove `plan_name` from the API response, OR frontend should ignore it.

---

**Case 2: Plan lookup is failing**

```javascript
"[SubscriptionCard] Looking up plan:" {
  planId: "0199ba59-a771-7e30-b46d-be461cd41a8b",  // ✅ Correct Solo ID
  availablePlans: []  // ❌ EMPTY - plans not loaded!
}

"[SubscriptionCard] Found plan:" null  // ❌ Not found!
```

**Problem:** Subscription plans store is empty or not loaded.

**Solution:** Ensure plans are loaded before showing the subscription card.

---

**Case 3: UUID mismatch**

```javascript
"[SubscriptionCard] Looking up plan:" {
  planId: "0199ba59-a771-7e30-b46d-be461cd41a8b",  // Solo ID from subscription
  availablePlans: [
    { id: "0199ba59a7717e30b46dbe461cd41a8b", name: "Solo" }  // ← Missing hyphens!
  ]
}
```

**Problem:** UUID format mismatch (with/without hyphens).

**Solution:** Normalize UUIDs to the same format.

---

## Quick Fixes to Try

### Fix 1: Hard Refresh

After plan change, do a **hard refresh** in the browser:
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`
- Safari: `Cmd + Shift + R`

This clears the browser cache.

---

### Fix 2: Check API Response Directly

Open Network tab, find the request to `/api/v1/subscriptions/current`, and check the response:

**What you should see:**
```json
{
  "id": "...",
  "subscription_plan_id": "0199ba59-a771-7e30-b46d-be461cd41a8b",
  "status": "active",
  "plan_name": "Solo"  // ← Should be Solo now
}
```

**If `plan_name` is still "Trial":** Backend is caching or not updating this field.

---

### Fix 3: Clear LocalStorage

The frontend might cache subscription data in localStorage.

In the browser console, run:
```javascript
localStorage.clear()
location.reload()
```

---

## Root Cause Analysis

Based on the backend logs showing the plan DID change, there are only 3 possible issues:

### 1. Backend API Response Has Stale `plan_name`

The backend updates `subscription_plan_id` but forgets to update `plan_name` in the response.

**Check backend code:** Where does `plan_name` come from in the subscription response?

---

### 2. Frontend Caches Old Plan Name

The frontend reads `subscription.plan_name` instead of looking it up from the plans store.

**Already fixed** in SubscriptionCard.vue - it now prioritizes the store lookup.

---

### 3. Frontend Doesn't Refresh After Webhook

If the plan change happens via Stripe webhook AFTER the frontend finishes the upgrade call, the frontend won't know about it.

**Solution:** Add a polling mechanism or WebSocket to detect webhook updates.

---

## Test This Immediately

Run this in the browser console AFTER changing the plan:

```javascript
// Check the current subscription in the store
const subStore = window.$pinia.state.value.subscriptions
console.log('Store subscription:', subStore.currentSubscription)

// Check the subscription plans store
const plansStore = window.$pinia.state.value.subscriptionPlans
console.log('Available plans:', plansStore.entities)

// Force reload subscription
await fetch('/api/v1/subscriptions/current', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
  .then(r => r.json())
  .then(data => console.log('Fresh subscription from API:', data))
```

**Share the output of this console log!**

---

## Expected Behavior

After a successful plan change:

1. **Immediate:** API returns new `subscription_plan_id`
2. **Immediate:** Frontend reloads subscription (already implemented)
3. **Immediate:** SubscriptionCard looks up plan by new ID
4. **Immediate:** UI shows "Solo" plan name

If any step fails, the UI will show the wrong plan.

---

## Next Steps

1. Try changing the plan again
2. Copy ALL console logs and share them
3. Check the Network tab for `/api/v1/subscriptions/current` response
4. Share the `plan_name` and `subscription_plan_id` from the API response

This will pinpoint exactly where the issue is!
