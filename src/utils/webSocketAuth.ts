/**
 * The subprotocols that carry an access token on a new WebSocket: browsers
 * cannot set any other header on one, and a token in the URL ends up in access
 * logs. ocf-core reads it from there and echoes only the protocol name, so the
 * name must match WebSocketAuthProtocol in src/auth/casdoor/jwtResolver.go.
 */
export function webSocketAuthProtocols(token: string | null | undefined): string[] {
  return token ? ['ocf.bearer', token] : []
}
