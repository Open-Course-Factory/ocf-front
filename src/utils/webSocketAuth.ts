/**
 * The subprotocols that carry an access token on a new WebSocket: browsers
 * cannot set any other header on one, and a token in the URL ends up in access
 * logs. ocf-core reads it from there and echoes only the protocol name, so the
 * name must match WebSocketAuthProtocol in src/auth/casdoor/jwtResolver.go.
 */
export function webSocketAuthProtocols(token: string | null | undefined): string[] {
  return token ? ['ocf.bearer', token] : []
}

/**
 * The ws:// or wss:// URL of an ocf-core API path ("/scenario-sessions/x/agent"),
 * on the host the HTTP API is served from.
 */
export function apiWebSocketUrl(path: string): string {
  const protocol = import.meta.env.VITE_PROTOCOL === 'https' ? 'wss' : 'ws'
  return `${protocol}://${import.meta.env.VITE_API_URL}/api/v1${path}`
}
