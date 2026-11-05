# typing — 打字 / 填字训练

## 目标

让用户在「拼出来」的过程中记住英文表达，而不是只做再认。

- **填字模式**：展示英文句子，挖掉 1–3 个关键词；用户看中文提示补全。
- **整句打字**：只给中文，用户打出完整英文；错误时显示逐词差异，可继续修改。
- **即时反馈**：每个空单独校验，红色标错；全对自动进入答案与评分。
- **渐进提示**：首字母 → 前两个字母 → 显示答案（算「忘了」）。
- **FSRS 接入**：评分写入 `useProgressStore.recordReview`，`mode: 'typing'`；会话写入 `finishSession`。

## 文件边界

| 文件 | 职责 |
|------|------|
| `cloze.ts` | 纯逻辑：分词、选空、挖空、单词校验、渐进提示、评分建议 |
| `cloze.test.ts` | 纯逻辑单元测试（不渲染页面） |
| `sound.ts` | 键盘音效：按键分类、采样映射、Web Audio 加载与播放、预加载、设置页试听 |
| `sound.test.ts` | 按键分类与 press/release 采样映射测试 |
| `TypingPage.tsx` | 会话状态、键盘交互、渲染、调用 store |
| `index.ts` | 模块公共入口；`App.tsx` 只从这里导入 |

`cloze.ts` 不依赖 React、不访问存储、不调用 TTS。页面不重新实现挖空或判分规则。

## 打字音效

- 4 套 CC0 采样：`clicky`（默认）、`tactile`、`thock`、`typewriter`，位于 `public/sounds/`。
- 只在训练阶段的 `INPUT` / `TEXTAREA` 内发声；修饰键、输入法组合、长按 repeat 跳过。
- 设置页可开关、切换、调音量、试听；训练页顶栏有快速静音。
- 来源、许可证、开源项目调研和「为什么不用 TypingClub 素材」见 [`docs/SOUND.md`](../../../docs/SOUND.md)。

## 数据流

```
corpus card
  → buildCloze(primaryAnswer, seed)
  → ClozePrompt { tokens, blanks }
  → 用户填写 values
  → checkCloze(prompt, values)
  → solve / reveal
  → suggestTypingGrade(...)
  → recordReview({ mode: 'typing' })
```

## 扩展点

- **换挖空策略**：改 `buildCloze` 的候选词与打分规则，并在 `cloze.test.ts` 补用例。不要在页面里过滤词。
- **加词组填空**：扩展 `ClozeBlank` 为多 token 区间；`checkCloze` 改为按区间比较。
- **加听写模式**：复用 `matchAnswer` 和评分建议，在 `TypingPage` 增加一个 mode 分支；纯逻辑仍放本模块。
- **加新提示类型**：扩展 `maskWord` / `hintLevel`，同步更新评分建议测试。

## 已知限制

- 填字只针对 `primaryAnswer`，不使用 `acceptedAnswers` 的替代表达。
- 长句子最多挖 3 个空，避免一屏全是输入框。
- 提示次数只影响「建议评分」，用户仍可手动按 1–4 覆盖。
