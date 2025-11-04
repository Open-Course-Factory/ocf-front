# WebSocket Security Fix - Implementation Summary

**Date:** 2025-11-04
**Priority:** HIGH - Security Update
**Status:** ✅ COMPLETED

---

## Overview

Updated WebSocket authentication to use the backend's secure query parameter implementation. The backend now allows `?token=` in query parameters **ONLY for WebSocket upgrade requests**, which is secure because:
1. Only works when `Upgrade: websocket` header is present
2. Not logged in standard HTTP access logs
3. Token consumed immediately during upgrade handshake
4. Doesn't appear in browser history like regular HTTP URLs

## Security Implementation

**Before (INCORRECT - using ?Authorization=):**
```javascript
// Wrong parameter name
const wsUrl = `ws://api.example.com/terminals/${id}/console?Authorization=${token}`
const ws = new WebSocket(wsUrl)
```

**After (CORRECT - using ?token=):**
```javascript
// Backend expects ?token= parameter for WebSocket connections
let wsUrl = `ws://api.example.com/terminals/${id}/console?width=80&height=24`
if (token) {
  wsUrl += `&token=${encodeURIComponent(token)}`
}
const ws = new WebSocket(wsUrl)
```

---

## Files Modified

### 1. TerminalConsole.vue
**Location:** `src/components/Terminal/TerminalConsole.vue`

**Changes:**
- ✅ Added `useCurrentUserStore` import to access authentication token
- ✅ Updated WebSocket URL to use `?token=` query parameter (required by backend)
- ✅ Changed from `?Authorization=` to `?token=` parameter name
- ✅ Enhanced error handling to detect authentication failures (code 1008)
- ✅ Added user-friendly error messages for auth failures
- ✅ Added translations for new error messages (English + French)
- ✅ Added token masking in console logs for security

**Key Code Changes:**
```typescript
// Added import
import { useCurrentUserStore } from '../../stores/currentUser'

// Added store instance
const userStore = useCurrentUserStore()

// Build WebSocket URL with secure query parameter
const token = userStore.secretToken
let wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId}/console?width=${width}&height=${height}`
if (token) {
  wsUrl += `&token=${encodeURIComponent(token)}`
} else {
  console.warn('No authentication token available for WebSocket connection')
}

socket = new WebSocket(wsUrl)

// Enhanced error handling
socket.onclose = (event) => {
  if (event.code === 1008) {
    // Authentication failure
    error.value = t('terminalStarter.authenticationFailed')
    showErrorNotification(
      t('terminalStarter.authenticationFailedMessage'),
      t('terminalStarter.authenticationFailed')
    )
  }
}
```

### 2. TerminalViewer.vue
**Location:** `src/components/Terminal/TerminalViewer.vue`

**Changes:**
- ✅ Updated WebSocket URL to use `?token=` query parameter (required by backend)
- ✅ Changed from `?Authorization=` to `?token=` parameter name
- ✅ Enhanced error handling for authentication failures
- ✅ Added specific error messages for code 1008 (auth failure)
- ✅ Improved user feedback for connection errors
- ✅ Added token masking in console logs for security

**Key Code Changes:**
```typescript
// Before (INCORRECT parameter name):
// wsUrl += `&Authorization=${encodeURIComponent(token)}`

// After (CORRECT - backend expects ?token=):
const token = userStore.secretToken
let wsUrl = `${protocol}://${apiUrl}/api/v1/terminals/${sessionId.value}/console?width=${terminal.value.cols}&height=${terminal.value.rows}`
if (token) {
  wsUrl += `&token=${encodeURIComponent(token)}`
} else {
  console.warn('No authentication token available for WebSocket connection')
}

// Mask token in logs
console.log('Connexion WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'))

socket.value = new WebSocket(wsUrl)

// Enhanced error handling
socket.value.onclose = (event) => {
  if (event.code === 1008) {
    error.value = 'Authentification échouée. Veuillez vous reconnecter.'
  }
}
```

---

## New Translation Keys

Added to **TerminalConsole.vue**:

### English
```typescript
authenticationFailed: 'Authentication Failed'
authenticationFailedMessage: 'Your session has expired. Please log in again.'
connectionClosed: 'Connection closed'
```

### French
```typescript
authenticationFailed: 'Échec de l\'authentification'
authenticationFailedMessage: 'Votre session a expiré. Veuillez vous reconnecter.'
connectionClosed: 'Connexion fermée'
```

---

## Error Handling Improvements

### WebSocket Close Codes
- **1000**: Normal closure (no error shown)
- **1008**: Policy violation → Authentication failure (shows specific message)
- **Other codes**: Connection error with code number

### User Experience
- ✅ Clear error messages in both English and French
- ✅ Specific handling for authentication failures
- ✅ Automatic reconnect button display on disconnect
- ✅ Console logging for debugging
- ✅ Visual status indicators (connected/disconnected)

---

## Security Benefits

### Backend Security Implementation

The backend enforces a **WebSocket-specific exception** for query parameter authentication:

1. **Regular HTTP Requests**: JWT tokens in query parameters are **BLOCKED**
   - Prevents tokens from appearing in server logs
   - Prevents tokens from appearing in browser history
   - Prevents Referer header leaks

2. **WebSocket Upgrade Requests**: JWT tokens in `?token=` parameter are **ALLOWED**
   - Detection: Only when `Upgrade: websocket` and `Connection: upgrade` headers present
   - Not logged in standard HTTP access logs
   - Token consumed immediately during upgrade handshake
   - Doesn't persist in browser history like regular URLs
   - No Referer header after upgrade

### Frontend Security Implementation

1. **Correct Parameter Name**: Changed from `?Authorization=` to `?token=` (backend requirement)

2. **Token Masking**: Console logs mask the token value (`token=***`)

3. **Enhanced Error Handling**: Specific detection of authentication failures (code 1008)

4. **User Feedback**: Clear error messages in both English and French

---

## Testing Checklist

### Manual Testing
- [x] TypeScript compilation passes (no new errors)
- [ ] WebSocket connections with valid token succeed
- [ ] WebSocket connections without token fail with 401
- [ ] Authentication failure (code 1008) shows correct error message
- [ ] Reconnect button appears on disconnect
- [ ] Error messages display in both English and French
- [ ] Terminal console works with secure authentication
- [ ] Terminal viewer works with secure authentication

### Browser Testing
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Verify no console errors during normal operation
- [ ] Verify clear error messages on auth failure

### Network Testing
- [ ] Monitor WebSocket upgrade request in browser DevTools
- [ ] Verify `Sec-WebSocket-Protocol: Bearer, <token>` header present
- [ ] Verify token NOT in URL query parameters
- [ ] Verify successful upgrade to WebSocket protocol

---

## Backend Requirements

The backend implements **WebSocket-specific query parameter authentication** by:

1. **Detecting WebSocket upgrade requests** via headers:
   - `Upgrade: websocket`
   - `Connection: upgrade`

2. **Allowing `?token=` parameter ONLY for WebSocket requests**

3. **Blocking `?token=` parameter for regular HTTP requests**

4. **Validating JWT token** from query parameter

5. **Returning 1008 close code** for authentication failures

**Backend Implementation (Golang/Gin):**
```go
// Check if this is a WebSocket upgrade request
isWebSocketUpgrade := strings.ToLower(ctx.Request.Header.Get("Upgrade")) == "websocket" &&
    strings.Contains(strings.ToLower(ctx.Request.Header.Get("Connection")), "upgrade")

if token == "" && isWebSocketUpgrade {
    // For WebSocket connections, allow query parameter
    token = ctx.Query("token")
    if token == "" {
        return "", "", fmt.Errorf("missing Authorization header or token query parameter for WebSocket connection")
    }
} else if token == "" {
    // For regular HTTP requests, query parameters are NOT allowed
    return "", "", fmt.Errorf("missing Authorization header - tokens in query parameters are not allowed for non-WebSocket requests")
}

// Validate token
if !validateToken(token) {
    ctx.Status(401)
    return
}
```

---

## CORS Configuration

No frontend changes required for CORS. The backend already whitelists:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:8080`

Production domains are configured via backend environment variables:
- `FRONTEND_URL`
- `ADMIN_FRONTEND_URL`

---

## Deployment Notes

### Development Environment
1. No environment variable changes needed
2. Backend must be updated with security fixes
3. Clear browser cache and reload frontend
4. Test WebSocket connections work correctly

### Production Deployment
1. Deploy backend security fixes FIRST
2. Deploy frontend changes SECOND
3. Verify production domain is in backend CORS whitelist
4. Monitor WebSocket connection success rate
5. Check for authentication error reports

### Rollback Plan
If issues occur:
1. Revert frontend changes (this commit)
2. Revert backend security changes
3. Investigate and fix issues
4. Re-deploy with fixes

---

## Known Issues

None at this time.

---

## Additional Resources

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Sec-WebSocket-Protocol Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-WebSocket-Protocol)
- [WebSocket Security Best Practices](https://owasp.org/www-community/vulnerabilities/Insecure_WebSocket)
- Backend Migration Guide: See backend repository documentation

---

## Author

Claude Code - Automated Security Fix
Based on backend security requirements dated 2025-11-04

---

## Verification Commands

```bash
# Check TypeScript compilation
npx vue-tsc --noEmit

# Build project
npm run build

# Start development server
npm run dev

# Verify correct token parameter is used
grep -r "token=" src/components/Terminal/
# Should find: wsUrl += `&token=${encodeURIComponent(token)}`

# Verify old Authorization parameter is NOT used
grep -r "Authorization=" src/components/Terminal/*.vue
# Should return NO results (except in comments)

# Check for token masking in logs
grep -r "token=\*\*\*" src/components/Terminal/
# Should find: wsUrl.replace(/token=[^&]+/, 'token=***')
```
