/**
 * 本地 Edge TTS 代理（仅个人学习使用）。
 *
 * 浏览器不能自定义 WebSocket 的 Origin/User-Agent，而微软的 Read Aloud
 * 合成通道会校验这些握手头，所以纯前端直连会 403。这个脚本用 Node + ws
 * 加上 Edge 的握手头，把音频以 HTTP 返回给网页。
 *
 * 用法：
 *   npm run tts:proxy
 *   # 默认 http://127.0.0.1:8787
 *   # 然后在设置页把「Edge 代理地址」填成这个地址
 *
 * 部署到 GitHub Pages 后，本机代理只对本机浏览器有效；如果要在任意设备
 * 使用，需要把同样的逻辑部署到 Cloudflare Worker 等免费服务。
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'
import { WebSocket } from 'ws'

const SOURCE = new URL('../src/features/tts/edge.ts', import.meta.url)
const TOKEN = readFileSync(SOURCE, 'utf8').match(/TRUSTED_CLIENT_TOKEN = '([^']+)'/)?.[1]
if (!TOKEN) {
  console.error('无法从 src/features/tts/edge.ts 读取 Edge token')
  process.exit(1)
}

const PORT = Number(process.env.EDGE_TTS_PORT || 8787)
const HOST = process.env.EDGE_TTS_HOST || '127.0.0.1'
const WSS_URL = 'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1'
const GEC_VERSION = '2-155.0.4283.45'
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'
const WIN_EPOCH_OFFSET = 11644473600
const GEC_PREFIX = 'Copyright (C) Microsoft Corporation. All rights reserved.'
const MAX_TEXT = 2000

const HEADERS = {
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  'Accept-Language': 'en-US,en;q=0.9',
}

function rol16(value) {
  return ((value << 16) | (value >>> 16)) >>> 0
}

function toWords(bytes) {
  const padded = Buffer.alloc(Math.ceil(bytes.length / 8) * 8)
  Buffer.from(bytes).copy(padded)
  const words = []
  for (let index = 0; index < padded.length; index += 4) words.push(padded.readUInt32LE(index))
  return words
}

function toHex(bytes) {
  return Buffer.from(bytes).toString('hex').toUpperCase()
}

function cs64WordSwap(words, a, b) {
  let acc = 0
  let last = 0
  for (let index = 0; index < words.length; index += 2) {
    const x = words[index]
    const y = words[index + 1]
    let t = rol16((Math.imul(rol16(x), 0xef0569fb) + Math.imul(x, a)) >>> 0)
    let q = Math.imul(t, 0x76f50f34) >>> 0
    acc = (acc + Math.imul(rol16(q), 0xc3efea97) + q) >>> 0
    t = rol16((Math.imul(rol16(y), 0xc31713db) + Math.imul(y, b)) >>> 0)
    q = Math.imul(t, 0x1881ce3c) >>> 0
    last = (Math.imul(rol16(q), 0x35bd1ec9) + q) >>> 0
    acc = (acc + last) >>> 0
  }
  return [last, acc]
}

function cs64Reversible(words, a, b) {
  let state = 0
  let acc = 0
  for (let index = 0; index < words.length; index += 2) {
    state = Math.imul(state + words[index], a) >>> 0
    for (const constant of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
      state = Math.imul(rol16(state), constant) >>> 0
    }
    let t = Math.imul(words[index + 1] + state, b) >>> 0
    t = Math.imul(rol16(t), 0xa27416f5) >>> 0
    t = rol16(Math.imul(rol16(t), 0xd38396ff) >>> 0)
    acc = (acc + state) >>> 0
    state = Math.imul(rol16(Math.imul(t, 0x7c932b89) >>> 0), 0xbfa49f69) >>> 0
    acc = (acc + state) >>> 0
  }
  return [state, acc]
}

async function generateSecMsGec() {
  let ticks = Math.floor(Date.now() / 1000)
  ticks += WIN_EPOCH_OFFSET
  ticks -= ticks % 300
  ticks *= 10000000
  const prefix = Buffer.from(GEC_PREFIX, 'utf8')
  const suffix = Buffer.from(`${ticks.toFixed(0)}${TOKEN}`, 'utf8')
  const data = Buffer.concat([prefix, suffix])
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', data),
  )
  const words = toWords(data)
  const [key0, key1] = toWords(digest)
  const a = (key0 | 1) >>> 0
  const b = (key1 | 1) >>> 0
  const [s0, s1] = cs64WordSwap(words, a, b)
  const [r0, r1] = cs64Reversible(words, a, b)
  const cs64 = Buffer.alloc(8)
  cs64.writeUInt32LE((s0 ^ r0) >>> 0, 0)
  cs64.writeUInt32LE((s1 ^ r1) >>> 0, 4)
  return `${toHex(cs64)}-${toHex(digest)}`
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => {
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '&') return '&amp;'
    if (char === "'") return '&apos;'
    return '&quot;'
  })
}

function configMessage() {
  const body = JSON.stringify({
    context: {
      synthesis: {
        audio: {
          metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
          outputFormat: OUTPUT_FORMAT,
        },
      },
    },
  })
  return `X-Timestamp:${new Date().toString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${body}`
}

function ssmlMessage(text, voice, requestId) {
  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${escapeXml(voice)}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>` +
    `${escapeXml(text)}</prosody></voice></speak>`
  return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toString()}\r\nPath:ssml\r\n\r\n${ssml}`
}

function parseAudioFrame(buffer) {
  if (buffer.length < 2) return null
  const headerLength = buffer.readUInt16BE(0)
  if (buffer.length < 2 + headerLength) return null
  const header = buffer.subarray(2, 2 + headerLength).toString()
  if (!header.includes('Path:audio')) return null
  return buffer.subarray(2 + headerLength)
}

async function synthesize(text, voice) {
  const clean = String(text || '').trim()
  if (!clean) throw new Error('empty text')
  if (clean.length > MAX_TEXT) throw new Error(`text too long (max ${MAX_TEXT})`)
  if (!/^[A-Za-z-]{2,}-[A-Za-z]{2,}Neural$/.test(voice)) throw new Error('invalid voice')

  const gec = await generateSecMsGec()
  const connectionId = randomBytes(16).toString('hex')
  const url = `${WSS_URL}?Ocp-Apim-Subscription-Key=${encodeURIComponent(TOKEN)}&Sec-MS-GEC=${encodeURIComponent(gec)}&Sec-MS-GEC-Version=${GEC_VERSION}&ConnectionId=${connectionId}`

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, { headers: HEADERS })
    const chunks = []
    let settled = false
    let idle = null
    const timeout = setTimeout(() => finish(new Error('edge timeout')), 20000)

    const finish = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (idle) clearTimeout(idle)
      try {
        socket.close()
      } catch {
        // ignore
      }
      if (error) reject(error)
      else if (!chunks.length) reject(new Error('no audio'))
      else resolve(Buffer.concat(chunks))
    }

    const armIdle = () => {
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => finish(), 1500)
    }

    socket.on('open', () => {
      socket.send(configMessage())
      socket.send(ssmlMessage(clean, voice, randomUUID().replace(/-/g, '')))
    })

    socket.on('message', (data, isBinary) => {
      const buffer = Buffer.from(data)
      if (!isBinary) {
        const textMessage = buffer.toString()
        if (textMessage.includes('Path:turn.end')) finish()
        return
      }
      const audio = parseAudioFrame(buffer)
      if (audio && audio.length) {
        chunks.push(audio)
        armIdle()
      }
    })

    socket.on('error', (error) => finish(error))
    socket.on('close', () => {
      if (!settled && chunks.length) finish()
    })
  })
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }))
    return
  }
  if (request.method !== 'POST' || request.url !== '/tts') {
    response.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'not found' }))
    return
  }

  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 64 * 1024) {
      response.writeHead(413).end()
      return
    }
  }

  try {
    const startedAt = Date.now()
    const payload = JSON.parse(body)
    const audio = await synthesize(payload.text, payload.voice || 'en-US-AriaNeural')
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=604800',
      'Content-Length': audio.length,
    })
    response.end(audio)
    console.log(`POST /tts 200 ${audio.length}B ${Date.now() - startedAt}ms`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'tts failed'
    console.warn('[edge-tts-proxy]', message)
    response.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: message }))
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Edge TTS proxy: http://${HOST}:${PORT}`)
  console.log('在设置页把「Edge 代理地址」填成上面的地址。仅个人学习使用。')
})
