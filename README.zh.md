# English for Software Product Development

> [English](README.md) · [中文](README.zh.md)

产品研发团队实用英语手册。面向中国出海工程师，聚焦日常工作中最常遇到的沟通场景与真实口语表达。

---

## 概述

大多数英语教材教的是"正确的英语"，但真实工作中没人那样说话。

这本书不教语法、不教写作、不教商务邮件。它只回答一个问题：

> **真实工程师在这个场景下，到底怎么说？**

每个场景从一个**真实的对话**开始，然后逐句拆解——给你多种替代表达、标注常见中式错误、提醒易读错单词。

---

## 特色

- **不说教科书英语** — 每句不超过 8 个词。没人会跟同事说 "I would appreciate it if you could..."
- **AI 嵌入每个场景** — AI 不是独立的章节，而是日常工作流的一部分。你跟同事讨论 AI 写的代码、一起调试 AI 的 bug、review AI 的输出。
- **全员不靠谱** — 对话里没有人是完美的。有人甩锅、有人不敢拒绝、有人敷衍、AI 帮倒忙。只有暴露问题，才有素材。
- **不出现产品名** — 不说 ChatGPT / GPT / Claude，只说 AI。

---

## 目录

| 章节 | 场景 |
|------|------|
| 01-daily-standup | 每日站会 — 进度、阻塞、卡住、被打断、AI 参与 |
| 02-sprint-planning | 迭代排期 — 估点、scope creep、不合理需求 |
| 03-refinement | 需求评审 — 质疑、challenge、推拉、折中 |
| 04-test-review | 测试评审 — 边界情况、优先级、自动化 vs 手动 |
| 05-demo | Demo 会议 — 翻车、答不上来、临场加需求 |
| 06-bug-demo | Bug 演示 — 复现不出来、环境差异、AI 分析 |
| 07-code-review | 代码审查 — 提建议、解释、争论、LGTM |
| 08-api-integration | API 联调 — 500、字段对不上、超时、CORS |
| 09-phone-calls | 电话会议 — 卡顿、mute、没听清、抢话 |
| 10-slack-im | Slack 消息 — @人、bumping、发代码段、异步 |
| 11-with-qa | 跟 QA 沟通 — 复现、环境、老 bug、优先级 |
| 12-with-pm | 跟 PM 沟通 — 变更、催进度、白做了、AI 万能 |
| 13-with-backend | 跟后端沟通 — 文档过期、字段不通知、踢皮球 |
| 14-with-designer | 跟设计师沟通 — 实现不了、边界没考虑 |
| 15-user-guidance | 用户操作指导 — 截图、清缓存、旧版更好 |
| 16-task-assignment | 派发任务 — 没人想做、新人指导、紧急打断 |
| 17-help-colleague | 帮同事解决问题 — 自己也不懂、AI 帮倒忙 |
| 18-debugging | 排查问题 — 刚才还好好的、二分法、重启解决 |
| 19-asking-for-help | 请求帮助 — 问题太蠢、问完自己解决了 |
| 20-technical-discussion | 技术方案讨论 — spike、trade-off、留债 |
| 21-alignment-discussion | 对齐会 — 信息不对称、跨团队、甩锅 |
| 22-on-call-incident | 线上事故 — 回滚、hotfix、postmortem |

---

## 如何使用

每章为一个文件夹，包含一篇完整对话和多篇解析。

```
01-daily-standup/
├── 01-dialogue.md           纯英文完整对话
├── 02-still-on-it.md        解析：还没做完怎么说
├── 03-wrapped-up-pr-up.md   解析：做完了怎么说
├── ...
├── 10-vocab.md              词汇汇总
└── 11-pronunciation.md      发音提醒
```

**建议阅读顺序：**

1. **读对话** `01-dialogue.md` — 纯英文，先感受场景
2. **看解析** `02-xxx.md` — 看表达拆解、替代表达、常见错误
3. **练发音** `pronunciation.md` — 跟读易错词
4. **记词汇** `vocab.md` — 巩固关键词

---

## 导入欧路词典

习惯用手机 App 背单词？我们提供了一份可直接导入 **欧路词典** 的课本：

> [output/eudic_import.txt](output/eudic_import.txt)

**导入步骤：**

1. 打开欧路词典 → 生词本 → 导入生词
2. 选择 `output/eudic_import.txt`
3. 打开"背单词"，选择导入的课本即可开始

课本包含 **1100+ 条**内容，按章节分为 22 个单元——每一句对话、每个表达、每个词汇都配了中文释义，格式为 `英文,中文`。

**内容更新后重新生成：**

```bash
python3 scripts/build_eudic.py
```

新增对话翻译写到 `scripts/dialogue_data.json`。

---

## 项目结构

```
AGENTS.md                   写作规范
README.md                   English
README.zh.md                本文档（中文）
frontend-engineer/          前端工程师视角（22 章）
└── reference/              参考汇总
    ├── common-mistakes.md        常见中式错误
    ├── pronunciation.md          易读错词总表
    ├── high-frequency-expressions.md  高频表达速查
    └── scenarios-brainstorm.md   幺蛾子清单（完整索引）
scripts/
├── build_eudic.py               生成欧路课本（output/eudic_import.txt）
└── dialogue_data.json           对话翻译数据
output/
└── eudic_import.txt             欧路课本（导入 App 用）
```

---

## 贡献

发现新的幺蛾子？想补充某个场景的表达？

1. 更新 `reference/scenarios-brainstorm.md` 添加条目
2. 在对应章节创建解析文件
3. 将 brainstorm 中的 `[ ]` 标记为 `[x]`

---

## License

MIT
