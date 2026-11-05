# 反射英语 · Web Trainer

把本仓库的 Markdown 语料变成一个可安装的英语反射训练应用：看到中文工作场景，限时说出地道英文，用间隔重复把「想起来」练成「脱口而出」。

- 在线体验：<https://0x1428571429.github.io/English-for-Software-Product-Development/>
- 语料来源：仓库根目录 `frontend-engineer/` 与 `scripts/dialogue_data.json`

## 训练方式

1. **限时反射训练（中 → 英）**：默认 5 秒倒计时，先开口再揭示；记录每题反应时间，由 FSRS 安排下次复习。
2. **场景 → 表达**：从 416 条真实工作场景里选最自然的一句，训练情境识别。
3. **对话角色扮演 / 跟读**：22 章对话可阅读、角色隐藏、整段播放。
4. **听力与发音**：TTS 听写、易错词发音表、常见中式错误纠错。
5. **统计与训练实验**：每日目标、连续天数、12 周热力图、中位反应时间、章节掌握度；并自动比较同一张卡「第一次 vs 最近一次」的反应时间与正确率（单组前后测）。

进度保存在浏览器 `localStorage`，设置页可导出 / 导入 JSON，无后端。

## 发音引擎

系统只有中文语音时，直接用浏览器朗读英文会非常生硬。设置页提供：

- **自动（推荐）**：有 Edge / Chrome 的自然英文音色就用系统，否则用百度在线 TTS。
- **在线 · 百度**：国内可直接访问，支持完整句子。
- **在线 · Google**：音色更自然，但需要能访问 Google。
- **系统音色**：使用已安装的英文语音包（Edge 的 Natural 音色效果最好）。

所有在线音色都走浏览器 `<audio>`，不需要 API key；断网时自动退回系统音色。

## 本地开发

```bash
cd web
npm install
npm run dev        # 构建语料 + 启动 Vite
```

常用脚本：

```bash
npm run data       # 重新解析 Markdown，生成 src/data/corpus.generated.json
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run test       # vitest
npm run build      # 构建到 dist/
npm run preview    # 预览生产构建
```

要求 Node 22+。语料在构建时生成，不提交到 git。

## 部署

推送到 `main` 后，`.github/workflows/deploy-web.yml` 会自动构建并部署到 GitHub Pages（Source 选择 GitHub Actions）。也可在 Actions 页面手动触发 `workflow_dispatch`。

Vite 使用 `base: './'` + `HashRouter`，因此项目页子路径和 PWA 离线缓存都能正常工作。

## 数据管道

`scripts/build-corpus.mjs` 解析：

- `frontend-engineer/NN-*/01-dialogue.md` 三种对话格式（`> A:`、`> User:`、Slack 聊天）
- 表达解析文件（`Also say` / `还可以说` / 关联对话 / 使用场景）
- `*vocab.md`、`*pronunciation.md`
- `reference/high-frequency-expressions.md`、`common-mistakes.md`、`scenarios-brainstorm.md`

构建会打印逐章翻译覆盖率并把统计写入 `src/data/corpus.report.json`。没有中文翻译的补充例句不会生成「中 → 英」卡片，避免把不相关的句子配成一张卡。

## 声明

在线 TTS 使用第三方公开接口，仅用于个人学习；接口不可用时请切换到其他引擎或系统音色。语料版权归原仓库作者所有。
