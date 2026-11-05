# TTS 方案调研（免费 / 可薅羊毛优先）

> 目标：让训练里的英文更自然，同时尽量不花钱。约束是纯静态 GitHub Pages、无后端、移动端也要能用。
> 价格与免费额度会变，接入前以官方价格页为准。

## 1. 结论先说

按「零成本 → 免费额度 → 完全离线」排序，推荐三层：

1. **默认层：Edge 浏览器内置 Natural 音色（免费、无 key）**
   - 通过标准 Web Speech API 使用 `Microsoft Aria/Jenny/Guy Online (Natural)` 等音色。
   - 不花钱、不用后端、延迟低，桌面 Edge 上自然度明显好于 Chrome 默认音色。
   - 现有 `lib/speech.ts` 已经会优先挑 natural/neural/online 音色；设置页已支持固定系统音色。逆向通道另有一套 Edge 音色选择器，见第 3 节。
2. **免费额度层：Azure F0 + Google Cloud TTS 免费额度（质量更稳，需要 key）**
   - Azure AI Speech F0：Neural TTS **50 万字符/月**免费，英文 neural 音色质量稳定，适合作为主在线音色。
   - Google Cloud TTS：Standard **400 万字符/月**、WaveNet/Neural2 **约 100 万字符/月**免费（以官方价格页为准）；Chirp 3 HD 质量更好但免费额度更紧。
   - 关键：**不要把共享 key 写进前端**。要么让用户填自己的 key（存 IndexedDB），要么用 Cloudflare Worker 之类做一层免费代理。
3. **无限量/离线层：Kokoro-82M（Apache-2.0）**
   - `kokoro-js` 在浏览器里跑，WebGPU 优先、WASM 兜底；q8 量化约 86MB，首次下载后缓存。
   - 英文音色 `af_heart`、`af_bella` 评价很好；完全免费、无字数限制、隐私好。
   - 代价：首次加载大、移动端/老设备慢；适合作为「下载高质量离线音色」的可选开关，而不是默认。
   - 低端设备可退化到 Piper（MIT，模型更小、更快，自然度略低）。

> **已落地（2026-11）**：按用户要求接入了非官方 Edge Read Aloud WebSocket，作为可选引擎「在线 · Edge Natural」。它免费、音色自然，但属于逆向接口，随时可能失效，也有 ToS 风险，只适合个人学习，不要当作稳定服务承诺。设置里选「自动」时，系统有自然英文音色仍优先用系统；没有时，**配置了 Edge 代理才走 Edge**，否则用百度/Google，最后回退系统音色。实现见 `src/features/tts/`，本地代理见 `scripts/edge-tts-proxy.mjs`。

浏览器标准 Web Speech API 在桌面 Edge 上也能拿到 Natural 音色，且没有接口失效风险；如果不想维护逆向通道，优先用它。

## 2. 候选对比

| 方案 | 自然度 | 免费额度 | 成本 | 接入方式 | 适合度 |
|------|--------|----------|------|----------|--------|
| Edge / Windows Natural voices | 高 | 无限制（浏览器能力） | ¥0 | Web Speech API | ★★★★★ 默认首选 |
| Azure AI Speech Neural | 很高 | F0 50 万字符/月 | 超出按字符计费 | REST / SDK，需要 key | ★★★★★ 免费额度主选 |
| Google Cloud TTS (WaveNet/Neural2/Chirp 3 HD) | 很高 | 约 100 万字符/月（WaveNet/Neural2）；Standard 400 万 | 超出按字符计费 | REST，需要 key | ★★★★☆ 备用 |
| ElevenLabs | 最高一档 | Free 1 万 credits/月 | $6 起 | REST，需要 key | ★★★☆☆ 免费额度少、Free 无商用授权 |
| Cartesia Sonic | 很高、低延迟 | Free 2 万 credits/月（约 27 分钟） | $5 起 | REST/WebSocket | ★★★☆☆ 额度小，适合短句 |
| Kokoro-82M（浏览器本地） | 高 | 无限 | ¥0 | `kokoro-js` + ONNX | ★★★★☆ 离线/重度用户 |
| Piper（浏览器本地） | 中高 | 无限 | ¥0 | WASM | ★★★☆☆ 低端设备兜底 |
| OpenAI gpt-4o-mini-tts | 很高 | 无免费额度 | 约 $0.015/分钟 | REST，需要 key | ★★☆☆☆ 不符合免费优先 |
| 火山引擎 / 腾讯云 / 阿里云 / 讯飞 | 中文强，英文参差 | 新用户试用包/月度额度 | 按字符计费 | REST/SDK，需要实名 | ★★☆☆☆ 国内可用，但英文不是强项 |

## 3. 已接入：Edge 逆向 + 本地代理

### 3.1 为什么需要代理

Edge Read Aloud 的 WebSocket 端点会校验握手来源：

- 端点：`wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1`
- 必须携带 `Ocp-Apim-Subscription-Key`（公开的 Edge token）、`Sec-MS-GEC` / `Sec-MS-GEC-Version`（v2 token，5 分钟有效）
- 微软还会按 `Origin` / `User-Agent` 判断是不是 Edge 扩展发起的连接

浏览器页面**不能自定义** WebSocket 的 `Origin` 和 `User-Agent`，所以纯前端直连稳定返回 403。这不是 token 算错：同一套 v2 token 用 Node `ws` 带 Edge 头请求就能拿到音频。

### 3.2 使用方式

```bash
cd web
npm run tts:proxy          # 默认 http://127.0.0.1:8787
```

然后在设置页：

1. 发音引擎选「在线 · Edge Natural」；
2. 「Edge 代理地址」填 `http://127.0.0.1:8787`；
3. 点「试听当前」。

代理只做三件事：转发 SSML、补上 Edge 的握手头、把返回的 MP3 交给页面。它不保存文本和音频，也不上传任何数据。合成结果会按 `文本 + 音色` 缓存在本地 IndexedDB，同一句只请求一次；语速不参与缓存 key，播放时用 `playbackRate` 复用。

### 3.3 实现要点

- v2 token：57 字节固定前缀 + 5 分钟取整的 Windows FILETIME ticks + token，SHA-256 后做 CS64 wordSwap/reversible 混淆；已用 Python `edge-tts` 7.3.0 生成参考值做过程序化对照。
- 帧格式：文本帧是 `Path:...` 头 + `speech.config` / `ssml`；二进制帧前 2 字节为大端 header 长度，之后是音频数据。
- 结束条件：收到 `turn.end` 或音频流空闲 1.5 秒；整个请求 20 秒超时。
- 失败自动回退：代理不可用 → 百度 / Google 在线音色 → 系统音色，不会把用户留在静音里。
- 音频缓存上限 600 条，超出按 `updatedAt` 清理；设置页可清空。

### 3.4 可选：部署到 Cloudflare Worker

如果希望手机 / 其他设备也能用，而不想在本机开代理，可以把 `scripts/edge-tts-proxy.mjs` 的转发逻辑搬到 Cloudflare Worker（免费额度足够个人使用），然后把 Worker 地址填进「Edge 代理地址」。注意：

- Worker 同样暴露一个无鉴权的合成端点，建议加一个只有自己知道的路径或简单 token，避免被人白嫖；
- 微软随时可能改协议，代理和前端要一起升级；
- 不要把 Edge token 打进公开仓库的构建产物之外的地方，也不要对外宣称这是官方接口。

## 4. 推荐架构（后续扩展）

```
features/tts/
├── index.ts            # 公共入口：edgeAudioSource / 清缓存
├── edge.ts             # v2 token、SSML、WebSocket 合成
├── cache.ts            # IndexedDB 音频缓存（600 条上限）
└── edge.test.ts        # token 格式、SSML、帧解析、缓存 key
```

`lib/speech.ts` 负责引擎选择与播放（browser / edge / 百度 / Google / 有道），`features/tts` 只负责「把一句话变成可播放的 URL」。后续加 Azure / Kokoro 时按同样方式新增 provider 文件，在 `speech.ts` 的 `resolveEngine` 里挂进去即可。

「薅羊毛」的关键不是反复注册，而是**缓存 + 批量预生成**：

1. 以 `hash(text + voice + engine + rate)` 为 key，把音频 Blob 存 IndexedDB；同一句永远只请求一次。
2. 每天开始训练时，把当天队列里的句子批量预生成（低优先级、串行、失败重试），用户点播放时通常已经在缓存里。
3. 设置页显示本月免费额度用量（字符数），快用完时自动降级到 Edge Natural。
4. 免费额度只用在「高价值句子」：剧情关键台词、汇报模板、错题；词汇卡优先用浏览器音色。
5. 用户自己的 key 存在本地，导出备份时默认排除 key。

## 5. 安全与合规

- **共享 key 绝不能进前端 bundle**。静态站点没有秘密；必须走代理（Cloudflare Worker 免费额度够个人用）或让用户自带 key。
- 现有 `baidu` / `google` 在线音色走的是公开翻译接口，属于非正式接口，适合个人学习，不适合宣称稳定服务；正式化时应换成官方 API。
- ElevenLabs Free 不允许商用；本项目个人学习没问题，若要公开发布/收费，需要付费计划或换 Azure/Kokoro。
- Kokoro 权重 Apache-2.0，Piper 代码 MIT；具体音色还要看各自模型卡。

## 6. 建议的落地顺序

1. **已做**：Edge 逆向通道 + Edge 音色选择器 + 试听 + IndexedDB 音频缓存。
2. **下一步**：缓存用量可视化、批量预生成当天队列、按音色对比试听。
3. **可选**：Azure F0 接入（用户自带 key 或 Worker 代理），作为「高质量在线」。
4. **可选**：Kokoro 本地音色包（桌面 WebGPU），作为「离线无限量」。
5. 最后才考虑 ElevenLabs/Cartesia 这类额度小但音质顶级的服务，用在少量关键句。

## 7. 参考

- Azure AI Speech 定价（F0 Neural TTS 50 万字符/月）：<https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/>
- Google Cloud Text-to-Speech 定价：<https://cloud.google.com/text-to-speech/pricing>
- ElevenLabs 定价（Free 1 万 credits/月，Free 无商用）：<https://elevenlabs.io/pricing>
- Cartesia 定价（Free 2 万 credits/月）：<https://cartesia.ai/pricing>
- Kokoro-82M 模型卡（Apache-2.0）：<https://huggingface.co/hexgrad/Kokoro-82M>
- Kokoro 浏览器实现参考：<https://github.com/rhulha/StreamingKokoroJS>
- Piper vs Kokoro 对比（2026，编辑评测而非盲测）：<https://olud.ai/vs/piper-vs-kokoro.html>
- 2026 免费开源 TTS 对比：<https://www.17you.com/freeresources/free-open-source-tts-2026>
