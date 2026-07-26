# Writing Standards — English for Software Product Development

## 核心原则

- 只写**真实工程师日常说的英语**，不说教科书英语、商务邮件英语
- 每句 **1~8 个词**，越短越好
- AI 不单独成章，**嵌入每个场景**——你跟同事讨论 AI 写的东西、一起调试 AI 的代码、review AI 的输出
- **对话里所有人都不靠谱**——工程师会忘记、甩锅、不敢拒绝、敷衍、互相推诿、AI 帮倒忙。暴露问题才有素材
- 每句都要问：**"真实工程师会这么说吗？"** 不会就删

## 每章结构

每章为一个文件夹，包含：

```
01-chapter-name/
├── 01-dialogue.md        ← 纯英文完整对话
├── 02-expression-1.md    ← 解析某个表达/场景
├── 03-expression-2.md    ← 解析另一个表达/场景
├── ...
└── vocab.md              ← 词汇汇总（可选）
└── pronunciation.md      ← 发音提醒（可选）
```

### 对话文件 (01-dialogue.md)

> A: How's the login fix going?
> B: Still on it. Almost there.
> A: Any blockers?
> B: Waiting on the API doc from backend.

纯英文，一个对话覆盖该章所有典型场景。

### 解析文件 (02-xxx.md)

#### "Still on it"
还没做完，最简短的说法

还可以说：
- Not done yet
- Still working through it

❌ I haven't start fix it — 语法错了

#### 关联表达

> A: Need any help?
> B: Not yet. If I'm still stuck by EOD I'll reach out.

还可以说：
- Let me try a bit more
- I'll ping you if I need help

#### 何时用

- 站会上回答进度
- Slack 上回复同事

## 表达标注

- ❌ 语法错误或明显中式
- (无标记) 日常真实说法

## 篇幅控制

- 每个场景给 **1 段**完整对话（10~20 句来回）
- 每章 **4~8 个**解析文件
- 每个解析条目给 **2~4 种**替代表达
- 每章 **2~5 个**发音提醒

## 目录结构

每章为一个文件夹，内按场景编号（01-dialogue.md、02-expression-1.md、03-expression-2.md...）

```
frontend-engineer/
├── 01-daily-standup/           每日站会
├── 02-sprint-planning/         迭代计划
├── 03-refinement/              需求评审
├── 04-test-review/             测试评审
├── 05-demo/                    Demo 会议
├── 06-bug-demo/                Bug 演示
├── 07-code-review/             代码审查
├── 08-api-integration/         API 联调
├── 09-phone-calls/             电话会议
├── 10-slack-im/                Slack/IM 消息
├── 11-with-qa/                 跟 QA 沟通
├── 12-with-pm/                 跟 PM 沟通
├── 13-with-backend/            跟后端沟通
├── 14-with-designer/           跟设计师沟通
├── 15-user-guidance/           用户操作指导
├── 16-task-assignment/         派发任务
├── 17-help-colleague/          帮同事解决问题
├── 18-debugging/               排查问题
├── 19-asking-for-help/         请求帮助
├── 20-technical-discussion/    技术方案讨论
├── 21-alignment-discussion/    对齐会
├── 22-on-call-incident/        线上事故
└── reference/
    ├── scenarios-brainstorm.md  幺蛾子主清单（所有场景的完整索引）
    ├── common-mistakes.md       常见中式错误汇总
    └── pronunciation.md         易读错词总表
```

## 各章完整内容清单

每章必须覆盖以下场景（幺蛾子）。写之前先检查 scenarios-brainstorm.md 确认清单完整。

### 01-daily-standup 每日站会
- 说没做完其实差得远 / 被追问进度
- 做完了但 PR 没人审 / CI 挂了
- 被 block / 催了但没 @ 人
- 任务比想象中难 / AI 帮倒忙
- 忘了昨天做了什么 / 互相甩锅
- 不敢拒绝 PM 加需求
- 环境挂了 / 没确认恢复
- 散会前突然想起有事 / 嘴上说 real quick 实际要聊很久

### 02-sprint-planning 迭代排期
- PM 画大饼做不完 / 被迫接受不合理估点
- 需求模糊没法估 / 有人 scope creep
- 老 bug 没人修又塞新的 / 低估工作量
- 没人想接的任务 / 新人需要指导
- AI 帮忙估点 / 跟 AI 讨论方案

### 03-refinement 需求评审
- PM 需求前后矛盾 / 技术上做不了
- PM 说"很简单啊" / 需求变更不通知
- 讨论跑偏 / 被 challenge / 折中
- 被要求加 deadline / 大家吵起来
- AI 分析需求给出建议

### 04-test-review 测试评审
- QA 提的 case 没覆盖 / 太低概率
- QA 和环境不一致 / 觉得不是 bug
- 测试优先级 / 测不完 / 自动化 vs 手动
- AI 帮忙生成测试用例

### 05-demo Demo 会议
- 演示翻车 / 环境炸了 / 答不上来
- 效果跟预期不一样 / 临场加需求
- 准备太多讲不完 / AI 救了场
- 说这个部分是 AI 写的

### 06-bug-demo Bug 演示
- 复现不出来 / 不同环境表现不同
- 跟 PM 解释严重性 / PM 说不紧急
- 不确定前端还是后端问题 / 低概率高影响
- AI 帮忙分析 bug

### 07-code-review 代码审查
- 提建议 / 解释 / 争论 / LGTM/NIT/Blocking
- AI 代码被 review / review 别人 AI 代码
- 发了 PR 没人 review / 有人扣细节

### 08-api-integration API 联调
- 500 / 字段对不上 / 文档过期 / 超时
- 环境挂了 / 数据格式 / 认证 / CORS
- 接口改了没通知 / mock 和实际不一样
- AI 帮忙解析文档 / 生成 mock / 分析报错

### 09-phone-calls 电话会议
- 网络卡顿 / 没听清 / 没开麦 / 抢话
- 被突然点名 / 会议拖太久 / 全程不说话
- 听不懂口音 / 信号一直断

### 10-slack-im Slack/IM 消息
- 紧急找人 / 发了没回 / bumping
- 发代码段 / @ 人 / 发截图
- 下班后发消息 / 发错 channel / 异步等很久
- 发 AI 结果给同事 / 讨论 AI 代码

### 11-with-qa 跟 QA 沟通
- 修过的 bug 又提 / 环境问题 / 复现不了
- 不在范围内 / 版本没更新 / 多个 bug 优先级
- AI 帮忙想边界 / QA 说环境不行

### 12-with-pm 跟 PM 沟通
- 需求变更 / 改需求不告诉你 / 催进度
- 理解不了为什么这么久 / 要精确日期
- 需求作废白做了 / 方案被说太复杂
- AI 分析了需求给 PM 看

### 13-with-backend 跟后端沟通
- 文档没写清楚 / 改了字段不通知
- "前端处理一下" / 联调排期对不上
- 数据量太大 / 错误码没说清楚

### 14-with-designer 跟设计师沟通
- 实现不了 / 没考虑加载/空状态
- 交互太复杂 / 像素级还原 / 改稿频繁

### 15-user-guidance 用户操作指导
- 用户说不好用 / 不会用 / 跟预期不一样
- 报 bug 复现不了 / 说以前版本更好
- 教很多次还不会 / 缓存问题

### 16-task-assignment 派发任务
- 被安排不想做的 / 怕对方不爽 / 对方说做不了
- 分得不公平 / 新人需要指导 / 紧急打断
- 没人想做 / 让 AI 先做一部分

### 17-help-colleague 帮同事解决问题
- 自己也不懂 / 代码看不懂 / 搞复杂了
- 改了一下午不如你五分钟 / 方向不对
- AI 能答但同事来问你

### 18-debugging 排查问题
- 不知道从哪开始 / 刚才还好好的 / 本地行环境不行
- 二分法 / 缓存 / 配置问题 / 别人埋的坑
- 把报错贴给 AI / AI 代码引入 bug

### 19-asking-for-help 请求帮助
- 不知道怎么描述 / 怕打扰 / 讲太快听不懂
- 问题很蠢 / 别人在忙 / 问完自己解决了
- AI 解决但不知道为什么

### 20-technical-discussion 技术方案讨论
- 不认同方案 / 被点名但没想好 / 讨论抽象
- 引入不相关 / 互相推拉 / trade-off
- 方案太复杂 / AI 佐证 / 留技术债

### 21-alignment-discussion 对齐会
- 信息不对称 / 人没到齐 / 不在一个频道
- 决定被推翻 / 跨团队信息差 / 没结论
- 承诺了没做

### 22-on-call-incident 线上事故
- 线上挂了被叫 / 回滚 / hotfix / 通告
- postmortem / 跟 manager 解释 / 告诉用户修好了
- AI 帮忙分析日志

## 内容管理规则

- **所有场景必须有记录**：每写一章前，先检查 `reference/scenarios-brainstorm.md` 确认清单完整
- **新增场景必须双写**：发现新的幺蛾子 → 同时更新 scenarios-brainstorm.md 和对应章节文件
- **写完一章标记**：scenarios-brainstorm.md 中把 `[ ]` 改为 `[x]`，并在"已写场景"中记录

## 写作检查清单

- [ ] 每句表达不超过 8 个词？
- [ ] 没有教科书英语 / 商务邮件英语？
- [ ] 没有产品名（不说 ChatGPT/GPT/Claude，只说 AI）？
- [ ] 对话中有 AI 参与的场景？
- [ ] 对话里人人都不靠谱？（有人甩锅、有人不敢拒绝、有人敷衍）
- [ ] 有发音提醒？
- [ ] 真实工程师日常会这么说？
