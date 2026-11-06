# speaking 口语反应评测

训练页的「真开口」数据层：麦克风录音、音量采样、首词延迟和停顿统计。第一版只做本地音频分析，不上传录音，也不做语音转写。

## 边界

- `analysis.ts`：纯函数，输入音量帧，输出人声段和指标。不依赖浏览器 API，可直接单测。
- `recorder.ts`：浏览器层，负责 `getUserMedia`、`AudioContext`、`MediaRecorder` 和采样定时器。
- 不读写 store；是否持久化由页面/后续模块决定。
- 不做语音识别、不生成文字稿；后续可把 Whisper 转写作为独立模块接进来。

## 数据流

1. 用户在设置里开启「口语反应评测」。
2. 训练页开始一组前创建一次 `SpeakingRecorder`，整组复用，避免每张卡重新申请麦克风。
3. 卡片出现时 `start()`，每 50ms 采一帧 RMS。
4. 揭示答案时 `stop()`，拿到音量帧和回放 Blob。
5. `analyzeSpeech()` 找第一段人声、停顿和说话时长。
6. 首词延迟 = `recording.startedAt + analysis.speechStartMs - 卡片出现时间`。
7. 本组结算用 `summarizeSpeaking()` 汇总中位数。

## 指标口径

- **首词延迟**：从卡片渲染到第一个有效人声帧。不是“按揭示”的时间。
- **说话时长**：第一段人声起点到最后一段终点的跨度。
- **停顿**：两段人声之间 ≥ 300ms 的间隔数量；短的换气不计数。
- **噪声判断**：以整段音量 10 分位为噪声底，阈值 = max(0.012, 噪声底 × 3)；短于 100ms 的脉冲丢弃。

## 扩展点

- 接本地 Whisper：把 `SpeakingRecording.blob` 送进转写模块，补词级差异和填充词统计。
- 发音评分：在转写/音素对齐后增加 OpenPronounce 一类的评分，不要把评分逻辑塞进 `analysis.ts`。
- 持久化：把 `SpeakingMetrics` 写进 progress store 时新增可选字段，保持旧备份可导入。
- 跟读模式：可以复用同一个 recorder，只替换参考音频和对比规则。
