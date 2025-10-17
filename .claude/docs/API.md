# API Integration

## Axios Configuration

- Base URL configured via `VITE_API_URL` and `VITE_PROTOCOL` environment variables
- JWT token automatically added to requests via `setupAxiosInterceptors()`
- Token format: `Bearer ${token}` (automatically prefixed if missing)
- Token expiry monitoring in `currentUser` store
- **IMPORTANT**: API version prefix `/api/v1/` is automatically added by axios interceptors

## Backend Integration

- Compatible with OCF Core Payment API (Stripe-based subscription system)
- API endpoints follow REST conventions (e.g., `/user-subscriptions/current`, `/invoices/user`)
- Error handling with user-friendly messages via store error states

## API Endpoint Guidelines

✅ **Correct**: Use relative paths without version prefix

```javascript
axios.get('/user-subscriptions/current')
axios.post('/terminals/start-session', data)
```

❌ **Incorrect**: Do NOT include `/api/v1/` prefix

```javascript
axios.get('/api/v1/user-subscriptions/current')  // WRONG - double prefix
```

**Exception**: Only use full URLs for external services or when bypassing interceptors

## Demo Mode System

### Environment Configuration

- Set `VITE_DEMO_MODE="true"` in `.env` to enable demo mode
- Demo mode provides mock data and simulated API responses
- Uses `isDemoMode()`, `simulateDelay()`, and `logDemoAction()` utilities

### Demo Services

- `demoConfig.ts` - Configuration and utilities
- `demoData.ts` - Static demo data (subscriptions, invoices, etc.)
- `demoPayments.ts` - Mock Stripe payment processing
- Each store method checks `isDemoMode()` and uses demo services accordingly

Enable demo mode for safe development without backend dependencies. All subscription/payment features work with realistic mock data and simulated delays.
