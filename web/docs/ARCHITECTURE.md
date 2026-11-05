# 架构说明

> 目标：模块边界清楚，数据可以升级，剧情可以持续加，不会因为一次改动把旧存档或旧剧情线弄坏。

## 1. 总览

```
web/
├── scripts/                 # Node.js 构建期流水线（不进运行时）
│   ├── build-corpus.mjs     # Markdown + dialogue_data.json → corpus.generated.json
│   ├── build-word-map.mjs   # 语料词表 + word-extra.json → word-map.generated.json
│   ├── build-cast.mjs       # 校验固定角色头像组合 → public/cast/manifest.json
│   └── word-extra.json      # 手工补充的职场/剧情词条
├── src/
│   ├── data/                # 纯数据与纯函数
│   │   ├── story.ts         # 剧情类型、角色、剧集、职业等级、路径、解锁规则
│   │   ├── reporting.ts     # 汇报框架与场景模板
│   │   ├── avatar.ts        # 头像部件、组合、签名
│   │   ├── dictionary.ts    # 本地词表 Map、短语匹配、词形还原
│   │   └── corpus*.ts/json  # 语料加载与索引（构建生成）
│   ├── store/               # Zustand 状态 + 持久化
│   │   ├── useProgressStore.ts
│   │   ├── useSettingsStore.ts
│   │   ├── useStoryStore.ts
│   │   └── useFavoritesStore.ts
│   ├── lib/                 # 无 UI 的运行时能力
│   │   ├── storage.ts       # IndexedDB + localStorage 回退 + 迁移
│   │   ├── backup.ts        # 统一备份格式、导入导出、清空
│   │   ├── speech.ts        # TTS / ASR
│   │   └── srs.ts / textMatch.ts / stats.ts
│   ├── components/          # 可复用 UI
│   │   ├── story/           # 立绘、背景、角色头像
│   │   ├── words/           # 全局查词
│   │   ├── layout/          # AppShell / 导航
│   │   └── ui/              # Button / Badge 等
│   ├── pages/               # 路由页面
│   └── test/                # Vitest 单元测试
├── docs/
│   ├── ARCHITECTURE.md      # 本文件
│   └── BACKLOG.md           # 需求任务板（持续更新）
└── public/cast/manifest.json # 构建生成，可供画廊/导出使用
```

原则：

- **数据与 UI 分离**：`data/` 只导出常量、类型和纯函数；页面不直接写死剧情规则。
- **规则集中**：剧集解锁只走 `episodeLock()`，挑战判定只走 `challengePassed()`，结局只走 `endingFor()`。
- **构建期校验**：角色头像、词表、语料在 `predev` / `prebuild` / `pretest` / `pretypecheck` 自动生成并校验。
- **可测试**：所有关键规则都是纯函数，测试不需要浏览器。

## 2. 剧情数据模型

```ts
StoryEpisode {
  id, arcId, chapterId, order, kind
  track?: 'frontend' | 'fullstack'   // 专精路径专属
  requiresRank?, unlockAt?, requiresEpisode?, requiresTrackEpisode?
  characters, positions, start, beats
  endings: { good, ok, bad }
  challenge, languageFocus, knowledge
  careerPoints, promotionTo, goodAt, badAt
}

StoryBeat {
  id, speaker, en, zh, scene, mood
  choices?: StoryChoice[]
  next?: string
  ending?: 'auto'                  // 到达此节点时按分数结算
}

StoryChoice {
  id, en, zh, quality, noteZh
  trust?, insight?, requiresInsight?
  next
}
```

### 2.1 节点图

- 每个 `StoryEpisode` 是一张有向图，`start` 是入口。
- 普通节点用 `next` 前进；选择节点用 `choices[].next` 分叉；`ending: 'auto'` 是汇合点。
- 结局由 `score` 决定：`good` 每选 +2，`bad` 每选 -2，`ok` 0；`goodAt` / `badAt` 是阈值。
- 挑战与结局解耦：`challengePassed()` 决定额外绩效和晋升；`endingFor()` 只决定叙事结局。
- 测试会遍历所有分支，要求：**所有节点可达、三种结局都可达**。

### 2.2 信任与认知

- **信任值**：每个角色 0–100，初始 50。选择可以增减；部分挑战要求最低信任。
- **认知**：跨剧集的永久属性，初始 `INSIGHT_START = 10`。
  - 选择上的 `insight` 是「第一次选这个选项」时获得的认知，按 `${episodeId}:${choiceId}` 去重，重玩不刷。
  - 选择上的 `requiresInsight` 是门槛；不足时按钮禁用并显示所需认知。
  - 设计意图：先在前面的剧集里学到道理，后面的剧集才允许你做更成熟的判断。
- 认知与信任都不影响旧存档兼容：缺字段时用默认值补齐。

### 2.3 职业路径

- `CAREER_TRACKS` 定义前端 / 全栈两条路径，以及 2–8 级的职级称谓。
- `careerRank(level, track?)`：不传 `track` 时返回基础职级（兼容旧代码）；传了才应用路径称谓。
- 剧集上的 `track` 表示只属于某条路径；`requiresTrackEpisode` 表示「先完成本路径的专精剧集」。
- 进入专精剧集后，`useStoryStore.setCareerTrack()` 会拒绝切换到另一条路径，避免同时刷两条线。
- 两条路径都必须能走通：`story.test.ts` 会模拟从 EP1 到跳槽终面的完整路径。

### 2.4 解锁规则

唯一入口：`episodeLock(episode, progress)`，返回 `null` 或锁定原因：

| 原因 | 含义 |
|------|------|
| `track` | 路径不匹配 / 还没选路径 |
| `rank` | 职级不够（含剧情线的 `unlockRank`） |
| `points` | 绩效点不够 |
| `episode` | 前置剧集未完成 |
| `track-episode` | 未完成本路径专精剧集 |

页面只负责把 `EpisodeLock` 渲染成文案，不重复实现规则。新增解锁条件时，先改这个函数和测试。

### 2.5 奖励与晋升

- 首通给 `careerPoints`；首次挑战通过再给 `CHALLENGE_BONUS = 20`；重玩不重复给。
- `promotionTo` 只有在挑战通过时才生效。
- 被开除的结局带 `ending.fired`；`recordEnding()` 会累加 `firedCount`，但不会扣绩效或删档，允许重玩改写。
- 记录保留历史最佳分数，但 `fired` 会保留「曾经被开除」的事实，卡片上会显示。

## 3. 头像系统

- `avatar.ts` 定义部件：`face` / `eyes` / `outfit` / `accessory`。
- 固定角色在 `STORY_CHARACTERS[].avatar` 里存配置；`StoryPortrait` 负责赛博朋克渲染（霓虹轮廓、义体、电路、呼吸/眨眼）。
- `composeAvatar(base, patch)` 用于预览/换装；`avatarSignature()` 生成唯一签名。
- `scripts/build-cast.mjs` 在构建期校验：
  - 部件值合法；
  - 每个固定角色的组合唯一；
  - 每集 cast 都存在。
- 新增角色：先加 `STORY_CHARACTERS` 配置，再跑 `npm run cast` 确认没有撞脸。

## 4. 存储与备份

### 4.1 IndexedDB

- 数据库：`efspd`，版本 `1`，object store：`kv`（`keyPath: 'key'`，索引 `updatedAt`）。
- Zustand 的 `persist` 通过 `idbStateStorage` 读写；IDB 不可用时回退 `localStorage`。
- 首次读取时会把旧 `localStorage` 值迁移到 IDB，然后删除旧键。
- `createAppStorage()` 是统一的 `createJSONStorage` 工厂。

### 4.2 各模块 key 与版本

| key | store | 当前 version |
|-----|-------|--------------|
| `efspd.progress.v1` | `useProgressStore` | 见 store |
| `efspd.settings.v1` | `useSettingsStore` | 见 store |
| `efspd.story.v1` | `useStoryStore` | 4 |
| `efspd.favorites.v1` | `useFavoritesStore` | 见 store |

升级规则：

1. 只加字段：给默认值，旧存档照常读取，`version` 可不升。
2. 改字段语义 / 删字段 / 迁移数据：`version + 1`，在 `migrate` 里补齐或转换。
3. 绝不改已有 key 的含义；需要新结构时新建 key。
4. 导入旧备份时，各模块的 `import*` 必须容忍缺字段。

### 4.3 统一备份

`lib/backup.ts` 的格式：

```json
{
  "app": "efspd-trainer",
  "format": "efspd-backup",
  "formatVersion": 1,
  "exportedAt": "...",
  "stores": {
    "progress": { "version": 1, "data": {} },
    "settings": { "version": 1, "data": {} },
    "story": { "version": 1, "data": {} },
    "favorites": { "version": 1, "data": {} }
  }
}
```

- 每个模块独立 `version`；导入时按模块分发。
- 未知模块放进 `skipped`，不报错，保证新版本导出的备份能在旧版本里部分恢复。
- 仍兼容第一版的「仅进度」备份。
- `clearAllData()` 清 IDB、调用各 store 的 `persist.clearStorage()` 并重置内存状态。

## 5. 全局查词与生词本

- `scripts/build-word-map.mjs` 合并语料词表、发音表、表达、高频表达和 `word-extra.json`，生成 `word-map.generated.json`。
- `lib/dictionary.ts` 在运行时建立 `Map`；`normalizeTerm()` 处理大小写、弯引号、空白、首尾标点；支持 `-s` / `-es` / `-ies` / `-ing` / `-ed` / `'s` 等简单词形。
- `GlobalWordLookup`：
  - 监听 `mousemove` / `pointerup` / `scroll` / `Escape`；
  - 用 `caretRangeFromPoint` / `caretPositionFromPoint` 找到光标下的 token；
  - 先尝试 5→2 词短语，再单词；
  - 面板通过 portal 挂到 body，`data-no-lookup` 防止自触发。
- 收藏是通用 `FavoriteItem`（word / expression / card / dialogue / story），带颜色标记；生词本页 `/words` 统一管理。

## 6. 职业手册与汇报训练

- 知识卡挂在剧集的 `knowledge` 上；`CareerPage` 汇总所有知识卡，按 `track` 过滤，按剧集通关状态决定是否解锁。
- `reporting.ts` 是纯数据：4 个场景、4 种框架（BLUF / SCQA / STAR / Incident）、每个场景四段式模板和句型。
- `ReportingLab` 只做本地状态：选择场景 → 填四段 → 生成英文骨架 → 朗读 / 复制；不写存储、不计分。
- 新增汇报场景：在 `REPORTING_SCENARIOS` 里加一项，保证四个 `key` 齐全，测试会自动校验。

## 7. 路由与页面

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Dashboard | 今日训练 |
| `/drill` | Drill | 限时反射 |
| `/scenario` | Scenario | 场景→表达 |
| `/dialogue/:chapterId` | Dialogue | 对话/角色扮演 |
| `/listen` | Listening | 听力发音 |
| `/library` | Library | 语料库 |
| `/story` | StoryPage | 剧情列表、路径选择、职业档案 |
| `/story/:episodeId` | StoryEpisodePage | 剧情播放（简报/阅读/选择/结局） |
| `/words` | WordsPage | 生词本 |
| `/career` | CareerPage | 职业手册 + 汇报训练 |
| `/stats` | Stats | 统计 |
| `/settings` | Settings | 设置、备份、存储 |

使用 `HashRouter` + `base: './'`，兼容 GitHub Pages 子路径。

## 8. 测试策略

| 文件 | 覆盖 |
|------|------|
| `corpus.test.ts` | 语料解析与卡片完整性 |
| `story.test.ts` | 剧情图链接、所有节点可达、三种结局可达、认知门槛、知识卡、路径完整性、两条路径模拟通关、解锁规则 |
| `storyStore.test.ts` | 认知去重、路径锁定、晋升称谓、被开除计数、导入导出 |
| `dictionary.test.ts` | 词表规模、归一化、词形、短语 |
| `favorites.test.ts` | 收藏 ID 归一化、增删改色、导入过滤 |
| `backup.test.ts` | 备份格式、旧备份、四模块 round-trip、未知模块跳过、坏文件拒绝 |
| `reporting.test.ts` | 四个汇报场景、四段结构、框架映射 |
| `stats.test.ts` | 统计聚合 |

运行：

```bash
cd web
npm test
```

`pretest` 会先跑 `data`、`cast`、`words`，保证新鲜克隆也能直接测试。

## 9. 扩展指南

### 新增一集

1. 在 `story.ts` 定义 `StoryEpisode`，保证：
   - `beats[episode.start]` 存在；
   - 每个 `next` / `choice.next` 指向存在的节点；
   - 至少 3 个选择节点、3 条语言点；
   - `good` / `ok` / `bad` 三种结局；
   - 若带 `knowledge`，每个卡片有 `id`、`titleZh`、`summaryZh`、至少 2 个 `pointsZh`。
2. 把 id 加进对应 `StoryArc.episodeIds` 和 `STORY_EPISODES`。
3. 跑 `npm test`：图遍历测试会检查可达性和三种结局。
4. 跑 `npm run cast`：确认新 cast 的头像组合唯一。

### 新增一条剧情线

1. 加 `StoryArc`，设置 `unlockRank` / `episodeIds`。
2. 剧集通过 `arcId` 关联；解锁由 `episodeLock()` 自动处理 `unlockRank`。
3. 在 `StoryPage` 不需要改代码，`STORY_ARCS.map` 会自动渲染。

### 新增一条职业路径

1. 在 `CAREER_TRACKS` 加一项，补齐 `rankTitles[2..8]`。
2. 新增专精剧集，设置 `track`，并让 `specialtyEpisode(track)` 能找到（当前约定：每 track 恰好一集）。
3. 更新 `story.test.ts` 的 `CareerTrack` 列表和模拟通关顺序。

### 新增头像部件

1. 在 `avatar.ts` 的 `AVATAR_PARTS` 加值，并扩展 `AvatarConfig` 类型。
2. 在 `StoryPortrait` 加对应 SVG 分支。
3. 跑 `npm run cast`：会校验所有固定角色。

### 新增词条

1. 优先改语料源文件；临时/剧情词条放 `scripts/word-extra.json`。
2. 跑 `npm run words`，再跑 `dictionary.test.ts`。

## 10. 已知限制

- 剧情数据目前集中在一个 `story.ts`，集数继续增长后应按剧情线拆分文件。
- 汇报训练不持久化、不计绩效；如果要做成课程，需要新增 store 与备份模块。
- 办公室恋情目前是单集剧情，没有多角色好感度系统。
- 被开除只记录次数，不降职、不删档；如果要做长期后果，需要在 `recordEnding` 里设计新的状态迁移。
- PWA 更新有缓存延迟，部署后建议强制刷新。
