import { describe, expect, it } from 'vitest'
import { webSocketAuthProtocols } from '../../src/utils/webSocketAuth'

describe('webSocketAuthProtocols', () => {
  it('offers the token next to the protocol name', () => {
    expect(webSocketAuthProtocols('a.b.c')).toEqual(['ocf.bearer', 'a.b.c'])
  })

  it.each([undefined, null, ''])('offers no protocol without a token (%s)', (token) => {
    expect(webSocketAuthProtocols(token)).toEqual([])
  })
})
