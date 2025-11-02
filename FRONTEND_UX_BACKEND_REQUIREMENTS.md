# Frontend UX Enhancements - Backend Requirements

**Date:** 2025-11-02
**Purpose:** Document backend API requirements for frontend UX improvements from FRONTEND_UX_ISSUES.md

---

## ✅ Completed Frontend Implementations (No Backend Changes Needed)

### 1. Empty States with CTAs
**Status:** ✅ Implemented
**Components:**
- Created `EmptyState.vue` component
- Integrated across Entity.vue, Terminals, Groups, SSH Keys, Themes, Invoices, Payment Methods
- **Backend:** No changes required (uses existing empty list responses)

### 2. Bulk Pricing Calculator Enhancements
**Status:** ✅ Implemented
**Enhancements:**
- Discount percentage badge
- Comparison table (individual vs bulk pricing)
- Use case testimonial for 15+ licenses
- Help link to bulk licensing documentation
- **Backend:** No changes required (uses existing pricing preview API)

### 3. Simplified Subscription Display
**Status:** ✅ Implemented
**Changes:**
- Made "All Subscriptions" section collapsible by default
- Hides complexity unless user expands
- Clear primary subscription shown prominently
- **Backend:** No changes required (uses existing subscription data)

---

## 🔶 Features Requiring Backend Support

### 4. Upgrade CTAs at Limit Points (HIGH PRIORITY)

**Problem:** Users hit limits with no clear upgrade path

**Frontend Needed:**
- ✅ LimitReachedModal component (to be created)
- Integration at limit enforcement points

**Backend Requirements:**

#### A. Limit Information API
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

#### B. Next Tier Recommendation API
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

**Integration Points:**
- Terminal creation (before hitting 5/5 limit)
- Storage quota exceeded
- Member invitation (organization member limit)
- Session start (concurrent session limit)

**Error Response Enhancement:**
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

---

### 5. Trial Countdown & Conversion Prompts (MEDIUM PRIORITY)

**Frontend Needed:**
- ✅ TrialCountdownBanner component (to be created)
- Display on dashboard/top of app

**Backend Requirements:**

#### A. Trial Status API
```
GET /api/v1/subscriptions/trial-status
Response:
{
  "is_trial": true,
  "trial_end": "2025-11-09T12:00:00Z",
  "days_remaining": 4,
  "urgency_level": "high", // high (<=3 days), medium (4-5 days), low (6+ days)
  "has_payment_method": false,
  "usage_summary": {
    "terminals_created": 3,
    "total_session_hours": 12
  }
}
```

**Display Logic:**
- Green banner: 6+ days remaining
- Yellow banner: 4-5 days remaining
- Red banner: <=3 days remaining
- Modal at 3 days: "Upgrade to keep access" with usage stats

---

### 6. Usage Metrics Visualization (MEDIUM PRIORITY)

**Frontend Needed:**
- ✅ UsageMetricsCard component with progress bars (to be created)

**Backend Requirements:**

#### A. Enhanced Usage Metrics API
```
GET /api/v1/usage-metrics/current
Response:
{
  "terminals": {
    "current": 3,
    "limit": 5,
    "percentage": 60,
    "trend": {
      "change_percent": 20,
      "direction": "up", // up, down, stable
      "comparison_period": "last_month"
    },
    "color_code": "green" // green (0-70%), yellow (70-90%), red (90-100%)
  },
  "storage_gb": {
    "current": 45,
    "limit": 100,
    "percentage": 45,
    "trend": {
      "change_percent": 5,
      "direction": "up",
      "comparison_period": "last_month"
    },
    "color_code": "green"
  },
  "session_hours_monthly": {
    "current": 180,
    "limit": 240,
    "percentage": 75,
    "trend": {
      "change_percent": 15,
      "direction": "up",
      "comparison_period": "last_month"
    },
    "color_code": "yellow"
  },
  "approaching_limits": [
    {
      "resource": "session_hours_monthly",
      "percentage": 75,
      "message": "Approaching session limit. Upgrade to Pro for unlimited.",
      "upgrade_cta": {
        "text": "Upgrade to Pro",
        "url": "/checkout/plan_pro"
      }
    }
  ]
}
```

**Visual Requirements:**
- Progress bars with color coding
- Trend indicators (↑/↓)
- Comparison to previous period
- Automatic upgrade CTA when >90% utilized

---

### 7. Downgrade Warning Flow (MEDIUM PRIORITY)

**Frontend Needed:**
- DowngradeValidationModal component
- Pre-downgrade validation UI

**Backend Requirements:**

#### A. Downgrade Validation API
```
POST /api/v1/subscriptions/validate-downgrade
Body:
{
  "target_plan_id": "plan_solo"
}

Response:
{
  "can_downgrade": false,
  "blockers": [
    {
      "type": "terminal_limit_exceeded",
      "message": "You have 8 terminals but Solo allows 5",
      "current": 8,
      "target_limit": 5,
      "action_required": "Please deactivate 3 terminals first",
      "affected_resources": ["terminal_id_1", "terminal_id_2", "..."]
    },
    {
      "type": "feature_unavailable",
      "message": "API access is not available on Solo",
      "current_usage": true,
      "action_required": "Disable API access or choose a plan with API support"
    }
  ],
  "features_lost": [
    "API Access",
    "Priority Support",
    "5 additional terminal slots"
  ],
  "effective_date": "2025-12-01T00:00:00Z",
  "downgrade_url": "/api/v1/subscriptions/downgrade"
}
```

**Validation Checklist:**
- ❌ Active terminals exceed limit (8 > 5)
- ❌ Using API access (not available on Solo)
- ❌ Active bulk licenses (not available on Solo)
- ❌ Storage usage exceeds limit
- ✅ All clear to downgrade

**UX Flow:**
1. User clicks "Downgrade"
2. Frontend calls validation API
3. If blockers exist, show modal with resolution steps
4. User resolves blockers
5. User confirms downgrade (scheduled for end of billing period)

---

### 8. Organization Context Switcher (FUTURE)

**Frontend Needed:**
- Organization context dropdown in header
- Context-aware resource filtering

**Backend Requirements:**

#### A. Current Organization Context API
```
GET /api/v1/organizations/current
Response:
{
  "current_organization_id": "org_123",
  "current_organization": {
    "id": "org_123",
    "name": "Personal",
    "type": "personal",
    "role": "owner"
  },
  "available_organizations": [
    {
      "id": "org_123",
      "name": "Personal",
      "type": "personal",
      "role": "owner"
    },
    {
      "id": "org_456",
      "name": "Acme Corp",
      "type": "team",
      "role": "owner"
    },
    {
      "id": "org_789",
      "name": "University Lab",
      "type": "team",
      "role": "member"
    }
  ]
}
```

#### B. Switch Organization Context API
```
POST /api/v1/organizations/switch
Body:
{
  "organization_id": "org_456"
}

Response:
{
  "success": true,
  "current_organization_id": "org_456",
  "session_updated": true
}
```

#### C. Resource Filtering by Organization
All resource endpoints should support `?organization_id=` query parameter:
```
GET /api/v1/terminals?organization_id=org_456
GET /api/v1/subscriptions?organization_id=org_456
GET /api/v1/limits/current?organization_id=org_456
```

**Session Management:**
- Backend should track current organization context in session/JWT
- All subsequent API calls use current organization context
- Frontend can override with explicit `organization_id` parameter

---

## 📊 Implementation Priority

### Phase 1: Quick Wins (1-2 weeks) - Already Completed ✅
1. ✅ Empty States with CTAs
2. ✅ Bulk Pricing Calculator Enhancements
3. ✅ Simplified Subscription Display

### Phase 2: High Priority (Next 2-3 weeks)
1. **Upgrade CTAs at Limit Points** (requires backend: limit info API + upgrade recommendations)
2. **Trial Countdown** (requires backend: trial status API)

### Phase 3: Medium Priority (1-2 months)
1. **Usage Metrics Visualization** (requires backend: enhanced usage metrics API)
2. **Downgrade Warning Flow** (requires backend: validation API)

### Phase 4: Future Enhancements (3+ months)
1. **Organization Context Switcher** (requires backend: org context management)

---

## 🔧 Backend Development Checklist

### Immediate (for Phase 2)

- [ ] **Limits API:**
  - [ ] GET `/api/v1/limits/current` - Current usage vs limits
  - [ ] GET `/api/v1/limits/upgrade-options?resource={type}` - Upgrade recommendations
  - [ ] Enhance error responses with `limit_info` object

- [ ] **Trial Status API:**
  - [ ] GET `/api/v1/subscriptions/trial-status` - Trial countdown info
  - [ ] Include usage summary in response

### Medium-term (for Phase 3)

- [ ] **Enhanced Usage Metrics:**
  - [ ] Add trend calculations (month-over-month comparison)
  - [ ] Add color coding logic (green/yellow/red based on %)
  - [ ] Add approaching limit warnings

- [ ] **Downgrade Validation:**
  - [ ] POST `/api/v1/subscriptions/validate-downgrade` - Pre-downgrade validation
  - [ ] Check terminal limits, feature usage, storage, etc.
  - [ ] Return detailed blocker list

### Future (for Phase 4)

- [ ] **Organization Context:**
  - [ ] Session-based organization context tracking
  - [ ] Organization switching API
  - [ ] Resource filtering by organization

---

## 📝 API Response Standards

All new APIs should follow these standards:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "error_code",
  "error_message": "Human-readable error message",
  "metadata": {
    // Additional context (e.g., limit_info, validation_errors)
  }
}
```

### Limit-Related Errors
```json
{
  "error": "limit_exceeded",
  "error_message": "Terminal limit reached (5/5)",
  "limit_info": {
    "resource": "terminals",
    "current": 5,
    "limit": 5,
    "plan_name": "Solo",
    "upgrade_url": "/checkout/plan_trainer"
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Contact:** Frontend Team
