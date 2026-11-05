import { describe, expect, it } from 'vitest'
import {
  buildEdgeSsml,
  buildSpeechConfig,
  buildSsmlMessage,
  edgeSocketUrl,
  escapeXml,
  generateSecMsGec,
  parseEdgeBinaryFrame,
} from './edge'
import { edgeCacheKey } from './cache'

describe('Edge TTS protocol helpers', () => {
  it('generates a stable uppercase v2 Sec-MS-GEC for the same 5-minute window', async () => {
    const left = await generateSecMsGec(1_700_000_000_000)
    const right = await generateSecMsGec(1_700_000_000_000 + 60_000)
    expect(left).toMatch(/^[A-F0-9]{16}-[A-F0-9]{64}$/)
    expect(right).toBe(left)
    const nextWindow = await generateSecMsGec(1_700_000_000_000 + 6 * 60_000)
    expect(nextWindow).not.toBe(left)
  })

  it('builds the websocket URL with the required parameters', () => {
    const url = edgeSocketUrl('ABC123', 'connection-1')
    expect(url).toContain('Ocp-Apim-Subscription-Key=')
    expect(url).toContain('Sec-MS-GEC=ABC123')
    expect(url).toContain('Sec-MS-GEC-Version=2-155.0.4283.45')
    expect(url).toContain('ConnectionId=connection-1')
    expect(url.startsWith('wss://api.msedgeservices.com/')).toBe(true)
  })

  it('escapes SSML text and builds a valid prosody envelope', () => {
    expect(escapeXml(`<tag> & "quotes" 'apostrophe'`)).toBe(
      '&lt;tag&gt; &amp; &quot;quotes&quot; &apos;apostrophe&apos;',
    )
    const ssml = buildEdgeSsml('Ship it & <ship>', 'en-US-AriaNeural')
    expect(ssml).toContain("<voice name='en-US-AriaNeural'>")
    expect(ssml).toContain('Ship it &amp; &lt;ship&gt;')
    expect(ssml).toContain("rate='+0%'")
  })

  it('builds the speech.config and SSML messages with headers', () => {
    const config = buildSpeechConfig()
    expect(config).toContain('Path:speech.config')
    expect(config).toContain('audio-24khz-48kbitrate-mono-mp3')
    expect(config).toContain('"wordBoundaryEnabled":"false"')

    const message = buildSsmlMessage('Hello', 'en-US-GuyNeural', 'req-1', new Date('2026-01-01T00:00:00Z'))
    expect(message).toContain('X-RequestId:req-1')
    expect(message).toContain('Path:ssml')
    expect(message).toContain("voice name='en-US-GuyNeural'")
    expect(message).toContain('Hello')
  })

  it('parses a binary audio frame and ignores non-audio frames', () => {
    const header = new TextEncoder().encode('X-RequestId:1\r\nPath:audio\r\n')
    const audio = new Uint8Array([1, 2, 3, 4])
    const frame = new Uint8Array(2 + header.length + audio.length)
    new DataView(frame.buffer).setUint16(0, header.length)
    frame.set(header, 2)
    frame.set(audio, 2 + header.length)

    expect(Array.from(parseEdgeBinaryFrame(frame.buffer) ?? [])).toEqual([1, 2, 3, 4])

    const otherHeader = new TextEncoder().encode('Path:turn.end\r\n')
    const other = new Uint8Array(2 + otherHeader.length)
    new DataView(other.buffer).setUint16(0, otherHeader.length)
    other.set(otherHeader, 2)
    expect(parseEdgeBinaryFrame(other.buffer)).toBeNull()
  })

  it('keeps cache keys stable across whitespace and case', () => {
    expect(edgeCacheKey('  Still on it. ', 'en-US-AriaNeural')).toBe(
      edgeCacheKey('still on it.', 'en-US-AriaNeural'),
    )
    expect(edgeCacheKey('Still on it.', 'en-US-AriaNeural')).not.toBe(
      edgeCacheKey('Still on it.', 'en-US-GuyNeural'),
    )
  })
})
