# features/tts

把一句英文变成可播放的音频。只负责「取音频」，不负责决定用哪个引擎——引擎选择在 `src/lib/speech.ts`。

## 文件

| 文件 | 职责 |
|------|------|
| `edge.ts` | Edge Read Aloud WebSocket 协议：v2 `Sec-MS-GEC` token、SSML、二进制帧解析、直连合成 |
| `cache.ts` | IndexedDB 音频缓存，key 为 `文本 + 音色` 的 hash，上限 600 条 |
| `index.ts` | 公共入口 `edgeAudioSource()`：先查缓存，未命中走代理或直连，成功后异步回写 |
| `edge.test.ts` | token、URL、SSML、消息、帧解析、缓存 key |

## 调用链

```
lib/speech.ts speak()
  → resolveEngine() 选择 edge
  → edgeAudioSource(text, voice, signal, proxyUrl)
      → cache.ts 命中 → data URL
      → 配置了代理 → POST ${proxy}/tts
      → 否则 edge.ts 直连（浏览器会被 403，仅作兜底实验）
  → <audio> 播放；语速用 playbackRate，不参与缓存 key
```

失败时 `speech.ts` 依次回退百度 / Google / 系统音色。

## 本地代理

浏览器不能自定义 WebSocket 的 `Origin` / `User-Agent`，微软握手校验会返回 403。`scripts/edge-tts-proxy.mjs` 用 Node `ws` 补齐 Edge 头后转发：

```bash
npm run tts:proxy        # 默认 http://127.0.0.1:8787
```

设置页「Edge 代理地址」填这个地址即可。协议、部署到 Cloudflare Worker 的注意事项见 `docs/TTS.md`。

## 边界

- 不在这里做额度统计、音色选择 UI、批量预生成；这些属于后续 provider 层 / 设置页。
- 不把 token 打日志；代理脚本从 `edge.ts` 读取 token，不额外保存。
- Edge 是非官方接口，随时可能变；新增 Azure / Kokoro 时保持 `index.ts` 的入口形状不变。
