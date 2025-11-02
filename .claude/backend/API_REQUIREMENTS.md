# Backend API Requirements

**Last Updated:** 2025-11-02
**Purpose:** Consolidated backend API requirements and integration guides
**Priority:** See priority markers (🔴 HIGH, 🟡 MEDIUM, 🟢 LOW)

---

## Table of Contents

1. [Terminal Filtering by Group](#1-terminal-filtering-by-group) 🔴 HIGH
2. [Bulk License Management](#2-bulk-license-management) 🔴 HIGH
3. [Organization Import API](#3-organization-import-api) 🟡 MEDIUM
4. [Groups API Enhancements](#4-groups-api-enhancements) 🟢 LOW
5. [UX Enhancement APIs](#5-ux-enhancement-apis) 🟡 MEDIUM
6. [Testing & Validation](#6-testing--validation)

---

## 1. Terminal Filtering by Group

**Priority:** 🔴 HIGH
**Status:** ⚠️ Frontend implemented, waiting for backend
**Estimated Time:** 30-60 minutes

### Problem

Users cannot filter their terminal sessions by group. The frontend has a group filter dropdown that currently doesn't work because the backend doesn't support the `group_id` query parameter.

### Solution

Add `group_id` query parameter to existing `GET /terminals/user-sessions` endpoint.

### API Specification

#### Endpoint
```
GET /api/v1/terminals/user-sessions?group_id={groupId}&include_hidden={boolean}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group_id` | UUID | No | Filter terminals shared with this group |
| `include_hidden` | boolean | No | Include hidden terminals (already exists) |

#### Behavior

- **Without `group_id`:** Return all user's terminals (current behavior, no change)
- **With `group_id`:** Return only terminals shared with the specified group

#### Security Requirements

⚠️ **CRITICAL:** Verify the requesting user is a member of the group before returning results.

- If user is NOT a member → return `403 Forbidden`
- If group doesn't exist → return `404 Not Found`
- If `group_id` is invalid UUID → return `400 Bad Request`

### Implementation Guide

#### Step 1: Update Endpoint Handler

```python
@app.route('/api/v1/terminals/user-sessions', methods=['GET'])
@require_auth
def get_user_sessions():
    user_id = get_current_user_id()
    include_hidden = request.args.get('include_hidden', 'false').lower() == 'true'
    group_id = request.args.get('group_id')  # NEW PARAMETER

    # Build base query
    query = db.session.query(Terminal).filter(
        Terminal.user_id == user_id
    )

    # Apply hidden filter (existing logic)
    if not include_hidden:
        query = query.filter(Terminal.is_hidden == False)

    # NEW: Apply group filter if provided
    if group_id:
        # Verify user is a member of the group (security check)
        is_member = db.session.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first() is not None

        if not is_member:
            return jsonify({'error': 'You are not a member of this group'}), 403

        # Filter terminals shared with this group
        query = query.join(
            TerminalShare,
            Terminal.id == TerminalShare.terminal_id
        ).filter(
            TerminalShare.share_type == 'group',
            TerminalShare.shared_with_group_id == group_id,
            TerminalShare.is_active == True
        )

    terminals = query.all()
    return jsonify([terminal.to_dict() for terminal in terminals])
```

#### Step 2: SQL Query (Direct SQL)

```sql
-- Without group filter (current behavior)
SELECT t.*
FROM terminals t
WHERE t.user_id = $user_id
  AND (t.is_hidden = false OR $include_hidden = true);

-- With group filter (NEW)
SELECT DISTINCT t.*
FROM terminals t
INNER JOIN terminal_shares ts ON t.id = ts.terminal_id
WHERE t.user_id = $user_id
  AND ts.share_type = 'group'
  AND ts.shared_with_group_id = $group_id
  AND ts.is_active = true
  AND (t.is_hidden = false OR $include_hidden = true);
```

### Database Schema

Assumes these tables exist:

```sql
-- Terminals table
terminals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id VARCHAR,
  status VARCHAR,
  name VARCHAR,
  instance_type VARCHAR,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_hidden BOOLEAN DEFAULT FALSE
)

-- Terminal shares table
terminal_shares (
  id UUID PRIMARY KEY,
  terminal_id UUID REFERENCES terminals(id),
  share_type VARCHAR, -- 'user' or 'group'
  shared_with_user_id UUID,
  shared_with_group_id UUID,
  shared_by_user_id UUID,
  access_level VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
)

-- Group members table (for validation)
class_group_members (
  id UUID PRIMARY KEY,
  group_id UUID,
  user_id UUID,
  role VARCHAR
)
```

### Performance Considerations

#### Required Indexes

```sql
-- For group membership lookups
CREATE INDEX IF NOT EXISTS idx_group_members_user_group
ON class_group_members(user_id, group_id);

-- For terminal share lookups
CREATE INDEX IF NOT EXISTS idx_terminal_shares_group_terminal
ON terminal_shares(terminal_id, shared_with_group_id, share_type, is_active);
```

### Testing

#### Manual Test

```bash
# 1. Get auth token
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Create a test group
GROUP_ID=$(curl -X POST http://localhost:8080/api/v1/class-groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-group","display_name":"Test Group"}' \
  | jq -r '.id')

# 3. Create a terminal
TERMINAL_ID=$(curl -X POST http://localhost:8080/api/v1/terminals/start-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terms":"I accept","instance_type":"debian"}' \
  | jq -r '.id')

# 4. Share terminal with group
curl -X POST http://localhost:8080/api/v1/terminals/$TERMINAL_ID/share \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shared_with_group_id\":\"$GROUP_ID\",\"access_level\":\"read\"}"

# 5. Test filtering (should include the terminal)
curl -X GET "http://localhost:8080/api/v1/terminals/user-sessions?group_id=$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN"

# 6. Test with non-member group (should return 403)
curl -X GET "http://localhost:8080/api/v1/terminals/user-sessions?group_id=00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

### Edge Cases

1. **Invalid Group ID**
   ```python
   if group_id and not is_valid_uuid(group_id):
       return jsonify({'error': 'Invalid group_id format'}), 400
   ```

2. **Non-Existent Group**
   ```python
   group_exists = db.session.query(ClassGroup).filter(ClassGroup.id == group_id).first()
   if group_id and not group_exists:
       return jsonify({'error': 'Group not found'}), 404
   ```

3. **Inactive Shares**
   Only include terminals with `is_active=true` shares (already in example code).

4. **Multiple Shares**
   Use `DISTINCT` in SQL or `.distinct()` in ORM to avoid duplicate terminals.

### Frontend Integration

**No frontend changes needed!** The frontend is already implemented and waiting:

- **File:** `src/components/Pages/TerminalMySessions.vue`
- **Lines:** 41-55 (UI), 590 (state), 669-693 (filtering logic), 778 (API call)

Once deployed, the feature will work automatically.

### Success Criteria

- [ ] Backend accepts `group_id` query parameter
- [ ] Returns only terminals shared with specified group
- [ ] Security check prevents non-members from filtering
- [ ] Existing behavior preserved when parameter not provided
- [ ] Frontend dropdown filters terminals correctly
- [ ] All unit tests pass
- [ ] Manual testing confirms filtering works
- [ ] Documentation updated

---

## 2. Bulk License Management

**Priority:** 🔴 HIGH
**Status:** ✅ Frontend complete, backend requirements documented

### Overview

The bulk license system allows organizations to purchase multiple subscription licenses at once with volume discounts, then assign them to team members.

### 2.1 Bulk License Requirements (Simplified)

#### Current Frontend Behavior

The frontend shows bulk purchase options for any plan where:

```javascript
plan.use_tiered_pricing === true && plan.is_active === true
```

**No `bulk_purchase` feature flag is required!** The system uses only `use_tiered_pricing`.

#### Database Schema

```sql
subscription_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_amount INTEGER,
    billing_interval VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'EUR',
    use_tiered_pricing BOOLEAN DEFAULT FALSE,  -- Key field!
    pricing_tiers JSONB,  -- Array of tier objects
    is_active BOOLEAN DEFAULT TRUE,
    ...
)
```

#### Pricing Tiers Format

```json
{
  "pricing_tiers": [
    {"min_quantity": 1, "max_quantity": 5, "unit_amount": 1200, "description": "1-5 licenses"},
    {"min_quantity": 6, "max_quantity": 15, "unit_amount": 1000, "description": "6-15 licenses"},
    {"min_quantity": 16, "max_quantity": 0, "unit_amount": 800, "description": "16+ licenses"}
  ]
}
```

**Note:** `max_quantity: 0` means unlimited/no upper limit.

#### Validation

```python
def validate_tiered_pricing(plan_data: dict):
    if plan_data.get('use_tiered_pricing'):
        pricing_tiers = plan_data.get('pricing_tiers', [])

        if not pricing_tiers:
            raise ValidationError(
                "Plans with tiered pricing must have at least one pricing tier"
            )

        for tier in pricing_tiers:
            if not all(k in tier for k in ['min_quantity', 'max_quantity', 'unit_amount']):
                raise ValidationError(
                    "Each tier must have min_quantity, max_quantity, and unit_amount"
                )

            if tier['min_quantity'] < 1:
                raise ValidationError("min_quantity must be at least 1")

            if tier['max_quantity'] < 0:
                raise ValidationError("max_quantity must be 0 (unlimited) or positive")
```

### 2.2 Bulk Checkout Session API

#### Endpoint

```
POST /api/v1/subscription-batches/create-checkout-session
```

**Note:** The `/api/v1/` prefix is automatically added by axios interceptors in the frontend.

#### Authentication

- Requires JWT token in `Authorization: Bearer <token>` header
- User ID extracted from JWT token

#### Request Body

```typescript
{
  subscription_plan_id: string    // UUID of subscription plan (REQUIRED)
  quantity: number                // Number of licenses (REQUIRED, min: 1)
  success_url: string             // Redirect after success (REQUIRED)
  cancel_url: string              // Redirect if cancelled (REQUIRED)
  group_id?: string               // Optional: Link batch to group
  coupon_code?: string            // Optional: Promo code
}
```

#### Response

```typescript
{
  session_id: string              // Stripe checkout session ID
  url: string                     // Stripe checkout URL to redirect to
}
```

#### Example Request/Response

```json
// REQUEST
POST /api/v1/subscription-batches/create-checkout-session
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "subscription_plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 50,
  "success_url": "https://app.example.com/license-management?success=true",
  "cancel_url": "https://app.example.com/bulk-license-purchase",
  "group_id": "660e8400-e29b-41d4-a716-446655440000",
  "coupon_code": "SAVE20"
}

// RESPONSE (200 OK)
{
  "session_id": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

#### Error Responses

```json
// 400 Bad Request
{"error_code": 400, "error_message": "Invalid input: quantity must be at least 1"}

// 404 Not Found
{"error_code": 404, "error_message": "Subscription plan not found"}

// 500 Internal Server Error
{"error_code": 500, "error_message": "Failed to create checkout session"}
```

### 2.3 Stripe Integration

#### Checkout Session Creation

```javascript
stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: user.stripe_customer_id,
  line_items: [{
    price: plan.stripe_price_id,
    quantity: input.quantity  // Important: set quantity here!
  }],
  subscription_data: {
    metadata: {
      purchaser_user_id: user.id,
      subscription_plan_id: input.subscription_plan_id,
      is_bulk_purchase: 'true',        // Flag for webhook handling
      quantity: input.quantity.toString(),
      group_id: input.group_id || ''
    }
  },
  success_url: input.success_url,
  cancel_url: input.cancel_url,
  discounts: input.coupon_code ? [{ coupon: input.coupon_code }] : undefined
})
```

#### Webhook Handling

When Stripe sends `checkout.session.completed` webhook:

```javascript
if (subscription.metadata.is_bulk_purchase === 'true') {
  const quantity = parseInt(subscription.metadata.quantity)

  // 1. Create SubscriptionBatch record
  const batch = {
    id: uuid(),
    purchaser_user_id: subscription.metadata.purchaser_user_id,
    subscription_plan_id: subscription.metadata.subscription_plan_id,
    group_id: subscription.metadata.group_id || null,
    stripe_subscription_id: subscription.id,
    stripe_subscription_item_id: subscription.items.data[0].id,
    total_quantity: quantity,
    assigned_quantity: 0,
    available_quantity: quantity,
    status: 'active',
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    created_at: now(),
    updated_at: now()
  }

  // 2. Create N unassigned UserSubscription (license) records
  for (let i = 0; i < quantity; i++) {
    createUserSubscription({
      subscription_batch_id: batch.id,
      subscription_plan_id: batch.subscription_plan_id,
      status: 'unassigned',  // Not assigned to any user yet
      // ... other fields
    })
  }
}
```

### 2.4 Database Schema

```sql
-- SubscriptionBatch table
CREATE TABLE subscription_batches (
  id UUID PRIMARY KEY,
  purchaser_user_id UUID NOT NULL REFERENCES users(id),
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  group_id UUID REFERENCES class_groups(id),
  stripe_subscription_id VARCHAR(255) NOT NULL,
  stripe_subscription_item_id VARCHAR(255),
  total_quantity INT NOT NULL,
  assigned_quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL,  -- Calculated: total - assigned
  status VARCHAR(50) NOT NULL,  -- 'active', 'canceled', 'expired', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- UserSubscription table (add batch reference)
ALTER TABLE user_subscriptions
ADD COLUMN subscription_batch_id UUID REFERENCES subscription_batches(id);

-- Batch licenses have NULL user_id when unassigned
-- When assigned, user_id is set and status changes from 'unassigned' to 'active'
```

### 2.5 Related Endpoints

```
GET /subscription-batches                          -- List all batches for user
GET /subscription-batches/{id}                     -- Get single batch
GET /subscription-batches/{id}/licenses            -- Get all licenses in batch
POST /subscription-batches/{id}/assign             -- Assign license to user
DELETE /subscription-batches/{id}/licenses/{licenseId}/revoke  -- Revoke
PATCH /subscription-batches/{id}/quantity          -- Update quantity
DELETE /subscription-batches/{id}                  -- Cancel batch
DELETE /subscription-batches/{id}/permanent        -- Delete canceled batch
```

See `src/services/domain/subscription/bulkLicenseService.ts` for full API contract.

### 2.6 Testing Checklist

- [ ] Endpoint accepts all required fields
- [ ] Validates quantity > 0
- [ ] Returns 404 if plan doesn't exist
- [ ] Returns 400 for invalid input
- [ ] Creates Stripe checkout session with correct quantity
- [ ] Sets metadata correctly (`is_bulk_purchase`, quantity, etc.)
- [ ] Returns valid session URL
- [ ] Webhook creates SubscriptionBatch record
- [ ] Webhook creates correct number of unassigned licenses
- [ ] Coupon codes are applied correctly
- [ ] Group linking works (if `group_id` provided)
- [ ] Success URL redirect works
- [ ] Cancel URL redirect works

---

## 3. Organization Import API

**Priority:** 🟡 MEDIUM
**Status:** ⚠️ Implemented but response format issues found

### Problem

Frontend receives HTTP 200 OK from import endpoint but shows "Import Failed" because backend response is missing required `errors` and `warnings` fields.

### Endpoint

```
POST /api/v1/organizations/{organization_id}/import
```

### Expected Response Format

```json
{
  "success": true,
  "dry_run": false,
  "summary": {
    "users_created": 9,
    "users_updated": 0,
    "users_skipped": 0,
    "groups_created": 9,
    "groups_updated": 0,
    "groups_skipped": 0,
    "memberships_created": 15,
    "memberships_skipped": 0,
    "total_processed": 33,
    "processing_time": "2.5s"
  },
  "errors": [],      // MUST be present (even if empty)
  "warnings": []     // MUST be present (even if empty)
}
```

### Common Mistakes

```json
// ❌ WRONG - missing fields
{
  "success": true,
  "data": { ... }  // Frontend doesn't expect "data" wrapper
}

// ❌ WRONG - errors field is null instead of empty array
{
  "success": true,
  "summary": { ... },
  "errors": null,  // Should be []
  "warnings": null  // Should be []
}

// ❌ WRONG - missing summary fields
{
  "success": true,
  "summary": {
    "users_created": 9
    // Missing other required fields
  }
}

// ❌ WRONG - field name mismatch (camelCase vs snake_case)
{
  "usersCreated": 9,  // Should be users_created
  "groupsCreated": 9   // Should be groups_created
}
```

### Required Fields Checklist

**Top-level:**
- [ ] `success` (boolean)
- [ ] `dry_run` (boolean)
- [ ] `summary` (object)
- [ ] `errors` (array - must exist even if empty)
- [ ] `warnings` (array - must exist even if empty)

**Summary object:**
- [ ] `users_created` (number)
- [ ] `users_updated` (number)
- [ ] `users_skipped` (number)
- [ ] `groups_created` (number)
- [ ] `groups_updated` (number)
- [ ] `groups_skipped` (number)
- [ ] `memberships_created` (number)
- [ ] `memberships_skipped` (number)
- [ ] `total_processed` (number)
- [ ] `processing_time` (string)

### HTTP Status Codes

- **200 OK** - Successful import (even with warnings)
- **400 Bad Request** - Validation errors (with errors array populated)
- **403 Forbidden** - User not authorized
- **404 Not Found** - Organization not found
- **500 Internal Server Error** - Unexpected backend error

### Testing

```bash
# Test with dry_run=false (actual import)
curl -X POST \
  "http://localhost:8080/api/v1/organizations/YOUR_ORG_ID/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "users=@users.csv" \
  -F "groups=@groups.csv" \
  -F "memberships=@memberships.csv" \
  -F "dry_run=false" \
  -F "update_existing=false" \
  -v
```

Expected response:
```
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{
  "success": true,
  "dry_run": false,
  "summary": { ... },
  "errors": [],
  "warnings": []
}
```

### Backend Debug Code

Add this to verify response before sending:

```python
# Before returning the response
print("=" * 50)
print("IMPORT RESPONSE DEBUG:")
print(f"Type: {type(response)}")
print(f"Success: {response.get('success')}")
print(f"Errors: {response.get('errors')}")
print(f"Errors type: {type(response.get('errors'))}")
print(f"Warnings: {response.get('warnings')}")
print(f"Summary: {response.get('summary')}")
print(f"Full response: {json.dumps(response, indent=2)}")
print("=" * 50)
return response
```

---

## 4. Groups API Enhancements

**Priority:** 🟢 LOW
**Status:** Optional optimizations

### 4.1 Bulk Terminal Creation Endpoint

**Current Implementation:** Frontend creates terminals one-by-one in a loop (N API calls)

**Suggested Optimization:**

```
POST /class-groups/{groupId}/bulk-create-terminals

Request:
{
  "terms": "I accept the terms...",
  "expiry": 3600,
  "instance_type": "debian",
  "name_template": "{group_name} - {user_email}"
}

Response:
{
  "success": true,
  "created_count": 15,
  "failed_count": 0,
  "terminals": [
    {"user_id": "user1", "terminal_id": "term123", "session_id": "sess456"},
    ...
  ],
  "errors": []
}
```

**Benefits:**
- Single transaction (all-or-nothing)
- Better performance (1 API call vs N calls)
- Atomic operation with rollback on failure
- Backend handles quota checking
- Name templating support

**Note:** This is an optimization. Current implementation works but is not optimal for large groups.

### 4.2 Group Usage Metrics

```
GET /class-groups/{groupId}/usage-metrics

Response:
{
  "group_id": "group123",
  "member_count": 15,
  "active_terminals": 8,
  "total_terminal_hours": 245.5,
  "quota_limits": {
    "max_concurrent_terminals": 20,
    "max_members": 50,
    "storage_gb": 100
  },
  "current_usage": {
    "concurrent_terminals": 8,
    "storage_used_gb": 34.2
  }
}
```

**Benefits:** Quota monitoring, billing, alerts, analytics

---

## 5. UX Enhancement APIs

**Priority:** 🟡 MEDIUM
**Status:** ✅ Some complete, some require backend

### 5.1 Completed (No Backend Changes Needed)

- ✅ Empty states with CTAs
- ✅ Bulk pricing calculator enhancements
- ✅ Simplified subscription display

### 5.2 Limit Information API

**Status:** ⏳ Requires backend

```
GET /api/v1/limits/current

Response:
{
  "terminals": {
    "current": 3,
    "limit": 5,
    "percentage": 60
  },
  "storage_gb": {
    "current": 45,
    "limit": 100,
    "percentage": 45
  },
  "organization_members": {
    "current": 2,
    "limit": 10,
    "percentage": 20
  },
  "concurrent_sessions": {
    "current": 1,
    "limit": 2,
    "percentage": 50
  }
}
```

**Use Case:** Display upgrade prompts when users approach limits

### 5.3 Next Tier Recommendation API

```
GET /api/v1/limits/upgrade-options?resource=terminals

Response:
{
  "current_plan": {
    "id": "plan_solo",
    "name": "Solo",
    "limit": 5
  },
  "recommended_plan": {
    "id": "plan_trainer",
    "name": "Trainer",
    "limit": 10,
    "price_amount": 1200,
    "currency": "EUR",
    "billing_interval": "month"
  },
  "comparison": {
    "additional_terminals": 5,
    "price_difference": 800
  }
}
```

**Use Case:** Show upgrade CTA when user hits limit

### 5.4 Enhanced Error Responses

When a limit is hit, API should return:

```json
{
  "error": "limit_exceeded",
  "error_message": "Terminal limit reached",
  "limit_info": {
    "resource": "terminals",
    "current": 5,
    "limit": 5,
    "upgrade_url": "/checkout/plan_trainer"
  }
}
```

**Integration Points:**
- Terminal creation (5/5 limit)
- Storage quota exceeded
- Member invitation limit
- Concurrent session limit

### 5.5 Trial Status API

```
GET /api/v1/subscriptions/trial-status

Response:
{
  "is_trial": true,
  "trial_end": "2025-11-09T12:00:00Z",
  "days_remaining": 4,
  "urgency_level": "high", // high (≤3), medium (4-5), low (6+)
  "has_payment_method": false,
  "usage_summary": {
    "terminals_created": 3,
    "total_session_hours": 12
  }
}
```

**Use Case:** Show trial countdown banner with conversion prompts

---

## 6. Testing & Validation

### 6.1 General Testing Checklist

**For ALL endpoints:**
- [ ] Verify authentication required (401 if no token)
- [ ] Verify authorization (403 if not permitted)
- [ ] Validate input parameters (400 for invalid input)
- [ ] Check resource existence (404 if not found)
- [ ] Test edge cases (empty strings, null values, max values)
- [ ] Verify response format matches specification exactly
- [ ] Check HTTP status codes are correct
- [ ] Test with invalid UUIDs
- [ ] Test rate limiting (if applicable)
- [ ] Check database constraints are enforced

### 6.2 Bulk License Testing

```bash
# 1. Verify tiered plan structure
GET /api/v1/subscription-plans
# Expected: Plans with use_tiered_pricing = true have valid pricing_tiers

# 2. Test pricing preview
GET /api/v1/subscription-plans/pricing-preview?plan_id={id}&quantity=10
# Expected: Returns pricing breakdown with tier costs

# 3. Test bulk purchase
POST /api/v1/user-subscriptions/purchase-bulk
{
  "subscription_plan_id": "uuid-here",
  "quantity": 10
}
# Expected: Creates subscription batch with 10 unassigned licenses
```

### 6.3 Security Testing

**Authorization Bypass Tests:**
```bash
# Try to access another user's resources
GET /terminals/user-sessions (with different user's token)
GET /subscription-batches/{other_user_batch_id}
POST /subscription-batches/{other_user_batch_id}/assign

# Try to access group without membership
GET /terminals/user-sessions?group_id={non_member_group_id}
# Expected: 403 Forbidden
```

**Rate Limiting Tests:**
```bash
# Rapid-fire requests to trigger rate limit
for i in {1..100}; do
  curl -X POST /api/v1/terminals/start-session ...
done
# Expected: 429 Too Many Requests after threshold
```

### 6.4 Integration Testing

**Group Workflow (End-to-End):**
1. Create group → Verify `owner_user_id` populated
2. Add 2 members → Verify memberships created
3. Bulk create terminals → Verify 3 terminals created
4. Create personal terminal → Verify terminal created
5. Share terminal with group → Verify share created
6. Filter by group → Verify only group terminals shown
7. Switch to "All groups" → Verify all terminals shown

**Bulk License Workflow (End-to-End):**
1. Get tiered plans → Verify `pricing_tiers` present
2. Preview pricing for 50 licenses → Verify discount applied
3. Create checkout session → Verify Stripe URL returned
4. Complete payment (use Stripe test card)
5. Verify webhook creates batch + 50 unassigned licenses
6. Assign license to user → Verify license status changes
7. Revoke license → Verify user loses access

---

## Related Documentation

**Security:** See `.claude/backend/SECURITY_CHECKLIST.md` for comprehensive security requirements

**Frontend:** See these files for frontend implementation details:
- Bulk licensing: `BULK_LICENSE_IMPLEMENTATION_COMPLETE.md`
- Groups: `GROUPS_IMPLEMENTATION_COMPLETE.md`
- Service layer: `src/services/domain/subscription/bulkLicenseService.ts`
- Store: `src/stores/subscriptionBatches.ts`

---

## Summary of Priorities

**🔴 HIGH PRIORITY (Complete First):**
1. Terminal filtering by group (30-60 min) - Frontend waiting
2. Bulk license checkout session - Critical for revenue

**🟡 MEDIUM PRIORITY (Next):**
3. Organization import API fixes - Active users affected
4. Limit information API - Improves conversion
5. Trial status API - Reduces churn

**🟢 LOW PRIORITY (Nice to Have):**
6. Bulk terminal creation endpoint - Optimization only
7. Group usage metrics - Analytics enhancement
