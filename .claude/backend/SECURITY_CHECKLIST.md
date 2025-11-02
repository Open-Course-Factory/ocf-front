# Backend Security & Functionality Checklist

**Purpose:** Comprehensive checklist to verify backend implementation completeness and security.

**Instructions:** Go through each item with your backend team. Check ✅ if implemented correctly, ❌ if missing, ⚠️ if partially implemented.

---

## 🔴 CRITICAL SECURITY

### Authorization & Access Control

- [ ] **Backend permission enforcement on ALL endpoints**
  - Every API endpoint checks user permissions server-side (not just frontend)
  - Cannot bypass authorization by calling API directly
  - Test: Try calling protected endpoints with unauthorized token

- [ ] **Organization-level authorization**
  - `POST /organizations/:id` - Only owner/manager can update
  - `DELETE /organizations/:id` - Only owner can delete
  - `POST /organizations/:id/members` - Only owner/manager can add members
  - `PATCH /organization-memberships/:id` - Only owner/manager can change roles
  - Cannot access organization data without membership

- [ ] **Group-level authorization**
  - `POST /class-groups/:id` - Only owner/admin can update
  - `DELETE /class-groups/:id` - Only owner can delete
  - `POST /class-groups/:id/members` - Only owner/admin can add members
  - `PATCH /group-members/:id` - Only owner/admin can change roles
  - Cannot access group data without membership

- [ ] **Subscription/Billing authorization**
  - `POST /user-subscriptions/checkout` - User can only create for themselves
  - `POST /subscription-batches/:id/assign` - Only batch owner can assign licenses
  - `DELETE /subscription-batches/:id/licenses/:licenseId` - Only batch owner can revoke
  - Cannot manage another user's subscription

- [ ] **Resource ownership verification**
  - Terminals: User owns the terminal OR is in the owning organization
  - Groups: User is a member of the group
  - Subscriptions: User owns the subscription OR is batch owner
  - Cannot delete/modify resources owned by others

---

### Rate Limiting

- [ ] **Authentication endpoints** (CRITICAL - prevents brute force)
  - `POST /auth/login` - Max 5 attempts per 15 minutes per IP
  - `POST /auth/register` - Max 3 registrations per hour per IP
  - `POST /auth/password-reset` - Max 3 requests per hour per email
  - Locked accounts after too many failed attempts

- [ ] **Payment/Checkout endpoints** (CRITICAL - prevents fraud)
  - `POST /user-subscriptions/checkout` - Max 10 per hour per user
  - `POST /subscription-batches/purchase` - Max 5 per hour per user
  - `POST /payment-methods` - Max 10 per hour per user

- [ ] **Resource creation endpoints** (prevents abuse)
  - `POST /terminals/user-sessions` - Max 50 per hour per user
  - `POST /class-groups` - Max 20 per hour per user
  - `POST /organization-memberships` - Max 100 per hour per organization

- [ ] **General API rate limiting**
  - Global rate limit: 1,000 requests per 15 minutes per user
  - Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - 429 status code with `Retry-After` header when exceeded

- [ ] **Rate limit bypasses for testing**
  - Test accounts can bypass rate limits in non-production environments
  - Rate limits enforced in production without exceptions

---

### Payment Security

- [ ] **3D Secure / SCA enabled** (CRITICAL - EU legal requirement)
  - Stripe checkout sessions have `request_three_d_secure: 'automatic'`
  - PaymentIntents have SCA enabled
  - Tested with European cards requiring 3D Secure

- [ ] **Stripe webhook signature verification**
  - All webhook endpoints verify `Stripe-Signature` header
  - Reject webhooks with invalid signatures
  - Use `stripe.webhooks.constructEvent()` or equivalent

- [ ] **No sensitive payment data in database**
  - No full card numbers stored (only last 4 digits)
  - No CVV codes stored
  - No card expiry dates stored (only in Stripe)
  - Stripe customer IDs and payment method IDs only

- [ ] **PCI compliance**
  - All payment forms use Stripe Elements or Checkout (not raw card inputs)
  - No payment card data touches your servers
  - SSL/TLS enabled on all payment pages

---

### Authentication & Sessions

- [ ] **JWT token security**
  - Tokens signed with strong secret (256-bit minimum)
  - Tokens expire (max 24 hours, ideally 1-2 hours)
  - Refresh token mechanism for long sessions
  - Tokens invalidated on logout

- [ ] **Password security**
  - Passwords hashed with bcrypt, scrypt, or Argon2 (NOT MD5, SHA1, or plain)
  - Minimum password length enforced (8+ characters)
  - Password complexity requirements (optional but recommended)
  - No password length maximum (allow passphrases)

- [ ] **Session management**
  - Sessions expire after inactivity (30 minutes recommended)
  - User can view active sessions
  - User can revoke sessions remotely
  - Force logout on password change

---

## 🟠 HIGH PRIORITY

### Billing & Stripe Integration

- [ ] **Bulk license Stripe quantity sync** (CRITICAL FOR REVENUE)
  - When assigning a license: Update Stripe subscription quantity to match assigned count
  - When revoking a license: Decrease Stripe subscription quantity
  - Stripe subscription quantity always equals `assigned_quantity` (NOT `total_quantity`)
  - Test: Assign 10 licenses → Stripe shows quantity=10, not 30

- [ ] **Proration enabled**
  - Subscription upgrades use `proration_behavior: 'create_prorations'`
  - Subscription downgrades scheduled for end of period
  - Proration invoice items created on mid-cycle changes
  - Test: Upgrade from Solo to Trainer on day 15 → See prorated charge

- [ ] **Webhook handling for critical events**
  - `checkout.session.completed` - Create subscription in DB
  - `invoice.payment_succeeded` - Mark subscription active
  - `invoice.payment_failed` - Mark subscription past_due, start dunning
  - `customer.subscription.updated` - Update subscription in DB
  - `customer.subscription.deleted` - Cancel subscription in DB
  - All webhooks are idempotent (can handle duplicates)

- [ ] **Dunning management** (prevents revenue loss)
  - Failed payments trigger dunning sequence
  - Retry schedule: Day 1, 3, 5, 7, 10
  - Email reminders sent at each retry
  - Grace period (10-14 days) before cancellation
  - Test: Simulate failed payment → Verify retries and emails

- [ ] **Subscription status consistency**
  - DB subscription status always matches Stripe status
  - Webhook failures don't cause permanent drift
  - Manual sync endpoint available: `POST /admin/subscriptions/sync-stripe`

---

### Audit Logging

- [ ] **Security events logged**
  - Login attempts (success and failure)
  - Password resets
  - Failed authorization attempts
  - MFA enable/disable
  - Role changes (user promoted to owner, etc.)

- [ ] **Billing events logged**
  - Subscription created/canceled
  - Payment succeeded/failed
  - Bulk license purchased
  - License assigned/revoked
  - Plan upgrades/downgrades

- [ ] **Organization/Group events logged**
  - Member added/removed
  - Role changed
  - Organization created/deleted
  - Organization converted to team
  - Group created/deleted

- [ ] **Audit log retention**
  - Logs retained for at least 90 days (preferably 1 year)
  - Logs are immutable (cannot be edited/deleted)
  - Logs include: user_id, action, timestamp, IP, user-agent, resource_id

- [ ] **Audit log access**
  - Organization owners can view org audit logs
  - System admins can view all audit logs
  - Exportable to CSV/JSON
  - API endpoint: `GET /organizations/:id/audit-logs`

---

### Resource Ownership & Quota Enforcement

- [ ] **Explicit resource ownership**
  - Terminals have `organization_id` field (which org owns this)
  - Terminals have `billing_organization_id` field (who pays for this)
  - Cannot create terminal without specifying organization
  - Resources counted against owning organization's quota

- [ ] **Member limit enforcement**
  - Adding member to organization checks `member_count < max_members`
  - Transaction-safe (use database locks to prevent race conditions)
  - Returns clear error: "Member limit reached. Upgrade to add more."
  - Counter incremented/decremented atomically

- [ ] **Terminal limit enforcement**
  - Creating terminal checks `active_terminals < max_concurrent_terminals`
  - Counted per organization (not per user)
  - Clear error with upgrade CTA
  - Test: Try creating 6th terminal with 5-terminal limit

- [ ] **Storage limit enforcement**
  - Storage usage tracked per organization
  - Enforce `storage_used_gb < data_persistence_gb`
  - Block uploads when limit reached
  - Background job to calculate actual usage

- [ ] **Session duration enforcement**
  - Terminals auto-stop after `max_session_duration_minutes`
  - Warning shown before auto-stop (e.g., 5 minutes warning)
  - User can extend if within plan limits

---

## 🟡 MEDIUM PRIORITY

### Data Integrity & Validation

- [ ] **Input validation on all endpoints**
  - Email format validation
  - Required fields enforced
  - Type validation (string, number, date, UUID)
  - Length limits on text fields (prevent huge payloads)

- [ ] **SQL injection prevention**
  - All database queries use parameterized queries or ORM
  - No string concatenation for SQL queries
  - Test with inputs like: `'; DROP TABLE users; --`

- [ ] **XSS prevention**
  - All user input sanitized before display
  - HTML escaped in API responses
  - Content-Security-Policy headers set
  - Test with inputs like: `<script>alert('XSS')</script>`

- [ ] **CSRF protection**
  - State-changing endpoints require CSRF token or origin validation
  - SameSite cookie attribute set
  - Not applicable if using JWT-only (no cookies)

- [ ] **Database transaction safety**
  - Critical operations use database transactions
  - Bulk license assignment: Transaction ensures atomicity
  - Member addition: Transaction prevents race conditions
  - Rollback on errors

---

### API Design & Standards

- [ ] **Consistent error responses**
  - All errors return JSON with standard format: `{ error: string, error_code: string, message: string }`
  - HTTP status codes used correctly (400, 401, 403, 404, 422, 429, 500)
  - Error messages are user-friendly (not stack traces in production)

- [ ] **API versioning**
  - All endpoints prefixed with `/api/v1/`
  - Version included in routes for future compatibility
  - Breaking changes require new version (/api/v2/)

- [ ] **Pagination for large lists**
  - List endpoints support `?page=1&limit=50`
  - Default limit (e.g., 50 items)
  - Maximum limit (e.g., 200 items)
  - Return total count and pagination metadata

- [ ] **Filtering and sorting**
  - List endpoints support `?sort=created_at&order=desc`
  - Filter by status: `?status=active`
  - Filter by organization: `?organization_id=xyz`
  - Search by name/email: `?search=john`

- [ ] **CORS configuration**
  - CORS headers configured for frontend domain(s)
  - No wildcard `*` in production
  - Credentials allowed if needed (`Access-Control-Allow-Credentials: true`)

---

### Permission System

- [ ] **Fine-grained permission checks**
  - Helper functions for permission checks: `canManageOrganization(user, orgId)`
  - Reusable decorators/middleware: `@requireOrganizationRole('owner', 'manager')`
  - Permissions checked at handler level (not just route level)

- [ ] **Role hierarchy enforcement**
  - Owner can do everything Manager can do
  - Manager can do everything Member can do
  - Role changes respect hierarchy (Member cannot promote to Owner)

- [ ] **Resource-level permissions**
  - User can only access resources they own or have access to
  - Organization members can see organization resources
  - Group members can see group resources
  - Filtering applied at query level (not post-query)

---

### Stripe Integration Details

- [ ] **Customer creation**
  - Stripe customer created on user registration
  - `stripe_customer_id` stored in users table
  - Customer metadata includes user email, user_id
  - Idempotency: Don't create duplicate customers

- [ ] **Subscription lifecycle**
  - Trial periods configured correctly (`trial_period_days`)
  - Billing anchor date set correctly
  - Subscription metadata includes plan_id, user_id
  - Subscription items tracked for metered billing (if applicable)

- [ ] **Payment method management**
  - SetupIntents used for adding payment methods without charge
  - Default payment method set correctly
  - Expired cards detected and user notified
  - Payment method update through Stripe Customer Portal

- [ ] **Invoice handling**
  - Invoices synced to database for history
  - Invoice PDFs downloadable via Stripe
  - Invoice emails sent by Stripe (not custom implementation)
  - Failed invoice retries handled by Stripe Billing

- [ ] **Webhook endpoint security**
  - Single webhook endpoint handles all events: `POST /webhooks/stripe`
  - Raw request body preserved for signature verification
  - Events processed idempotently (same event can be sent multiple times)
  - Failed webhook processing logged and retried

---

## 🟢 NICE TO HAVE

### Advanced Features

- [ ] **Usage-based billing integration**
  - Usage metrics tracked per user/organization
  - Monthly cron job reports usage to Stripe
  - Stripe SubscriptionItem configured for metered billing
  - Usage records created with `SubscriptionItem.createUsageRecord()`

- [ ] **Multi-Factor Authentication (MFA)**
  - TOTP (Time-based One-Time Password) support
  - QR code generation for authenticator apps
  - Backup codes generated and stored (hashed)
  - MFA required for sensitive operations
  - Can enforce MFA at organization level

- [ ] **SSO (SAML) support**
  - SAML Identity Provider integration
  - Just-in-Time (JIT) provisioning
  - SAML metadata endpoint: `GET /auth/saml/metadata`
  - Assertion Consumer Service (ACS) endpoint: `POST /auth/saml/acs`
  - Organization-level SSO configuration

- [ ] **Academic term management**
  - Academic terms defined (Spring 2024, Fall 2024)
  - Groups can be linked to terms
  - Auto-archive groups at term end
  - Bulk license batches can expire with term

- [ ] **Educational email verification**
  - Verify .edu, .ac.uk domains
  - Integration with SheerID or similar service
  - Student/educator discounts applied after verification
  - Re-verification required annually

---

### Monitoring & Observability

- [ ] **Error tracking**
  - Errors logged with stack traces
  - Integration with error tracking service (Sentry, Rollbar)
  - Critical errors alert on-call engineers
  - Error rate monitoring

- [ ] **Performance monitoring**
  - Slow query detection (queries >1 second logged)
  - API endpoint latency tracked
  - Database connection pool monitoring
  - Cache hit/miss rates (if using cache)

- [ ] **Business metrics**
  - Daily active users (DAU)
  - Monthly recurring revenue (MRR)
  - Subscription churn rate
  - Terminal usage hours
  - Failed payment rate

- [ ] **Health check endpoints**
  - `GET /health` - Basic health check (200 OK if server running)
  - `GET /health/db` - Database connectivity check
  - `GET /health/stripe` - Stripe API connectivity
  - Used by load balancers and monitoring

---

### Data Protection & Privacy

- [ ] **GDPR compliance**
  - User can export their data: `GET /users/me/export`
  - User can delete their account: `DELETE /users/me`
  - Data deletion cascades correctly (terminals, subscriptions, memberships)
  - Privacy policy and terms of service accepted on signup

- [ ] **Data retention policies**
  - Deleted user data removed after 30 days
  - Soft delete vs hard delete strategy defined
  - Audit logs retained per policy (90 days minimum)
  - Backups retained per policy (30 days recommended)

- [ ] **Data encryption**
  - Sensitive data encrypted at rest (if applicable)
  - Database encryption enabled
  - SSL/TLS for all API communication (HTTPS only)
  - Secrets stored in environment variables (not code)

---

## Testing Checklist

### Security Testing

- [ ] **Authorization bypass testing**
  - Try accessing resources without authentication
  - Try accessing other users' resources
  - Try performing admin actions as regular user
  - Try SQL injection, XSS, CSRF attacks

- [ ] **Rate limit testing**
  - Verify rate limits trigger correctly
  - Verify 429 status code returned
  - Verify Retry-After header present
  - Test that authenticated users have higher limits

- [ ] **Payment testing**
  - Test successful payment flow (Stripe test mode)
  - Test failed payment flow (use test card 4000000000000341)
  - Test 3D Secure flow (use test card 4000002500003155)
  - Test webhook delivery and processing

### Functional Testing

- [ ] **Bulk license flow**
  - Purchase 30 licenses → Stripe subscription quantity = 0
  - Assign 10 licenses → Stripe subscription quantity = 10
  - Revoke 2 licenses → Stripe subscription quantity = 8
  - Verify proration on quantity changes

- [ ] **Organization permissions**
  - Owner can delete organization
  - Manager cannot delete organization
  - Member cannot add members
  - Non-member cannot access organization data

- [ ] **Subscription stacking**
  - User has personal Solo subscription
  - User gets assigned Enterprise license
  - User's effective features = Enterprise (highest)
  - Both subscriptions remain active

---

## Production Readiness

- [ ] **Database migrations**
  - All schema changes versioned in migrations
  - Migrations tested on staging before production
  - Rollback plan for each migration
  - No destructive migrations without backups

- [ ] **Environment configuration**
  - Production uses separate Stripe account (not test mode)
  - Production uses strong secret keys (not default/dev keys)
  - Production has CORS restricted to production domains
  - Production has rate limiting enabled

- [ ] **Backup & disaster recovery**
  - Daily database backups
  - Backups tested regularly (restore to staging)
  - Point-in-time recovery available (recommended)
  - Backup retention policy defined (30 days minimum)

- [ ] **Logging**
  - Application logs structured (JSON format recommended)
  - Logs include request ID for tracing
  - Sensitive data not logged (passwords, tokens, full card numbers)
  - Log retention policy defined

---

## Summary Score

**Fill this out after reviewing:**

| Category | Items | Checked ✅ | Missing ❌ | Partial ⚠️ | Score |
|----------|-------|-----------|-----------|-----------|-------|
| **Critical Security** | 35 | ___ | ___ | ___ | ___% |
| **High Priority** | 28 | ___ | ___ | ___ | ___% |
| **Medium Priority** | 23 | ___ | ___ | ___ | ___% |
| **Nice to Have** | 15 | ___ | ___ | ___ | ___% |
| **Testing** | 12 | ___ | ___ | ___ | ___% |
| **Production** | 12 | ___ | ___ | ___ | ___% |
| **TOTAL** | **125** | ___ | ___ | ___ | ___% |

**Production-ready threshold: 90%+ on Critical & High Priority**

---

## Next Steps

After completing this checklist:

1. **Document findings** - Create issues for each missing item
2. **Prioritize** - Focus on 🔴 Critical items first
3. **Implement fixes** - Work through each priority level
4. **Re-test** - Verify fixes with testing checklist
5. **Security audit** - Consider professional security audit before production
6. **Compliance** - Ensure GDPR, PSD2, PCI compliance if handling EU customers

---

**Document Version:** 1.0
**Date:** 2025-11-01
**Last Reviewed:** ___________
**Reviewed By:** ___________
**Next Review:** After critical fixes implemented
