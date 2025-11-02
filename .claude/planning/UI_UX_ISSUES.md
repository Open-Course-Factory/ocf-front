# Frontend UI/UX Issues - Prioritized Action List

**Document Purpose:** Frontend-only UI/UX problems requiring attention, ordered by priority and doability.

---

## 🔴 CRITICAL (0-3 months)

*No critical UI/UX issues identified - all critical issues are backend security*

---

## 🟠 HIGH PRIORITY (3-6 months)

### 1. Upgrade CTAs at Limit Points (EASY - 1 week)

**Problem:** When users hit resource limits (terminals, storage, members), they see generic error messages with no clear upgrade path.

**Current behavior:**
- User tries to create 6th terminal → "Terminal limit reached (5/5)" → Blocked
- User frustrated, doesn't know how to proceed
- Lost conversion opportunity

**Required:**
- Modal showing current limit vs next tier
- Clear pricing comparison (current plan vs suggested upgrade)
- Direct upgrade link
- Alternative actions (delete unused resources, contact support)

**Locations:**
- Terminal creation limit
- Storage limit
- Organization member limit
- Concurrent session limit
- API rate limit (if applicable)

**Impact:** High revenue - converts frustrated users to paid upgrades
**Effort:** Low - reusable modal component
**Doability:** ⭐⭐⭐⭐⭐ Very Easy

---

### 2. Empty States with CTAs (EASY - 3 days)

**Problem:** Empty screens show blank tables with no guidance on what to do next.

**Current behavior:**
- New user lands on Terminals page → Empty table with headers → Confusion
- No groups yet → Empty list → User doesn't know groups are useful
- No invoices → Empty table → User wonders if something is broken

**Required:**
- Illustration or icon
- Clear title ("No terminals yet")
- Description explaining what this is
- Primary action button ("Create Terminal")
- Optional help link ("Learn more")

**Locations:**
- Terminals page (no terminals)
- Groups page (no groups)
- Subscriptions page (no subscription)
- Bulk licenses page (no batches)
- Invoices page (no invoices)
- Payment methods page (no methods)

**Impact:** Medium - improves first-time user experience
**Effort:** Low - reusable EmptyState component
**Doability:** ⭐⭐⭐⭐⭐ Very Easy

---

### 3. Onboarding Flow for New Users (MEDIUM - 2 weeks)

**Problem:** New users land on dashboard with no guidance, leading to low activation rates.

**Current behavior:**
- User signs up → Sees empty dashboard → Doesn't know what to do first
- 50-60% of users never create first terminal
- High early churn

**Required:**

**Option A: Interactive Tour (Preferred)**
- Welcome modal on first login
- Step-by-step guided tour (4-5 steps)
- Highlights: "Create terminal", "Join group", "Upgrade plan"
- Progress indicator
- Skippable but persistent until completed

**Option B: Checklist (Lighter weight)**
- Dismissible checklist widget on dashboard
- 3-4 key tasks: "Create first terminal", "Join a group", "Explore plans"
- Checkmarks when completed
- Links to relevant pages

**Impact:** Very high - 30-50% activation improvement
**Effort:** Medium - needs careful UX design
**Doability:** ⭐⭐⭐ Medium

---

### 4. Subscription Complexity - Simplify Display (MEDIUM - 1 week)

**Problem:** Users with multiple subscriptions (personal + assigned + organization) see confusing list of subscriptions and don't understand which one they're "using".

**Current behavior:**
- Shows all subscriptions in a list
- ⭐ indicator for "primary" is subtle
- User asks: "Am I paying for two subscriptions?"
- User asks: "Which features do I actually have?"

**Required:**
- **Primary view:** Show ONE "effective plan" prominently
- Clear source label ("Provided by Acme University")
- Feature list (what you actually get)
- Hide complexity in collapsible "Advanced details" section
- Only show multiple subscriptions if user expands
- Clear explanation: "You have multiple subscriptions. The highest-tier determines your features."

**Impact:** High - reduces confusion, support tickets
**Effort:** Low - mostly reorganizing existing data
**Doability:** ⭐⭐⭐⭐ Easy

---

## 🟡 MEDIUM PRIORITY (6-12 months)

### 5. Organization Context Switcher (MEDIUM - 1 week)

**Problem:** Users in multiple organizations don't know which org context they're currently in. Resources are aggregated, but ownership is unclear.

**Current behavior:**
- User belongs to 3 organizations (Personal, Company, School)
- Creates terminal → Which org owns it? Unclear
- Views terminals → Mix of personal and org terminals, no clear separation
- Colleagues can't see their terminals

**Required:**
- Dropdown in header/sidebar: "Current Organization: Personal ▼"
- Options: Personal, Acme Corp (Owner), School (Member)
- When switching context:
  - Filter resources to show only that org's resources
  - Show org's quota/limits
  - Show org's subscription plan
- Visual indicator of current context (color, icon)

**Impact:** High for multi-org users (improves clarity)
**Effort:** Medium - needs routing changes, state management
**Doability:** ⭐⭐⭐ Medium

---

### 6. Trial Countdown & Conversion Prompts (EASY - 3 days)

**Problem:** Users on trials forget when trial ends, leading to surprise cancellations and lost conversions.

**Current behavior:**
- User on 7-day trial
- No visible countdown
- Trial expires → Surprise! → Access cut off
- User frustrated

**Required:**
- Banner showing "Your trial ends in X days"
- Urgency styling (green → yellow → red as expiration approaches)
- CTA: "Add Payment Method"
- Modal at 3 days remaining: "Upgrade to keep access"
- Shows what they've accomplished during trial (usage stats)
- Clear upgrade path

**Impact:** Medium - 15-20% conversion improvement
**Effort:** Low - banner component + modal
**Doability:** ⭐⭐⭐⭐ Easy

---

### 7. Bulk Pricing Calculator - Enhance Interactivity (EASY - 2 days)

**Problem:** While the pricing calculator exists, it could be more prominent and persuasive.

**Current:** Interactive slider with pricing (good foundation)

**Enhancements needed:**
- Show total savings vs individual purchases
  - Example: "Save €120/year with bulk pricing!"
- Comparison table: "30 individual licenses (€9 each) = €270 vs Bulk (€8 each) = €240"
- Visual discount badge (33% OFF for 16+)
- Testimonial or use case ("Perfect for a classroom of 30 students")
- Link to "How bulk licensing works" help article

**Impact:** Low-Medium - incremental conversion improvement
**Effort:** Very Low - enhance existing component
**Doability:** ⭐⭐⭐⭐⭐ Very Easy

---

### 8. Downgrade Warning Flow (MEDIUM - 3 days)

**Problem:** No self-service downgrade option, or if exists, no validation warnings.

**Current behavior:**
- User wants to downgrade from Trainer (10 terminals) to Solo (5 terminals)
- Has 8 active terminals
- Unknown what happens

**Required:**
- Downgrade validation before confirming
- Warning modal: "You have 8 terminals but Solo allows 5. Please deactivate 3 terminals first."
- Checklist of blockers:
  - ❌ Active terminals exceed limit (8 > 5)
  - ❌ Using API access (not available on Solo)
  - ❌ Active bulk licenses (not available on Solo)
- Show features you'll lose
- Clear instructions on how to resolve blockers
- Schedule downgrade for end of billing period (not immediate)

**Impact:** Medium - better customer experience, fewer support tickets
**Effort:** Low-Medium - validation + modal
**Doability:** ⭐⭐⭐ Medium (depends on backend API)

---

### 9. Usage Metrics Visualization (MEDIUM - 1 week)

**Problem:** Users don't clearly see their resource usage vs limits.

**Current:** Basic usage stats (assumed)

**Enhancement needed:**
- Visual progress bars for each limit:
  - Terminals: 3/5 (60%) [green bar]
  - Storage: 45GB/100GB (45%) [green bar]
  - Session time this month: 180/240 hours (75%) [yellow bar]
- Color coding:
  - Green: 0-70% usage
  - Yellow: 70-90% usage (warning)
  - Red: 90-100% usage (near limit)
- Trend indicators: "↑ 20% increase from last month"
- Comparison to plan limits
- CTA when approaching limit: "Approaching limit. Upgrade to Pro for unlimited."

**Impact:** Medium - increases awareness, prompts upgrades
**Effort:** Medium - visualization components
**Doability:** ⭐⭐⭐ Medium

---

## 🟢 LOW PRIORITY (12+ months)

### 10. Personalized Dashboard (HARD - 2-3 weeks)

**Problem:** Dashboard shows same view for all user types (student, teacher, admin).

**Enhancement:**
- Role-based dashboard layouts
  - **Student view:** My terminals, My groups, Assigned licenses
  - **Teacher view:** My licenses, My groups, Student activity
  - **Admin view:** Organization overview, Usage stats, Billing
- Customizable widgets (drag & drop)
- Recent activity feed
- Quick actions based on role

**Impact:** Low - nice to have, not essential
**Effort:** High - significant dev work
**Doability:** ⭐ Hard

---

### 11. Advanced Filtering & Search (MEDIUM - 1 week)

**Problem:** Large lists (terminals, groups, invoices) have no filtering or search.

**Current:** Basic tables

**Enhancement:**
- Search bar (filter by name, email, etc.)
- Filter dropdowns:
  - Terminals: Status (running/stopped), Organization, Created date
  - Groups: Active/Expired, Organization
  - Members: Role, Status
- Saved filters
- Export to CSV

**Impact:** Low-Medium - quality of life for power users
**Effort:** Medium - depends on backend API support
**Doability:** ⭐⭐ Medium-Hard (backend dependent)

---

### 12. Mobile App Experience (HARD - 3+ months)

**Problem:** While responsive, mobile experience is not optimized for mobile-first use cases.

**Current:** Responsive web design (good foundation)

**Enhancement:**
- Mobile-optimized navigation (bottom tab bar)
- Swipe gestures
- Mobile-specific terminal viewer
- Push notifications (trial ending, terminal stopped)
- Native app (React Native or PWA)

**Impact:** Low - web responsive is sufficient for now
**Effort:** Very High - full mobile app development
**Doability:** ⭐ Very Hard

---

## Summary by Priority

| Priority | Count | Total Effort | Recommended Timeline |
|----------|-------|--------------|---------------------|
| 🔴 Critical | 0 | - | Immediate |
| 🟠 High | 4 | 4-5 weeks | Q2 2025 (3-6 months) |
| 🟡 Medium | 5 | 4-5 weeks | Q3-Q4 2025 (6-12 months) |
| 🟢 Low | 3 | 6+ weeks | 2026+ (12+ months) |

---

## Quick Wins (Do First)

These give maximum impact with minimal effort:

1. ✅ **Empty States** (3 days) - Improves first impression
2. ✅ **Upgrade CTAs at Limits** (1 week) - Direct revenue impact
3. ✅ **Trial Countdown** (3 days) - Better conversion rates
4. ✅ **Simplify Subscription Display** (1 week) - Reduces confusion
5. ✅ **Bulk Pricing Enhancements** (2 days) - Incremental revenue

**Total: 3-4 weeks of work for significant UX improvement**

---

## Measurement & Success Metrics

Track these metrics to measure UX improvements:

### Onboarding:
- **Activation rate:** % of new users who create first terminal (Target: 60%+)
- **Time to first terminal:** Median time from signup to first terminal (Target: <5 min)

### Conversion:
- **Upgrade conversion:** % of limit-hit users who upgrade (Target: 5-10%)
- **Trial conversion:** % of trial users who become paid (Target: 15-25%)

### Engagement:
- **Feature discovery:** % of users who use groups, bulk licenses, sharing (Target: 40%+)
- **Session frequency:** Average logins per week (Target: 3+)

### Support:
- **Support tickets:** Confusion-related tickets (Target: -50%)
- **Self-service resolution:** % of limit issues resolved without support (Target: 80%+)

---

**Document Version:** 1.0
**Date:** 2025-11-01
**Next Review:** After Q2 2025 implementation
