# 需求任务板

> 用户会持续丢需求进来。这里记录需求的上下文、拆分、落点和状态，避免上下文丢失。
> 状态：`todo` / `doing` / `done` / `blocked`

## 当前迭代：第二季「路径与代价」

| ID | 需求 | 上下文 / 验收 | 落点 | 状态 |
|----|------|---------------|------|------|
| R-01 | 选择前端或全栈作为 VP 路径 | 两条路径要有不同的专精剧集、职级称谓和最终 VP 挑战；切换路径在进入专精线后锁定 | `data/story.ts`、`store/useStoryStore.ts`、`pages/StoryPage.tsx` | done |
| R-02 | 认知系统：懂一点道理，引导团队做正确操作 | 新增「认知」属性；部分选择需要认知门槛；首次选择获得认知，重玩不刷；认知在后续剧集解锁更好的处理方式 | `data/story.ts`、`store/useStoryStore.ts`、`pages/StoryEpisodePage.tsx` | done |
| R-03 | 更多狗血剧情 + 办公室恋爱 | 新增办公室恋爱剧集；选择涉及保密、利益冲突、团队公平；影响信任与结局 | `data/story.ts` | done |
| R-04 | 在公司看到不该看的东西，被开除 | 新增「暗线」剧集：深夜看到裁员/机密文件；泄露或处理不当触发「被开除」结局；可重玩改写 | `data/story.ts`、`store/useStoryStore.ts` | done |
| R-05 | 在 galgame 里学职业专业知识 | 每集可带「职业知识卡」；通关后解锁；剧情列表可查看职业手册 | `data/story.ts`、`pages/CareerPage.tsx` | done |
| R-06 | 学汇报 | 新增汇报训练：结论先行 / SCQA / STAR / 事故汇报；可填四段式生成英文汇报并朗读 | `data/reporting.ts`、`pages/CareerPage.tsx` | done |
| R-07 | 每条剧情线都必须是通的 | 图遍历测试：每个 beat 可达；每个选择最终能到结局；前端/全栈两条路径都能从 EP1 走到跳槽终面；锁定条件不会死锁 | `test/story.test.ts` | done |
| R-08 | 架构清晰 + 测试用例 | 模块边界文档、存储 schema 与版本规则、扩展点；typecheck / test / build 全绿 | `docs/ARCHITECTURE.md`、`test/*` | done |
| R-09 | 不靠谱、不负责的同事 | 固定角色 Kevin：抢功、消失、甩锅；写进专精剧集与暗线，选择要处理「人不靠谱但系统要继续跑」 | `data/story.ts` | done |
| R-10 | 很专业但很傻逼的同事 | 固定角色 Victor：Principal Engineer，技术强、架构洁癖、四十分钟证明你不行但不给替代方案；专精剧集里用「先止血再重写」应对 | `data/story.ts` | done |
| R-11 | 任务拆分与上下文 | 维护本任务板；每个需求记录上下文、落点、验收；跨会话可恢复 | `docs/BACKLOG.md` | done |
| R-12 | 打字 / 填字，帮助记忆 | 新增「填字」与「整句打字」两种模式：句子挖空 1–3 个关键词、逐空校验、首字母渐进提示、整句逐词差异；结果计入 FSRS；功能按独立模块组织，便于后续重构 | `src/features/typing/`、`src/App.tsx`、`src/components/layout/AppShell.tsx`、`src/pages/DashboardPage.tsx` | done |
| R-13 | 功能模块化，便于后续按模块重构 | 新功能放 `src/features/<module>/`，模块自带纯逻辑、测试、README 和唯一公共入口；现有 pages 保持不动，记录迁移映射 | `src/features/README.md`、`docs/ARCHITECTURE.md` | done |
| R-14 | 更自然的 TTS，免费/薅羊毛优先 | 调研并落地 Edge 逆向 WebSocket（v2 token）+ 本地 Node 代理，新增「在线 · Edge Natural」引擎、音色选择、IndexedDB 音频缓存与自动回退；纯浏览器直连因握手头限制返回 403，代理方案已端到端验证 | `docs/TTS.md`、`src/features/tts/`、`scripts/edge-tts-proxy.mjs`、`src/lib/speech.ts`、`src/pages/SettingsPage.tsx` | done |
| R-15 | 小字太多、整体字号偏小 | 建立统一字号阶梯并抬升下限：9/10px 元信息统一到 12px，11px 提示提升到 13px，`text-xs` 13px、`text-sm` 15px；统计图表刻度 12px；已在桌面与 390px 移动端检查主要页面 | `src/index.css`、`docs/ARCHITECTURE.md`、各页面 | done |
| R-16 | 查词触发方式不清楚，需要高亮 | 悬停 0.3 秒才出卡片并给命中词加 tag 式高亮；双击立即查词、取消原生选中并固定卡片；排除输入框、按钮双击、链接等会抢交互的位置；滚动/缩放时收起；面板底部提示触发方式 | `src/components/words/GlobalWordLookup.tsx` | done |
| R-17 | 打字时要有好听的键盘音效，调研开源项目 | 调研 thock / thock-mania / daktilo / KeyEcho 等；采用 thock 的 4 套 CC0 采样；按下+回弹双采样、音高/音量随机化、180Hz 高通让默认 Clicky 更清脆；设置页开关/试听/音量，训练页快速静音；只在输入框发声；WAV 进 PWA 预缓存 | `src/features/typing/sound.ts`、`src/pages/SettingsPage.tsx`、`src/store/useSettingsStore.ts`、`public/sounds/`、`docs/SOUND.md` | done |
| R-18 | README / 项目描述要有产品截图 | 截取今日、剧情大厅、剧情场景、选择、查词、打字、音效设置 7 张桌面截图，转 JPEG 控制体积；根 README 与 `web/README.md` 用相对路径展示 | `web/docs/screenshots/`、`README.md`、`web/README.md` | done |
| R-19 | 想用 TypingClub 站点的音效素材 | 核查其 Terms of Service：站点内容为专有知识产权，禁止复制、改作和再分发；未下载/打包其素材，仅作为清脆反馈的交互参考，继续使用 CC0 的 thock 采样 | `docs/SOUND.md` | blocked |

## 已完成（第一季）

- 语料管道、反射训练、场景、对话、听力、统计、设置。
- 三条剧情线（晋升 / 管理 / 跳槽）、9 集、7 个固定角色。
- 头像部件化 + 赛博朋克风格 + Node 校验脚本。
- 全局 hover 查词、收藏、生词本。
- IndexedDB 存储层、统一备份、设置页导出/导入/清空。

## 待确认 / 下一步候选

- 汇报训练是否接入绩效点（当前只做练习，不计分）。
- 办公室恋爱是否扩展为多角色好感度系统（当前是单集剧情）。
- 被开除后是否要「降职/重开人生」的长期后果（当前只记录次数，不扣进度）。
- 是否把剧情数据继续拆分为 `story/` 目录（按剧情线分文件）。
