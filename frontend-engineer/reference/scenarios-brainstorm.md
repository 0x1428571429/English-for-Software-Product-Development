# Scenarios Brainstorm — 幺蛾子清单

> 这是本书所有章节的幺蛾子汇总，是核心资产。每个条目将来会被展开成完整的"对话 + 解析"。
> 
> **规则**：发现新场景必须同时更新这里和对应章节文件。
> 
> **标记**：
> - `[x]` = 已写入该章节
> - `[ ]` = 已规划但未写入，后续会用

---

## 01-daily-standup 每日站会

### 已写场景（对应文件）
| 文件 | 覆盖的幺蛾子 |
|------|------------|
| 02-still-on-it.md | 说没做完 / 被追问 / 说不清卡在哪 |
| 03-wrapped-up-pr-up.md | 做完了 / PR没人审 / CI挂了 / 安排review |
| 04-waiting-on-blocked.md | 被block / 催了但没@人 / keep me posted |
| 05-rabbit-hole.md | 越搞越糟 / AI帮倒忙 / 砍需求 |
| 06-forgot-no-clue.md | 忘了做什么 / 不知状况 / 甩锅 |
| 07-cant-say-no.md | 不敢拒绝 / 活太多 / 帮挡需求 |
| 08-env-didnt-check.md | 环境挂了 / 没确认恢复 |
| 09-close-standup.md | 散会前突然想起 / "real quick" / 沉默 |

### 待写幺蛾子
- [ ] 做完了但是没测完
- [ ] review别人的代码花了很多时间
- [ ] 这个task之前没人做过，没有参考
- [ ] 时区问题，有人没睡醒
- [ ] 有人开会时背景嘈杂（小孩/宠物/外卖）
- [ ] 有人没开摄像头但大家要求开
- [ ] 有人喝醉了/没睡醒状态明显不对
- [ ] "It works on my machine" — 但别人跑不起来
- [ ] 有人迟到，进来问"what did I miss"
- [ ] 有人替别人汇报，说错了
- [ ] 有人用AI写了站会更新，但跟实际情况对不上
- [ ] 说出"blocker"但实际没有自己尝试解决
- [ ] 没人说话，主持人一个个点名
- [ ] 有人把站会当成了sprint review讲得太细

## 02-sprint-planning 迭代排期

- [x] PM画了个大饼，根本做不完 — "That's a lot for one sprint"
- [x] 需求模糊，不知道怎么估 — "Can't estimate until requirements are clearer"
- [x] 有人提出scope creep — "That's a whole new feature. Not in scope."
- [x] 老的bug没人修，又塞了新的 — "We still have unresolved bugs"
- [x] 没人想接这个任务 — "Who wants to take this?"
- [x] AI帮忙估点 / AI估vs人估 — "AI estimated it at 2 days but I think it's more"
- [x] sprint容量不够，谁的任务被砍谁不爽 — "Something has to go"
- [x] PO说"这个很简单"，开发说"这个很复杂" — "Simple? The backend doesn't support it"
- [x] 新人需要帮助估点 — "I don't know how to estimate it"
- [x] PM说"都是优先级" — "Everything is priority"
- [ ] 被迫接受不合理估点 — "I'll give it my best shot, but no promises"
- [ ] 被人低估了你的工作量 — "I think you're underestimating this"
- [ ] 团队策略问题 — "We shouldn't cut corners on testing"
- [ ] 把 bug fix 当新故事估点
- [ ] 有人把故事拆得太小 / 拆得太大
- [ ] 估点时大家意见分歧巨大，互相不让
- [ ] 有人估算故意报多/报少（政治因素）
- [ ] 技术债没人愿意估，因为说不清要多久
- [ ] AI自动估点和人估的不一样，该信谁

## 03-refinement 需求评审

- [x] PM需求描述前后矛盾 — "Earlier you said X, now you're saying Y"
- [x] PM说"很简单啊" / 低估工作量 — "Simple? There's more to it"
- [x] 讨论跑偏了 / 拉回来问本质 — "What problem are we solving?"
- [x] PM没考虑边界情况（空/加载/错误状态）— "What about the empty state?"
- [x] 临场追加需求 / "one more thing" — "That's a separate conversation"
- [x] PM混淆不同功能 — "That's a completely different feature"
- [x] PM说"AI能不能加速" — "AI can't build your backend for you"
- [x] PM没问开发就对外承诺 — "You committed without an estimate"
- [x] 最终确认scope — "Clear?"
- [ ] 技术上根本做不了 — "This isn't feasible with our current setup"
- [ ] 需求变更没通知所有人 — "Was this discussed in the last meeting?"
- [ ] 被要求做A，但B才是关键 — "The real issue is B"
- [ ] 需求有前置依赖没说 — "We can't do this until X is done"
- [ ] 被challenge — "I see your point, but here's why I think differently"
- [ ] 折中方案 — "How about we meet in the middle?"
- [ ] 被要求加deadline — "I can't commit to that timeline"
- [ ] 我不同意这个做法，因为… — "I'd push back on that because..."
- [ ] 给需求排优先级 — "Is this a must-have or a nice-to-have?"
- [ ] 大家吵起来了
- [ ] AI分析了一下这个需求，建议…
- [ ] PM说"用户想要这个"，但没数据支撑
- [ ] UX说应该这么做，PM说应该那么做，你在中间
- [ ] 需求评审变成技术方案讨论，跑偏了
- [ ] 有人提出一个需求，所有人都沉默了
- [ ] PM临时带了 stakeholder 来，需求全变了
- [ ] Acceptance criteria 比故事本身还长

## 04-test-review 测试评审

- [x] QA提的case你没想到 — "Good catch, I didn't think of that"
- [x] 测试优先级 / 测不完 — "Let's prioritize critical paths first"
- [x] QA和环境不一致 / E2E不稳定 — "Tests pass locally but fail on CI"
- [x] QA发现的bug你觉得不是bug — "That's not a bug, that's how it works"
- [x] AI帮忙生成测试数据 — "Can AI help generate some of the test data?"
- [x] 测试设备问题 — "I don't have a test device"
- [ ] QA说这个没cover — "Yeah, I'll add it"
- [ ] QA提的case太低概率 — "That's an edge case, we can handle later"
- [ ] 自动测试vs手动测试 — "Is this worth automating?"
- [ ] 测试数据问题 — "We don't have test data for this case"
- [ ] AI帮忙生成了测试用例
- [ ] AI写e2e测试
- [ ] AI帮忙补充了边界情况
- [ ] 测试环境数据被污染了，case跑不过
- [ ] QA测了一半发现需求变了
- [ ] E2E测试太慢，没人愿意跑
- [ ] 测试发现了bug但开发说"这不是bug，是feature"
- [ ] QA说"我测完了"，结果上线就炸
- [ ] 自动测试覆盖率90%但核心路径没测到
- [ ] 回归测试太多，每次发布要跑两小时
- [ ] 用AI写测试但AI不了解业务逻辑，测了等于没测

## 05-demo Demo 会议

- [x] 演示的时候当场翻车 — "It was working earlier..."
- [x] 观众问了一个答不上来的问题 — "I don't have the answer off the top of my head"
- [x] 效果和别人想象不一样 — "This is what we have now"
- [x] 准备 demo 的时候发现功能还没做完 — 数据是 mocked
- [x] 说这个部分我让AI写的 / AI推荐的方案不行
- [ ] 环境炸了，demo不了 — "Environment is down, let me share my screen"
- [ ] 有人质疑方案 — "I can walk through the implementation"
- [ ] 临场加需求 — "Let's capture that as a follow-up"
- [ ] 准备太多讲不完 — "I'll go through the highlights"
- [ ] 演示翻车但是被AI救了
- [ ] 演示的时候发现有个明显 bug，观众看到了
- [ ] 演示数据是假的，被问"这个数据哪来的"
- [ ] 演示过程中被频繁打断问问题，讲不完
- [ ] 高管在下面，更加紧张
- [ ] "这个功能我们下个sprint做"被当众录下来了
- [ ] 同时演示和讲解，手忙脚乱

## 06-bug-demo Bug 演示

- [x] bug复现不出来 — "It was happening consistently earlier"
- [x] 不同环境表现不一样 — "Only on staging, not locally"
- [x] 录屏演示 — "Let me record this"
- [x] 跟PM解释严重性 — "This affects all users who..."
- [x] PM说这个不紧急 — "I'd argue this is more urgent because..."
- [x] 不确定是前端还是后端问题 — "Can we check the network tab?"
- [x] 低概率但是高影响 — "60% of the time"
- [x] 把repo步骤发给AI让它分析 — "Let me paste the error into AI"
- [ ] 截图/录屏发给别人
- [ ] 跟QA一起复现
- [ ] 演示给PM看，PM说"这个很严重"，但其实只是个UI问题
- [ ] 演示了三次都复现不出来，放弃
- [ ] 发现bug是因为没清缓存
- [ ] bug是第三方服务的问题，没法修
- [ ] "这个bug以前修过，又回来了" — regression
- [ ] 录屏的时候不小心录到了敏感信息
- [ ] PM说"这个不用修，用户不会那样操作"
- [ ] 低概率bug要不要修和QA吵起来

## 07-code-review 代码审查

- [x] 提建议 — "I think there's a simpler way"
- [x] 争论方案 — "I think the switch is fine"
- [x] LGTM / NIT / Blocking 的区别
- [x] AI生成的代码被review — "Did AI write this?"
- [x] review别人的AI代码 — "AI doesn't handle null values"
- [x] 你不同意review意见 — "I don't think it's that important"
- [x] 发了PR没人review
- [x] 有人扣细节 / nitpicking — "It's a nit"
- [x] "先合并再修复"被反对 — "Follow-up PRs never happen"
- [ ] 解释PR — "Here's why I did it this way"
- [ ] 有人说"你写法不对"
- [ ] review了十轮还没合并
- [ ] 发现自己的代码被改了很多但没人告诉你
- [ ] 有人在PR里写小说，根本看不完
- [ ] 有人只回"LGTM"但明显没看
- [ ] 代码风格争论（tab vs space、分号 vs 不分）
- [ ] 用AI review PR，AI说没问题但你觉得有问题
- [ ] AI写的代码 review 了发现有一半要改
- [ ] 有人approve了但CI没过，谁来负责
- [ ] 凌晨两点有人发了PR催review

## 08-api-integration API 联调

- [x] 接口返回500 — "I'm getting a 500"
- [x] 字段对不上 — "amount should be amount_cents"
- [x] 文档过期了 — "Doc says one thing, the server expects another"
- [x] 接口超时 — "It times out after 30 seconds"
- [x] CORS问题 — "No CORS header"
- [x] mock数据和实际不一样 — "Mock returns camelCase but API is snake_case"
- [x] 接口改了没通知 — "You didn't tell me"
- [x] 联调环境挂了 / 连接不上
- [x] 后端说"你传的参数不对"，但其实文档写错了
- [x] 联调排期对不上 / 对方放鸽子
- [x] AI帮忙分析了报错
- [x] 联调排期 / 约定时间
- [ ] 数据格式不一致 — "Expecting array but getting object"
- [ ] 认证问题 — "Getting 401, did token format change?"
- [ ] 对方没准备好 — "Are you done with your part?"
- [ ] 参数需要加密/签名 — "Do I need to sign the request?"
- [ ] AI帮忙解析了接口文档
- [ ] AI帮忙生成了mock数据
- [ ] 后端改了个字段名没告诉你，你查了两小时
- [ ] "昨天还好好的" — 不知道谁改了什么
- [ ] 接口返回200但其实数据是错的
- [ ] 本地连不上测试环境
- [ ] 接口有rate limit，测一半被ban了
- [ ] 用AI生成mock数据，AI生成的数据格式不对

## 09-phone-calls 电话会议

- [x] 网络卡顿 — "You're breaking up / choppy"
- [x] 没听清 — "Can you repeat that?"
- [x] 有人没开麦 / 对方在 mute 上
- [x] 背景音很大 — "I'm in a coffee shop"
- [x] 有人加入/退出 — "Sorry I'm late. What did I miss?"
- [x] 分享屏幕找不到东西 — "Bear with me, let me find it"
- [x] 你说了一段话问"any questions?" 没人回应
- [x] 结束通话 — "That's all from my side. Thanks."
- [ ] 多人同时说话 — "Go ahead / You go first"
- [ ] 被突然点名 — "Gimme a sec to think about that"
- [ ] 会议拖太久 — "We're running out of time"
- [ ] 有人全程不说话 — "Anyone have anything to add?"
- [ ] 录音/录屏 — "Do you mind if I record this?"
- [ ] 听不懂对方的口音
- [ ] 对方信号不好一直在断
- [ ] 打电话的时候在走路/骑车
- [ ] 有人一直在嚼东西/敲键盘
- [ ] 会议邀请没发calendar link
- [ ] 国际会议时区算错了
- [ ] Zoom/Teams 录屏没录上
- [ ] 有人说"can you share your screen?"但你在手机上
- [ ] 你的VPN断了，连不上会议
- [ ] 有人开着AI实时翻译，但翻错了

## 10-slack-im Slack/IM 消息

- [x] 紧急找人 — "Got a sec? / Are you around?"
- [x] 发了消息没回复 — "Bumping this"
- [x] 发代码段 / 发截图 — "Here's the log"
- [x] 别人不回，但是在线 — "I see you're online"
- [x] 下班后发消息 — "No rush, just when you get a chance"
- [x] 异步沟通等很久 — "Just following up on this"
- [x] 发AI的输出结果给同事看 / AI帮忙回答
- [x] 不同时区
- [ ] 在channel里@人 — "Hey @x, do you know about this?"
- [ ] 被拉进一个thread — "Jumping in here"
- [ ] 不小心发错channel — "Wrong channel, sorry"
- [ ] 在群里讨论AI代码
- [ ] 发prompt问同事"你看看这个prompt行不行"
- [ ] 删消息但对方已经看到了
- [ ] 发了一段AI生成的回复但味道太明显
- [ ] 问你一个问题但你看到却不回（ghosted）
- [ ] 在thread里回了个"+1"就当没看到
- [ ] 对方发了一长串问题，只回最后一个
- [ ] 用Slack的"会消失的消息"发重要事情
- [ ] 发语音消息但对方不方便听
- [ ] AI自动总结频道内容，总结错了
- [ ] 你收到"thanks"或"+1"通知震个不停
- [ ] 有人凌晨两点发消息然后撤回
- [ ] 用AI写回复但语气不对，同事以为你在生气
- [ ] 一个问题同时在两个channel问
- [ ] 发了问题没人回，自己解决了也没说
- [ ] 在channel里问了谁有空，没人理
- [ ] "Did you see my message?" — "No"（其实看到了）
- [ ] 有人发了一堆voice message，没人听

## 11-with-qa 跟 QA 沟通

- [x] QA提了一个已经修过的bug — "I fixed that yesterday"
- [x] QA环境问题 — "I can't reproduce it. Might be cache"
- [x] QA说步骤不清晰 — "Can you send me the steps?"
- [x] 复现不出来 — "I can't repro it"
- [x] QA提的bug不在范围内 — "That's existing behavior"
- [x] 你说修好了QA说还有 — "Is this a new issue?"
- [x] AI帮忙想边界 / AI分析了bug — "I already asked AI"
- [ ] 跟QA确认修复 — "Can you verify on staging?"
- [ ] 版本没更新 — "Are you on the latest build?"
- [ ] 多个bug优先级 — "Which one should I prioritize?"
- [ ] 跟QA说"AI帮我测了一下"
- [ ] QA说环境不行测不了
- [ ] QA提的bug你修了但deploy失败了
- [ ] QA在你修bug的时候又测出另一个bug
- [ ] 跟QA说"这个下个版本修"，QA说不行
- [ ] QA用生产环境数据测，出了问题
- [ ] 你跟QA说"clear cache"，QA说"什么是cache"
- [ ] QA说"This is a blocker"，你觉得只是minor
- [ ] 让AI帮忙写测试数据，AI生成的数据里有脏数据
- [ ] QA测了没问题的功能，上线后被用户发现bug

## 12-with-pm 跟 PM 沟通

- [x] 需求突然变更 / 改需求不告诉你 — "You changed the timeline without telling us"
- [x] PM不理解为什么这么久 — "Can't you work overtime?"
- [x] 你跟PM说做不到，他不信
- [x] PM推需求 / 催进度 — "The client is expecting it"
- [x] 需求做完了PM说"这不是我想要的" / 需求变了
- [x] PM说"不就是加个按钮吗"（其实很复杂）
- [x] PM说"AI能不能加速" / AI万能 — "What if AI can help?"
- [x] "这个需求客户已经在等了" — PM施压
- [x] 不敢拒绝 / "I'll see what I can do"
- [ ] PM要你给精确日期 — "I'd estimate 2-3 days but can't give exact date"
- [ ] 需求作废白做了 — "So the work I did last week is being scrapped?"
- [ ] 你给的方案PM说太复杂 — "This is the simplest approach I can think of"
- [ ] PM说"用户反馈..."
- [ ] 跟PM说"AI分析了一下这个需求"
- [ ] PM说"我不管过程我只要结果"
- [ ] 你跟PM对齐了但PM忘了，又来问你
- [ ] PM在Slack上找你要进度，每两小时一次
- [ ] AI分析了需求说"这个需求不清晰"，给PM看

## 13-with-backend 跟后端沟通

- [x] 接口文档没写清楚 / 过期了 — "The doc still shows display_name"
- [x] 后端改了字段没通知 — "That field is deprecated. We use full_name now."
- [x] 后端说"你那个请求参数错了"，但明明按文档传的
- [x] 返回的数据量太大 / 响应慢 — "It takes 8 seconds"
- [x] 后端环境没启动 — 连不上
- [x] 后端说"这个前端处理一下" / 推给前端
- [x] 联调发现数据格式不对
- [ ] 联调排期对不上 — "When are you available to test together?"
- [ ] 后端返回了错误码没说清楚 — "Can you add more context to the error message?"
- [ ] 跟后端讨论接口设计 — "How about we structure it like this?"
- [ ] 后端接口好不容易调通了，一部署又挂了
- [ ] 后端改了数据结构没告诉你，你页面炸了
- [ ] "这个接口还在开发" — 但你下周就要上线
- [ ] 后端给你的数据里有个字段有时有有时没有
- [ ] 联调发现后端返回的是英文，前端要中文
- [ ] 后端说"这个你问一下另一个后端" — 踢皮球

## 14-with-designer 跟设计师沟通

- [x] 设计稿实现不了 — "It requires a library we don't have"
- [x] 设计稿没考虑到加载状态 / 空状态 — "You didn't include the loading state"
- [x] 设计稿交互太复杂 / 动效说简单其实难
- [x] 设计稿跟设计系统不一致 — "It doesn't match our design system"
- [x] 让AI帮忙生成设计稿 / 设计说不行
- [x] 设计稿更新了没告诉你
- [ ] 设计稿像素级还原 — "Does it need to be pixel perfect?"
- [ ] 设计师说你做得不对 — "The spacing doesn't match the design"
- [ ] 设计师改稿频繁 — "Can we freeze the design?"
- [ ] 设计师给的稿子跟开发平台不兼容
- [ ] 设计稿用了系统没有的字体
- [ ] 你按设计稿做完了，设计师说"感觉不太对"
- [ ] 设计师给的是 Figma 原型但没有标注

## 15-user-guidance 用户操作指导

- [x] 用户说"不好用"但说不清 — "What are you trying to do?"
- [x] 用户不会用 — let me walk you through
- [x] 用户说以前的版本更好 — "The old version had it"
- [x] 用户报bug但复现不了 — "Can you send me a screenshot?"
- [x] 用户用了旧缓存 — "Try clearing your cache"
- [x] 用户报的问题其实是网络问题
- [x] 功能还没有 — "That feature isn't available yet"
- [ ] 用户说"跟预期不一样" — "What were you expecting to happen?"
- [ ] 教了很多次还不会 — "Let me put together a quick guide"
- [ ] 用户截图但截的是整个屏幕，你的隐私暴露了
- [ ] 用户说"我不懂技术"但还坚持要给技术建议
- [ ] 用户说"我按你说的做了但还是不行" — 其实没按
- [ ] 你远程帮用户操作，用户说你"在控制我的电脑"
- [ ] 用户说"能不能加一个功能" — 其实已有的
- [ ] 你把操作步骤写了文档，用户说"太长了不想看"
- [ ] 用AI生成了用户文档，用户说看不懂AI英语

## 16-task-assignment 派发任务

- [x] 任务没人想做 — (silence) / "Anyone?"
- [x] 被安排做不想做的任务 — "I'd prefer to finish my current task first"
- [x] 对方说做不了 / 没做过 — "I've never done this before"
- [x] 新人需要指导 — "Can you pair with X?"
- [x] 紧急打断 — "It's higher priority. Drop what you're doing."
- [x] 安排任务的人自己都说不清要做什么
- [x] 把 AI 做不了的脏活推给别人
- [ ] 给别人派任务怕对方不爽 — "Are you free to pick this up?"
- [ ] 对方问时间要求 — "ASAP would be great"
- [ ] 任务分得不公平 — "X has been handling a lot already"
- [ ] 让AI先做一部分
- [ ] 你被分到一个你完全不懂的领域
- [ ] 任务拆分太细，一天要做10个task
- [ ] 绩效评估的时候发现你做的事没人知道
- [ ] 把不喜欢的事推给AI，但AI做得不行还得你改
- [ ] 有人假装不会做来逃避任务
- [ ] "这个让新人练手" — 实际上是脏活

## 17-help-colleague 帮同事解决问题

- [x] 同事的问题你自己也不懂 / 一起排查 — "Let me take a look"
- [x] 同事代码看不懂 / 不知道哪错了 — "Show me what's happening"
- [x] 同事改了一下午不如你五分钟 — "You're missing a dependency"
- [x] 远程帮同事 — "Can you share your screen?"
- [x] 同事问你AI相关 / AI帮倒忙 — "I tried AI but it suggested something wrong"
- [x] 觉得同事方向不对 / 想复杂了
- [x] 同事问的问题AI能答但来问你
- [x] 帮完感谢 — "Thanks, I owe you one"
- [ ] 你帮了同事一下午，结果他老板以为是他做的
- [ ] 同事的问题其实是产品问题，不是技术问题
- [ ] 你给同事讲了解决方案，他转头问AI做得对不对
- [ ] 同事说"我试了AI给的方案不行" — 其实是prompt写错了
- [ ] 同事每次都来问你，自己从来不动手
- [ ] 你发现同事的代码是你上周帮他写的，他完全没理解
- [ ] 远程帮同事，但他共享屏幕找不到文件

## 18-debugging 排查问题

- [x] 刚才还好好的突然坏了 — "It was working yesterday"
- [x] 本地OK上了环境就炸
- [x] 一步步缩小范围 — "Let me comment out the new code"
- [x] 发现是别人的代码埋的坑 — "Tom's change broke it"
- [x] 排查了半天发现是配置问题
- [x] 叫同事一起看 — "Let me take a look"
- [x] 把报错贴给AI — AI帮忙确认
- [x] 用二分法排查 — "Let me revert and test"
- [ ] 不知道从哪开始 — "I don't even know where to start"
- [ ] 怀疑是缓存 — "Let me clear cache"
- [ ] 加console.log找不到 — "Let me add some debug logs"
- [ ] AI排查问题给了我线索
- [ ] AI生成的代码引入了bug
- [ ] 找bug找了半天发现是少了个分号/括号
- [ ] 一个bug复现概率50%，怎么都抓不到规律
- [ ] 把日志发给AI分析，AI说"检查一下X"，结果X没问题
- [ ] 你怀疑是别人的代码但不敢说
- [ ] 所有方案都试了，最后重启解决了
- [ ] AI debug了半天结论是"需要更多上下文"
- [ ] 你debug的时候修了一个bug又引入了一个
- [ ] 去 Stack Overflow 搜到的方案是错的
- [ ] debug了两小时发现是环境变量没配

## 19-asking-for-help 请求帮助

- [x] 不知道怎么描述问题 — "Let me share my screen"
- [x] 不好意思打扰别人 — "Do you have a sec? Quick question"
- [x] 别人给了方案你听不懂 — "I'm not sure I follow"
- [x] 问题很蠢 — "This might be a stupid question"
- [x] 问完自己解决了 — "Never mind, I figured it out"
- [x] 别人在忙需要等
- [x] 问AI比自己查快
- [ ] 别人讲太快听不懂 — "Can you slow down a bit?"
- [ ] 问了一个人就够 — "Is there someone who knows this area?"
- [ ] 你问的问题别人也不会 — "Asked a few people but no one knows"
- [ ] AI解决了但不知道为什么
- [ ] 你问了个问题但别人给了你AI的答案，很空洞
- [ ] 别人回答你的问题时一直在看屏幕，明显在问AI
- [ ] 你问了一个你觉得很蠢的问题，大家沉默了
- [ ] 你发现问AI比问同事快，但怕同事觉得你不尊重他
- [ ] 你问了两遍"can you clarify that"还是没懂
- [ ] "我跟我之前遇到的一样" — 但其实不一样

## 20-technical-discussion 技术方案讨论

- [x] 有人提了一个你不认同的方案 — "It adds complexity"
- [x] 讨论越来越抽象 — "Let's do a spike"
- [x] 有人提的方案太复杂 — "I think it's over-engineered"
- [x] 用AI来佐证 / 做原型 — "I'll prototype it with AI"
- [x] "先做个prototype看看" — spike
- [x] "这个用AI能搞定" — 但实际不一定
- [ ] 你没想好但被点名 — "I need to think about it more"
- [ ] 有人引入不相关的东西 — "I don't think that applies here"
- [ ] 互相推拉没结果 — "Let's agree to disagree and do a spike"
- [ ] 两个方案选哪个 — "What's the tradeoff?"
- [ ] 决定不做 — "The cost outweighs the benefit"
- [ ] 留技术债 — "We can refactor later"
- [ ] 讨论了半小时发现两个方案其实一样
- [ ] 资深的工程师坚持用自己会的技术栈
- [ ] 你提的方案被否了，三个月后别人提了一样的被通过了
- [ ] 技术方案文档写了没人读
- [ ] 用AI生成了方案文档，被说"太表面了"
- [ ] "这个方案在上个公司用过，可以的" — 不一定适用

## 21-alignment-discussion 对齐会

- [x] 两边信息不对称 — "I thought we agreed on Wednesday"
- [x] 有人没参加会议 — "No one told me"
- [x] 大家不在一个频道上 — "Let's get on the same page"
- [x] 有人承诺了但没做 / 对外承诺 — "You shouldn't have committed without checking"
- [x] 两个团队都说"这是对方的事"
- [x] 你做完了你的部分但对方没做，项目delay了
- [x] "我以为上次已经决定了" — "没有，你理解错了"
- [x] 确认下一步 — "Let's make Friday happen"
- [ ] 之前的决定被推翻 — "I thought we decided on X last week"
- [ ] 跨团队信息差 — "Your team is doing X but my team is doing Y"
- [ ] 对齐了半天没结论 — "We need a follow-up meeting"
- [ ] 对齐会开完了但没人写会议纪要
- [ ] 会议上大家都说"好的好的"，但其实谁都不打算做
- [ ] 对齐会变成互相甩锅大会

## 22-on-call-incident 线上事故

- [x] 线上挂了被叫起来 — "Production is down. 503 errors"
- [x] 先回滚再说 — "Rolling back to the previous version"
- [x] 紧急修hotfix — "The hotfix has a memory leak"
- [x] 事后写postmortem — "Let me write it up tomorrow"
- [x] 跟manager解释事故原因
- [x] 告诉用户修好了 / 确认恢复
- [x] AI帮忙分析了日志
- [x] 凌晨被on-call叫醒
- [x] 线上挂了发现是别人的代码问题
- [ ] 发通告说"我们知道了"
- [ ] 紧急修好了但忘了通知大家
- [ ] 回滚之后发现回滚也出了问题
- [ ] postmortem变成了追责大会
- [ ] 说好的"下次一定加监控" — 一直没有加
- [ ] 线上bug修好了但root cause没找到
- [ ] AI建议的hotfix引入了新的bug

---

## 新增场景记录

| 日期 | 章节 | 新增内容 | 更新文件 |
|------|------|---------|---------|
| 2026-07-26 | 全部 | 大规模扩充幺蛾子清单 | scenarios-brainstorm.md |
| 2026-07-26 | 02-sprint-planning | 已写标记 [x] | scenarios-brainstorm.md |
| 2026-07-26 | 03-refinement | 已写标记 [x] | scenarios-brainstorm.md |
| 2026-07-26 | 04-test-review | 已写标记 [x] | scenarios-brainstorm.md |
| 2026-07-26 | 05-22 | 所有章节已写标记 [x] | scenarios-brainstorm.md |
