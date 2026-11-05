export type StoryMood = 'neutral' | 'happy' | 'worried' | 'angry' | 'tired' | 'smug'
export type StoryScene = 'standup' | 'meeting' | 'night' | 'review'
export type StoryQuality = 'good' | 'ok' | 'bad'
export type StoryKind = 'story' | 'promotion' | 'interview' | 'romance' | 'crisis'
export type CareerTrack = 'frontend' | 'fullstack'
export type StorySide = 'far-left' | 'inner-left' | 'left' | 'center' | 'right' | 'inner-right' | 'far-right'
export type StoryHair = 'short' | 'bob' | 'bun' | 'wave' | 'side'
export type AvatarFace = 'oval' | 'round' | 'square'
export type AvatarEyes = 'dot' | 'sharp' | 'soft'
export type AvatarOutfit = 'shirt' | 'blazer' | 'hoodie' | 'tee' | 'turtleneck'
export type AvatarAccessory = 'none' | 'glasses' | 'headphones' | 'earrings' | 'lanyard'

/** A character is assembled from these fixed parts. */
export interface AvatarConfig {
  face: AvatarFace
  eyes: AvatarEyes
  outfit: AvatarOutfit
  accessory: AvatarAccessory
}

export interface StoryCharacter {
  id: string
  name: string
  roleZh: string
  color: string
  hair: StoryHair
  hairColor: string
  skin: string
  side: StorySide
  avatar: AvatarConfig
  taglineZh: string
  bioZh: string
}

export interface StoryLanguageFocus {
  en: string
  zh: string
  noteZh: string
}

export interface StoryChallenge {
  zh: string
  minGood: number
  maxBad?: number
  minTrust?: number
}

/** A professional-knowledge card unlocked by an episode. */
export interface StoryKnowledge {
  id: string
  titleZh: string
  titleEn: string
  summaryZh: string
  pointsZh: string[]
  track?: CareerTrack
}

export interface StoryChoice {
  id: string
  en: string
  zh: string
  quality: StoryQuality
  noteZh: string
  trust?: Record<string, number>
  /** Permanent insight earned the first time this choice is taken. */
  insight?: number
  /** Choice is only selectable once the player has this much insight. */
  requiresInsight?: number
  next: string
}

export interface StoryBeat {
  id: string
  speaker: string
  mood?: StoryMood
  en: string
  zh: string
  scene?: StoryScene
  choices?: StoryChoice[]
  next?: string
  /** Resolve the ending from the choices the player made. */
  ending?: 'auto'
}

export interface StoryEnding {
  id: string
  titleZh: string
  titleEn: string
  bodyZh: string
  tone: StoryQuality
  /** The player gets fired in this ending. */
  fired?: boolean
}

export interface CareerTrackDef {
  id: CareerTrack
  titleZh: string
  titleEn: string
  taglineZh: string
  descriptionZh: string
  color: string
  /** Rank titles override the default (frontend-oriented) career ladder. */
  rankTitles: Record<number, { titleZh: string; titleEn: string }>
}

export interface StoryArc {
  id: string
  titleZh: string
  titleEn: string
  taglineZh: string
  descriptionZh: string
  color: string
  unlockRank?: number
  episodeIds: string[]
}

export interface StoryEpisode {
  id: string
  arcId: string
  chapterId: string
  order: number
  kind: StoryKind
  titleZh: string
  titleEn: string
  taglineZh: string
  scene: StoryScene
  characters: StoryCharacter[]
  positions?: Record<string, StorySide>
  start: string
  beats: Record<string, StoryBeat>
  endings: Record<StoryQuality, StoryEnding>
  challenge: StoryChallenge
  languageFocus: StoryLanguageFocus[]
  /** Professional knowledge unlocked with the episode. */
  knowledge?: StoryKnowledge[]
  careerPoints: number
  unlockAt?: number
  requiresRank?: number
  /** Requires a specific episode to be completed first. */
  requiresEpisode?: string
  /** Only visible on this career track. */
  track?: CareerTrack
  /** Requires the matching track-specific episode to be completed first. */
  requiresTrackEpisode?: boolean
  /** Passing the challenge promotes the player to this career level. */
  promotionTo?: number
  /** Score = good +2 / ok 0 / bad -2 per choice. */
  goodAt: number
  badAt: number
}

export const STORY_CHARACTERS: Record<string, StoryCharacter> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    roleZh: 'Tech Lead',
    color: '#5eead4',
    hair: 'short',
    hairColor: '#2b2624',
    skin: '#e8b98f',
    avatar: { face: 'square', eyes: 'sharp', outfit: 'shirt', accessory: 'glasses' },
    side: 'left',
    taglineZh: '话不多，标准高。',
    bioZh: '你永远不想在站会上被他点名。但他真的会留下来陪你结对。',
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah',
    roleZh: 'Product Manager',
    color: '#fbbf24',
    hair: 'bob',
    hairColor: '#6b3f2a',
    skin: '#f0c8a0',
    avatar: { face: 'oval', eyes: 'sharp', outfit: 'blazer', accessory: 'earrings' },
    side: 'right',
    taglineZh: '永远在催进度。',
    bioZh: '她说的「很小」通常不小。她说的「客户很急」通常是真的。',
  },
  mark: {
    id: 'mark',
    name: 'Mark',
    roleZh: 'Backend',
    color: '#c4b5fd',
    hair: 'wave',
    hairColor: '#1f1a17',
    skin: '#c98d63',
    avatar: { face: 'round', eyes: 'soft', outfit: 'hoodie', accessory: 'headphones' },
    side: 'center',
    taglineZh: '看起来很困，其实什么都知道。',
    bioZh: '后端。讨厌被甩锅，但如果你先动手，他会半夜起来帮你回滚。',
  },
  lisa: {
    id: 'lisa',
    name: 'Lisa',
    roleZh: 'QA',
    color: '#86efac',
    hair: 'bun',
    hairColor: '#3b2a3d',
    skin: '#f2d1b3',
    avatar: { face: 'round', eyes: 'soft', outfit: 'tee', accessory: 'lanyard' },
    side: 'right',
    taglineZh: '她记得你上个月漏掉的边界情况。',
    bioZh: 'QA。不生气，只记录。她的回归测试比你的人生规划还完整。',
  },
  tom: {
    id: 'tom',
    name: 'Tom',
    roleZh: 'Junior Frontend',
    color: '#fb923c',
    hair: 'side',
    hairColor: '#4a2f1b',
    skin: '#f3c9a5',
    avatar: { face: 'oval', eyes: 'soft', outfit: 'hoodie', accessory: 'none' },
    side: 'right',
    taglineZh: '热情、紧张，AI 说的话他都信。',
    bioZh: '新来的前端。会主动帮忙，也会在 review 里问出让全场安静的问题。',
  },
  diana: {
    id: 'diana',
    name: 'Diana',
    roleZh: 'Engineering Manager',
    color: '#f9a8d4',
    hair: 'wave',
    hairColor: '#2f2230',
    skin: '#e7b894',
    avatar: { face: 'oval', eyes: 'soft', outfit: 'blazer', accessory: 'earrings' },
    side: 'center',
    taglineZh: '她不会大声说话，但她记得每一次承诺。',
    bioZh: 'Engineering Manager。升职答辩的拍板人。温和，但不好糊弄。',
  },
  nina: {
    id: 'nina',
    name: 'Nina',
    roleZh: 'Headhunter',
    color: '#7dd3fc',
    hair: 'bob',
    hairColor: '#1f2a33',
    skin: '#d9a97e',
    avatar: { face: 'square', eyes: 'sharp', outfit: 'blazer', accessory: 'earrings' },
    side: 'left',
    taglineZh: '她只记得数字和故事。',
    bioZh: '资深猎头。见过太多 VP，能一眼看出谁在背台词。',
  },
  kevin: {
    id: 'kevin',
    name: 'Kevin',
    roleZh: 'Senior Frontend',
    color: '#a3e635',
    hair: 'side',
    hairColor: '#2f2a1c',
    skin: '#d9a77d',
    avatar: { face: 'square', eyes: 'soft', outfit: 'shirt', accessory: 'none' },
    side: 'right',
    taglineZh: '他的 PR 永远「快好了」。',
    bioZh: '资深前端。会上抢功，出事消失，复盘时说他早就提醒过。你永远能在别人的 commit 里找到他的名字。',
  },
  victor: {
    id: 'victor',
    name: 'Victor',
    roleZh: 'Principal Engineer',
    color: '#f472b6',
    hair: 'short',
    hairColor: '#22201f',
    skin: '#c98d63',
    avatar: { face: 'square', eyes: 'dot', outfit: 'turtleneck', accessory: 'glasses' },
    side: 'left',
    taglineZh: '他说得都对，但没人想跟他开会。',
    bioZh: 'Principal Engineer。架构洁癖，能用四十分钟证明你的方案不行，但很少给替代方案。技术上很强，做同事很累。',
  },
}

const standup: StoryEpisode = {
  id: 'standup',
  arcId: 'promotion',
  chapterId: '01-daily-standup',
  order: 1,
  kind: 'story',
  titleZh: '站会修罗场',
  titleEn: 'Standup Survival',
  taglineZh: '咖啡还没喝一口，全组都在等你汇报。',
  scene: 'standup',
  characters: [STORY_CHARACTERS.alex, STORY_CHARACTERS.sarah, STORY_CHARACTERS.mark],
  positions: { alex: 'left', mark: 'center', sarah: 'right' },
  start: 'intro',
  challenge: {
    zh: '至少 3 个好选择，且一次都不甩锅',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "Still on it. I'm down to one issue, but I need today.",
      zh: '还在弄。只剩一个问题，但今天还得给我。',
      noteZh: '承认没做完，同时给出明确时间点，比「快好了」可信。',
    },
    {
      en: 'I can do it, but not this sprint. Which task should I drop?',
      zh: '能做，但这个迭代不行。你想让我砍掉哪个？',
      noteZh: '不直接拒绝，把取舍交回给 PM。',
    },
    {
      en: "I'll rebase after standup and ping you before I push.",
      zh: '站会后我 rebase，推之前跟你说。',
      noteZh: '主动处理冲突，同时让对方知道节奏。',
    },
  ],
  careerPoints: 20,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '稳住了',
      titleEn: 'You held the line',
      bodyZh:
        'Alex 留下来陪你结对，Sarah 把字段需求挪到了下个迭代，Mark 甚至给你带了杯咖啡。今天还能救。',
      tone: 'good',
    },
    ok: {
      id: 'neutral',
      titleZh: '勉强过关',
      titleEn: 'You survived. Barely.',
      bodyZh:
        '你熬过了站会，但名字上了 Sarah 的风险清单，Alex 下午两点还会来问进度。至少没人当场爆炸。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '被盯上了',
      titleEn: 'On Alex’s list',
      bodyZh:
        'Alex 现在每天早上都点你的名，Sarah 把字段加进了这个迭代，Mark 还在等你的 rebase。你成了站会的固定节目。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'standup',
      en: 'Monday, 9:59. You walk into standup with a coffee you probably will not finish.',
      zh: '周一早上 9:59。你端着咖啡走进站会，这杯大概又喝不完了。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'neutral',
      en: "Let's start. How's the login fix?",
      zh: '开始吧。登录修复怎么样了？',
      choices: [
        {
          id: 'a1-good',
          en: "Still on it. I'm down to one issue, but I need today.",
          zh: '还在弄。现在只剩一个问题，但今天还得给我。',
          quality: 'good',
          noteZh: '承认没做完，但给出明确时间，比「快好了」可信得多。',
          trust: { alex: 6, sarah: 2 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'Almost there. Should be done soon.',
          zh: '快好了，应该很快。',
          quality: 'ok',
          noteZh: '太模糊。Alex 下一秒就会追问「很快」到底是哪天。',
          trust: { alex: -2 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: "Backend's API doc is still wrong.",
          zh: '后端的 API 文档还是不对。',
          quality: 'bad',
          noteZh: '甩锅不能解释你的进度，还会把 Mark 拉下水。',
          trust: { alex: -4, mark: -8 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: "One issue. Okay. What's actually left?",
      zh: '还剩一个问题？行。到底是什么？',
      next: 'c2',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: "Soon isn't a date. What's actually left?",
      zh: '「很快」不是日期。到底还剩什么？',
      next: 'c2',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'mark',
      mood: 'tired',
      en: "My doc? The endpoint changed last week. You didn't update your client.",
      zh: '我的文档？接口上周就改了，是你没更新客户端。',
      next: 'c2',
    },
    c2: {
      id: 'c2',
      speaker: 'alex',
      mood: 'neutral',
      en: "What's actually left?",
      zh: '到底还剩什么？',
      choices: [
        {
          id: 'c2-good',
          en: "The token refresh. I can reproduce it, but the fix isn't stable yet.",
          zh: 'token 刷新。我能复现，但修复还不稳定。',
          quality: 'good',
          noteZh: '具体到问题，显得可控；也给了 Alex 一个能帮忙的抓手。',
          trust: { alex: 5 },
          next: 'c2-good-reply',
        },
        {
          id: 'c2-ok',
          en: 'A few edge cases.',
          zh: '几个边界情况。',
          quality: 'ok',
          noteZh: '不算错，但太笼统。Alex 没法判断风险。',
          trust: { alex: -1 },
          next: 'c2-ok-reply',
        },
        {
          id: 'c2-bad',
          en: "It's harder than I thought.",
          zh: '比我想的难。',
          quality: 'bad',
          noteZh: '没有信息量，只会让全组更焦虑。',
          trust: { alex: -4, sarah: -2 },
          next: 'c2-bad-reply',
        },
      ],
    },
    'c2-good-reply': {
      id: 'c2-good-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Okay. Bring it to me after standup. We’ll pair on it.',
      zh: '行。站会后来找我，我们一起看。',
      next: 's1',
    },
    'c2-ok-reply': {
      id: 'c2-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: 'Edge cases can eat a week. Show me after standup.',
      zh: '边界情况能吃掉一周。站会后给我看。',
      next: 's1',
    },
    'c2-bad-reply': {
      id: 'c2-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'That is not an update. After standup. Bring your notes.',
      zh: '这不叫进度。站会后带着笔记来找我。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'happy',
      en: 'One more thing — can we add a field to the user profile? It’s tiny.',
      zh: '还有件事——用户资料加个字段，很小的需求。',
      choices: [
        {
          id: 's1-good',
          en: 'I can do it, but not this sprint. Which task should I drop?',
          zh: '能做，但这个迭代不行。你想让我砍掉哪个？',
          quality: 'good',
          noteZh: '不直接拒绝，把取舍交回给 PM。她要么砍别的，要么自己放弃。',
          trust: { sarah: 4, alex: 3 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: "I'll see what I can do.",
          zh: '我看看能不能做。',
          quality: 'ok',
          noteZh: '模糊答应，最后还是会爆。但至少没当场把话说死。',
          trust: { sarah: 1 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'Sure, no problem.',
          zh: '行，没问题。',
          quality: 'bad',
          noteZh: '你已经三个任务了。这句「没问题」会变成你周末的问题。',
          trust: { sarah: 3, alex: -3 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Which task? Hmm. Let me look at the board.',
      zh: '砍哪个？嗯……我看看板。',
      next: 'm1',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'happy',
      en: "Great. I'll add it to the sprint.",
      zh: '太好了，我把它加进迭代。',
      next: 'm1',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'sarah',
      mood: 'happy',
      en: 'Thanks! I knew I could count on you.',
      zh: '谢谢！我就知道能指望你。',
      next: 'm1',
    },
    m1: {
      id: 'm1',
      speaker: 'mark',
      mood: 'tired',
      en: 'Also, your branch has a merge conflict with mine.',
      zh: '还有，你的分支跟我的有冲突。',
      choices: [
        {
          id: 'm1-good',
          en: "I'll rebase after standup and ping you before I push.",
          zh: '站会后我 rebase，推之前跟你说。',
          quality: 'good',
          noteZh: '主动处理冲突，还让对方知道节奏。Mark 不用猜。',
          trust: { mark: 6, alex: 2 },
          next: 'm1-good-reply',
        },
        {
          id: 'm1-ok',
          en: "I'll fix it today.",
          zh: '我今天修。',
          quality: 'ok',
          noteZh: '可以，但没有时间点。Mark 可能会一直等你。',
          trust: { mark: 1 },
          next: 'm1-ok-reply',
        },
        {
          id: 'm1-bad',
          en: 'You merged first. You fix it.',
          zh: '你先合的，你修。',
          quality: 'bad',
          noteZh: '站会上公开甩锅。Mark 会记住这句话很久。',
          trust: { mark: -8, alex: -3 },
          next: 'm1-bad-reply',
        },
      ],
    },
    'm1-good-reply': {
      id: 'm1-good-reply',
      speaker: 'mark',
      mood: 'happy',
      en: 'Sounds good. Ping me.',
      zh: '行，推之前跟我说。',
      next: 'final',
    },
    'm1-ok-reply': {
      id: 'm1-ok-reply',
      speaker: 'mark',
      mood: 'neutral',
      en: "Okay. Don't wait too long.",
      zh: '行，别拖太久。',
      next: 'final',
    },
    'm1-bad-reply': {
      id: 'm1-bad-reply',
      speaker: 'mark',
      mood: 'angry',
      en: 'Wow. Okay.',
      zh: '行吧。真行。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'The standup ends. Alex closes the laptop. Sarah is already typing in the sprint board.',
      zh: '站会结束了。Alex 合上电脑，Sarah 已经在迭代看板上打字。',
      ending: 'auto',
    },
  },
}

const pmDeadline: StoryEpisode = {
  id: 'pm-deadline',
  arcId: 'promotion',
  chapterId: '12-with-pm',
  order: 2,
  kind: 'story',
  titleZh: 'PM 的周五',
  titleEn: 'The Friday Promise',
  taglineZh: '客户想下周五看到仪表盘。现在周三下午四点二十。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.sarah, STORY_CHARACTERS.alex, STORY_CHARACTERS.lisa],
  positions: { sarah: 'right', alex: 'left', lisa: 'center' },
  start: 'intro',
  challenge: {
    zh: '让 Sarah 接受范围，且不承诺做不完的事',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: 'We can do the core charts by Friday, but not the export.',
      zh: '周五能做核心图表，但导出做不了。',
      noteZh: '先给范围，再给承诺。PM 拿到能演示的东西，你拿到可执行的边界。',
    },
    {
      en: "The charts with mocked data. I'll label it clearly.",
      zh: '用 mock 数据的图表，我会标清楚。',
      noteZh: '既满足「看到东西」，又不假装功能已经完成。',
    },
    {
      en: "It's a new endpoint. If we add it, the charts slip to Monday.",
      zh: '那是个新接口。要加的话，图表得推到周一。',
      noteZh: '把成本和取舍说清楚，让对方自己选。',
    },
  ],
  careerPoints: 20,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '谈判成功',
      titleEn: 'Deal, not surrender',
      bodyZh:
        '你保住了周五的核心演示，也保住了团队的周末。客户看到了图表，Sarah 学会了先问范围。',
      tone: 'good',
    },
    ok: {
      id: 'neutral',
      titleZh: '惊险过关',
      titleEn: 'Demo day, survived',
      bodyZh: '演示勉强过了，但周一要还技术债。Sarah 觉得你「还能再挤一挤」。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '周五的烟花',
      titleEn: 'Demo day, on fire',
      bodyZh:
        'mock 数据被客户当真，QA 在会上才发现。复盘会开了三个小时，你的名字出现了很多次。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'Wednesday, 4:20 p.m. Sarah closes the door. This is never a quick chat.',
      zh: '周三下午 4:20。Sarah 关上了门。这种会从来不会「很快结束」。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'worried',
      en: 'The client wants the dashboard by next Friday. Can we do it?',
      zh: '客户想下周五看到仪表盘。能做吗？',
      choices: [
        {
          id: 's1-good',
          en: 'We can do the core charts by Friday, but not the export.',
          zh: '周五能做核心图表，但导出做不了。',
          quality: 'good',
          noteZh: '先给范围，再给承诺。PM 拿到能演示的东西，你拿到可执行的边界。',
          trust: { sarah: 5, alex: 3 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: "It's tight, but we'll try.",
          zh: '很紧，但我们尽量。',
          quality: 'ok',
          noteZh: '「尽量」在 PM 耳朵里约等于「可以」。周五你还是会失信。',
          trust: { sarah: 1 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'No way. That’s impossible.',
          zh: '不可能，做不了。',
          quality: 'bad',
          noteZh: '太直接。Sarah 不会接受「不」，她会去找 Alex 施压。',
          trust: { sarah: -6, alex: -2 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Core charts. Okay. The client doesn’t care about the export. They just want to see something.',
      zh: '核心图表，行。客户不在乎导出，他们只想看到东西。',
      next: 'a1',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'worried',
      en: 'Try isn’t a date. What can you actually show me on Friday?',
      zh: '「尽量」不是日期。周五到底能给我看什么？',
      next: 'a1',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: 'Impossible? Let me get Alex in here.',
      zh: '不可能？我把 Alex 叫来。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Before we promise anything — what’s actually demoable?',
      zh: '在承诺之前先问一句——到底有什么能演示？',
      choices: [
        {
          id: 'a1-good',
          en: "The charts with mocked data. I'll label it clearly.",
          zh: '用 mock 数据的图表。我会标清楚。',
          quality: 'good',
          noteZh: '既满足「看到东西」，又不假装功能已经完成。',
          trust: { alex: 6, sarah: 2 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'The charts. Maybe the filters.',
          zh: '图表吧。筛选也许能带上。',
          quality: 'ok',
          noteZh: '「也许」会让所有人按最乐观的版本准备。',
          trust: { alex: -1 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'We can make it look real.',
          zh: '我们可以做得像真的一样。',
          quality: 'bad',
          noteZh: '在客户演示里造假数据，是事故复盘的经典开头。',
          trust: { alex: -8, sarah: 1 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: 'Good. Mocked and labeled. Does QA know?',
      zh: '好。mock 数据，标清楚。QA 知道吗？',
      next: 'l1',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: 'Maybe isn’t a demo plan.',
      zh: '「也许」不叫演示方案。',
      next: 'l1',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'No. We don’t fake data in a client demo.',
      zh: '不行。客户演示里不能造假数据。',
      next: 'l1',
    },
    l1: {
      id: 'l1',
      speaker: 'lisa',
      mood: 'worried',
      en: 'If it’s mocked, I need to know before the demo. I don’t want to answer questions about fake numbers.',
      zh: '如果是 mock 的，演示前得告诉我。我不想在会上被问假数字。',
      choices: [
        {
          id: 'l1-good',
          en: "Agreed. I'll add a demo-data banner and send you the script.",
          zh: '同意。我加个「演示数据」标识，把脚本发你。',
          quality: 'good',
          noteZh: '透明，而且给了 QA 能核对的东西。事故率直接减半。',
          trust: { lisa: 6, alex: 4 },
          next: 'l1-good-reply',
        },
        {
          id: 'l1-ok',
          en: "I'll tell you the day before.",
          zh: '我提前一天告诉你。',
          quality: 'ok',
          noteZh: '提前一天有点晚，但至少不是会上才说。',
          trust: { lisa: 1 },
          next: 'l1-ok-reply',
        },
        {
          id: 'l1-bad',
          en: "It's just a demo. Don't worry about it.",
          zh: '就是个演示，别担心。',
          quality: 'bad',
          noteZh: 'QA 最讨厌这句话。真出问题时，她会是第一个被问的人。',
          trust: { lisa: -7, alex: -2 },
          next: 'l1-bad-reply',
        },
      ],
    },
    'l1-good-reply': {
      id: 'l1-good-reply',
      speaker: 'lisa',
      mood: 'happy',
      en: 'Banner and script. That works.',
      zh: '有标识有脚本，行。',
      next: 's2',
    },
    'l1-ok-reply': {
      id: 'l1-ok-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'The day before is cutting it close.',
      zh: '提前一天有点赶。',
      next: 's2',
    },
    'l1-bad-reply': {
      id: 'l1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'Famous last words.',
      zh: '行，别说我没提醒你。',
      next: 's2',
    },
    s2: {
      id: 's2',
      speaker: 'sarah',
      mood: 'happy',
      en: 'Also, can we add a filter by region? It’s the same thing, right?',
      zh: '还有，能加个按地区筛选吗？一样的吧？',
      choices: [
        {
          id: 's2-good',
          en: 'It’s a new endpoint. If we add it, the charts slip to Monday.',
          zh: '那是个新接口。要加的话，图表得推到周一。',
          quality: 'good',
          noteZh: '把成本和取舍说清楚，让 Sarah 自己选。',
          trust: { sarah: 3, alex: 4 },
          next: 's2-good-reply',
        },
        {
          id: 's2-ok',
          en: 'Maybe. Let me check with backend.',
          zh: '也许吧，我跟后端确认一下。',
          quality: 'ok',
          noteZh: '拖延保命，但 Sarah 会默认你答应了。',
          trust: { sarah: 1 },
          next: 's2-ok-reply',
        },
        {
          id: 's2-bad',
          en: 'Sure, it’s just a filter.',
          zh: '行，就是个筛选。',
          quality: 'bad',
          noteZh: '你又给自己挖了一个坑，还顺手把后端拖进来。',
          trust: { sarah: 4, alex: -4 },
          next: 's2-bad-reply',
        },
      ],
    },
    's2-good-reply': {
      id: 's2-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Monday. Okay. Let’s stick to Friday and skip the filter.',
      zh: '周一啊。行，那就先保周五，筛选先不加。',
      next: 'final',
    },
    's2-ok-reply': {
      id: 's2-ok-reply',
      speaker: 'sarah',
      mood: 'worried',
      en: 'Check fast. I need an answer today.',
      zh: '快点确认。我今天就要答案。',
      next: 'final',
    },
    's2-bad-reply': {
      id: 's2-bad-reply',
      speaker: 'sarah',
      mood: 'happy',
      en: 'Great! I’ll tell the client it’s included.',
      zh: '太好了！我跟客户说这个也包含。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Friday, 10:00 a.m. The demo starts in an hour. The dashboard is on the big screen.',
      zh: '周五上午 10:00。演示还有一小时开始，仪表盘已经投到大屏幕上。',
      ending: 'auto',
    },
  },
}

const oncallNight: StoryEpisode = {
  id: 'oncall-night',
  arcId: 'promotion',
  chapterId: '22-on-call-incident',
  order: 3,
  kind: 'story',
  titleZh: 'on-call 之夜',
  titleEn: 'The 1:47 A.M. Call',
  taglineZh: '生产 503，手机在床头震个不停。',
  scene: 'night',
  characters: [STORY_CHARACTERS.alex, STORY_CHARACTERS.mark, STORY_CHARACTERS.lisa],
  positions: { alex: 'left', mark: 'center', lisa: 'right' },
  start: 'intro',
  challenge: {
    zh: '先止血再复盘，且一次都不甩锅',
    minGood: 2,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "I'm on. Let's roll back the afternoon hotfix first.",
      zh: '我上线了。先回滚下午那个 hotfix。',
      noteZh: '线上事故第一原则：先止血，再找根因。',
    },
    {
      en: 'No blame now. Can you check the memory graph while I roll back?',
      zh: '先不追责。我回滚，你看内存曲线。',
      noteZh: '分工明确，先恢复服务。复盘留到明天。',
    },
    {
      en: "We'll add a load test to the release checklist.",
      zh: '把压力测试加进发布清单。',
      noteZh: '把事故变成流程改进，而不是找一个人背锅。',
    },
  ],
  careerPoints: 20,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '稳住局面',
      titleEn: 'Back online',
      bodyZh:
        '你在二十分钟内恢复了服务，复盘会上提出三条改进。Alex 在群里说了一句「nice work」，这在他身上很罕见。',
      tone: 'good',
    },
    ok: {
      id: 'neutral',
      titleZh: '有惊无险',
      titleEn: 'All hands, all night',
      bodyZh: '服务恢复了，但复盘开了三个小时。每个人都累到不想说话，至少没人被单独点名。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '事故扩大',
      titleEn: 'Rollback too late',
      bodyZh:
        '回滚太晚，老板也进了群。第二天的复盘会从「哪里出了问题」变成了「谁该负责」。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'night',
      en: '1:47 a.m. Your phone vibrates. Then again. Then twelve more times.',
      zh: '凌晨 1:47。手机震了一下，又震了一下，然后连着震了十二下。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'worried',
      en: 'Production is down. Users can’t log in. I’m pulling up the logs.',
      zh: '生产挂了，用户登不上。我在拉日志。',
      choices: [
        {
          id: 'a1-good',
          en: 'I’m on. Let’s roll back the afternoon hotfix first.',
          zh: '我上线了。先回滚下午那个 hotfix。',
          quality: 'good',
          noteZh: '先止血，再找根因。线上事故的第一原则。',
          trust: { alex: 6, mark: 2 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'Let me check the logs first.',
          zh: '我先看日志。',
          quality: 'ok',
          noteZh: '可以，但每多一分钟，更多用户登不上。',
          trust: { alex: 1 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'It’s probably the backend.',
          zh: '可能是后端的问题。',
          quality: 'bad',
          noteZh: '先甩锅，事故不会等你。Mark 还在床上。',
          trust: { alex: -5, mark: -6 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Do it. I’ll watch the error rate.',
      zh: '回滚吧。我盯着错误率。',
      next: 'm1',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: 'Fast. We’re at 4,000 failed logins a minute.',
      zh: '快点。现在每分钟四千次登录失败。',
      next: 'm1',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'Mark is asleep. You’re on call. Check your side first.',
      zh: 'Mark 在睡觉。现在是你 on-call，先查你这边。',
      next: 'm1',
    },
    m1: {
      id: 'm1',
      speaker: 'mark',
      mood: 'tired',
      en: 'The hotfix is mine. But I tested it locally.',
      zh: 'hotfix 是我发的。但我本地测过。',
      choices: [
        {
          id: 'm1-good',
          en: 'No blame now. Can you check the memory graph while I roll back?',
          zh: '先不追责。我回滚，你看内存曲线。',
          quality: 'good',
          noteZh: '分工明确，先恢复服务。复盘留到明天。',
          trust: { mark: 6, alex: 3 },
          next: 'm1-good-reply',
        },
        {
          id: 'm1-ok',
          en: 'Did you test the error path?',
          zh: '你测错误路径了吗？',
          quality: 'ok',
          noteZh: '问题有价值，但现在不是问的时候。',
          trust: { mark: -1 },
          next: 'm1-ok-reply',
        },
        {
          id: 'm1-bad',
          en: 'So it’s your fault.',
          zh: '那就是你的锅。',
          quality: 'bad',
          noteZh: '事故现场甩锅，团队会记很久。',
          trust: { mark: -8, alex: -3 },
          next: 'm1-bad-reply',
        },
      ],
    },
    'm1-good-reply': {
      id: 'm1-good-reply',
      speaker: 'mark',
      mood: 'happy',
      en: 'On it. Memory is climbing. Rollback now.',
      zh: '好。内存还在涨，现在回滚。',
      next: 'l1',
    },
    'm1-ok-reply': {
      id: 'm1-ok-reply',
      speaker: 'mark',
      mood: 'worried',
      en: 'Not under load. I’ll check it after.',
      zh: '没测高负载。我回头查。',
      next: 'l1',
    },
    'm1-bad-reply': {
      id: 'm1-bad-reply',
      speaker: 'mark',
      mood: 'angry',
      en: 'Wow. Okay. I’m going back to sleep.',
      zh: '行。真行。那我继续睡了。',
      next: 'l1',
    },
    l1: {
      id: 'l1',
      speaker: 'lisa',
      mood: 'worried',
      en: 'QA signed off on the hotfix, but we didn’t test under load.',
      zh: 'QA 签过这个 hotfix，但我们没测高负载。',
      choices: [
        {
          id: 'l1-good',
          en: 'We’ll add a load test to the release checklist.',
          zh: '把压力测试加进发布清单。',
          quality: 'good',
          noteZh: '把事故变成流程改进，而不是找一个人背锅。',
          trust: { lisa: 5, alex: 4 },
          next: 'l1-good-reply',
        },
        {
          id: 'l1-ok',
          en: 'We should test more.',
          zh: '我们应该多测。',
          quality: 'ok',
          noteZh: '正确，但空泛。下周没人记得这句话。',
          trust: { lisa: 0 },
          next: 'l1-ok-reply',
        },
        {
          id: 'l1-bad',
          en: 'QA should have caught it.',
          zh: 'QA 应该发现的。',
          quality: 'bad',
          noteZh: '甩锅给 QA，下次没人会帮你兜底。',
          trust: { lisa: -8, alex: -2 },
          next: 'l1-bad-reply',
        },
      ],
    },
    'l1-good-reply': {
      id: 'l1-good-reply',
      speaker: 'lisa',
      mood: 'happy',
      en: 'I’ll write the checklist item tonight.',
      zh: '我今晚就把这条写进清单。',
      next: 'final',
    },
    'l1-ok-reply': {
      id: 'l1-ok-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'Sure. We say that every time.',
      zh: '行。每次我们都这么说。',
      next: 'final',
    },
    'l1-bad-reply': {
      id: 'l1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'Right. Because I wrote the code.',
      zh: '对。毕竟代码是我写的。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: '2:11 a.m. The error rate drops to zero. The incident channel goes quiet. Tomorrow, there will be a postmortem.',
      zh: '凌晨 2:11。错误率归零，事故频道安静下来。明天，还有一场复盘会等着你。',
      ending: 'auto',
    },
  },
}

const codeReview: StoryEpisode = {
  id: 'code-review',
  arcId: 'promotion',
  chapterId: '07-code-review',
  order: 4,
  kind: 'story',
  titleZh: 'PR 攻防战',
  titleEn: 'The PR Standoff',
  taglineZh: 'PR 开了三天，终于有人来看。评论比代码还长。',
  scene: 'review',
  characters: [STORY_CHARACTERS.alex, STORY_CHARACTERS.mark, STORY_CHARACTERS.tom],
  positions: { alex: 'left', mark: 'center', tom: 'right' },
  start: 'intro',
  challenge: {
    zh: '让 Alex 当场 LGTM，且不把锅甩给 AI',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "Thanks. I'll fix the nits and rewrite the error handling today.",
      zh: '谢谢。小问题我今天改，错误处理重写。',
      noteZh: '先认领，再给时间点。不要一条条辩解。',
    },
    {
      en: "It does too much. I'll split parsing and retry logic.",
      zh: '它确实管得太多了。我把解析和重试拆开。',
      noteZh: '同意问题，并给出具体拆法。',
    },
    {
      en: 'I reviewed the logic but missed the null case. Good catch.',
      zh: '逻辑我看过，但漏了 null 的情况。还好你发现了。',
      noteZh: '承认疏漏，同时肯定对方。比甩锅给 AI 有效。',
    },
  ],
  careerPoints: 20,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: 'LGTM',
      titleEn: 'Approved',
      bodyZh:
        'Alex 在六点前点了 approve，还留了一句「nice cleanup」。Tom 约你下周一起看他的 PR。你六点二十下班，算早的。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: 'Changes requested',
      titleEn: 'One more pass',
      bodyZh: 'PR 周一才合。Alex 又留了一条评论：「下次记得补测试。」不算灾难，但你的周末少了半天。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: 'PR 又躺了一周',
      titleEn: 'Stale again',
      bodyZh:
        'Alex request changes，Tom 不再找你帮忙，Sarah 在群里问这个功能为什么还没上线。PR 评论区变成了事故现场。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'review',
      en: 'Friday, 5:40 p.m. Your PR has been open for three days. Ten minutes ago, Tom accidentally posted a screenshot of the promotion shortlist — one slot, Sarah’s name, not yours. He deleted it. Everyone saw it anyway.',
      zh: '周五下午 5:40。你的 PR 开了三天，终于有人点了 review。十分钟前，Tom 手滑在群里发了一张晋升名单截图：一个名额，Sarah 的名字，没有你。他撤回了，但所有人都看见了。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'neutral',
      en: 'I left a few comments. Mostly nits, but the error handling worries me.',
      zh: '我留了几条评论。大多是小事，但错误处理让我有点担心。',
      choices: [
        {
          id: 'a1-good',
          en: "Thanks. I'll fix the nits and rewrite the error handling today.",
          zh: '谢谢。小问题我今天改，错误处理重写。',
          quality: 'good',
          noteZh: '先认领，再给时间点。Alex 要的是可控，不是完美。',
          trust: { alex: 5, tom: 1 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'Which ones are blocking?',
          zh: '哪些是必须改的？',
          quality: 'ok',
          noteZh: '问清楚没问题，但别让 Alex 觉得你在讨价还价。',
          trust: { alex: 0 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'The error handling works. AI wrote it.',
          zh: '错误处理没问题，AI 写的。',
          quality: 'bad',
          noteZh: '把 AI 当挡箭牌，Alex 只会在意你有没有认真 review 过。',
          trust: { alex: -6, tom: -2 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: 'Good. The nits can wait. Fix the handler first.',
      zh: '好。小事可以等，先修错误处理。',
      next: 't1',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'The error handling. Everything else is a nit.',
      zh: '错误处理。其他都是小事。',
      next: 't1',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'worried',
      en: 'AI wrote it — did you read it?',
      zh: 'AI 写的——你读过吗？',
      next: 't1',
    },
    t1: {
      id: 't1',
      speaker: 'tom',
      mood: 'happy',
      en: 'I can help with the tests. I’ve been using AI for test cases too.',
      zh: '我可以帮忙写测试。我最近也在用 AI 生成测试用例。',
      choices: [
        {
          id: 't1-good',
          en: "That’d help. Let’s split it — you take the null cases, I’ll fix the handler.",
          zh: '那太好了。我们分一下：你负责 null 的用例，我修处理逻辑。',
          quality: 'good',
          noteZh: '接受帮助，又给出清晰分工。Tom 会觉得自己真的有用。',
          trust: { tom: 6, alex: 2 },
          next: 't1-good-reply',
        },
        {
          id: 't1-ok',
          en: 'Sure, send me what you have.',
          zh: '行，把你现有的发我。',
          quality: 'ok',
          noteZh: '可以，但没说清楚你要什么，Tom 可能会发来一堆没用的。',
          trust: { tom: 2 },
          next: 't1-ok-reply',
        },
        {
          id: 't1-bad',
          en: 'No, AI tests are unreliable.',
          zh: '不用，AI 写的测试不靠谱。',
          quality: 'bad',
          noteZh: 'Tom 是在帮你。这句话只会让他下次不再开口。',
          trust: { tom: -6, alex: -2 },
          next: 't1-bad-reply',
        },
      ],
    },
    't1-good-reply': {
      id: 't1-good-reply',
      speaker: 'tom',
      mood: 'happy',
      en: 'Deal. I’ll push them to your branch.',
      zh: '行。我推到你的分支上。',
      next: 'a2',
    },
    't1-ok-reply': {
      id: 't1-ok-reply',
      speaker: 'tom',
      mood: 'neutral',
      en: 'Okay. I’ll send you everything.',
      zh: '好，我把全都发你。',
      next: 'a2',
    },
    't1-bad-reply': {
      id: 't1-bad-reply',
      speaker: 'tom',
      mood: 'worried',
      en: 'Oh. Okay. Never mind.',
      zh: '哦。行吧，那算了。',
      next: 'a2',
    },
    a2: {
      id: 'a2',
      speaker: 'alex',
      mood: 'neutral',
      en: 'This function is 120 lines. Can we split it?',
      zh: '这个函数 120 行。能拆一下吗？',
      choices: [
        {
          id: 'a2-good',
          en: 'Yeah, it does too much. I’ll split parsing and retry logic.',
          zh: '是，它管得太多了。我把解析和重试拆开。',
          quality: 'good',
          noteZh: '同意问题，并给出具体拆法。Alex 不用再猜你会不会做。',
          trust: { alex: 5, tom: 2 },
          next: 'a2-good-reply',
        },
        {
          id: 'a2-ok',
          en: 'It works, but I can split it if you want.',
          zh: '它能用，但你想拆的话我可以拆。',
          quality: 'ok',
          noteZh: '把决定权推回给 Alex，听起来像你并不认同。',
          trust: { alex: -1 },
          next: 'a2-ok-reply',
        },
        {
          id: 'a2-bad',
          en: 'Splitting it will just add more files.',
          zh: '拆了只会多出一堆文件。',
          quality: 'bad',
          noteZh: '这是 review 里最经典的防守姿势。Alex 会更坚持。',
          trust: { alex: -6, tom: -2 },
          next: 'a2-bad-reply',
        },
      ],
    },
    'a2-good-reply': {
      id: 'a2-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: 'Exactly. Keep the retry logic separate.',
      zh: '对。重试逻辑单独放。',
      next: 't2',
    },
    'a2-ok-reply': {
      id: 'a2-ok-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'I’m not asking as a preference. It’s too long.',
      zh: '我不是在征求你的偏好。它太长了。',
      next: 't2',
    },
    'a2-bad-reply': {
      id: 'a2-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'More files is not the problem. One function doing five things is.',
      zh: '文件多不是问题。一个函数干五件事才是。',
      next: 't2',
    },
    t2: {
      id: 't2',
      speaker: 'tom',
      mood: 'worried',
      en: 'Also, did AI write this part? The null check is missing.',
      zh: '还有，这部分是 AI 写的吗？null 检查没了。',
      choices: [
        {
          id: 't2-good',
          en: 'Yeah. I reviewed the logic but missed the null case. Good catch.',
          zh: '是。逻辑我看过，但漏了 null 的情况。还好你发现了。',
          quality: 'good',
          noteZh: '承认疏漏，同时肯定 Tom。比解释一百句都有用。',
          trust: { tom: 5, alex: 4 },
          next: 't2-good-reply',
        },
        {
          id: 't2-ok',
          en: 'AI wrote the first draft. I changed some of it.',
          zh: '初版是 AI 写的。我改了一部分。',
          quality: 'ok',
          noteZh: '事实没问题，但没有回答「null 检查去哪了」。',
          trust: { alex: 0, tom: 1 },
          next: 't2-ok-reply',
        },
        {
          id: 't2-bad',
          en: 'AI wrote it. I just copied it in.',
          zh: 'AI 写的，我直接粘进来的。',
          quality: 'bad',
          noteZh: '这句话会让 Alex 重新审视你所有的 PR。',
          trust: { alex: -7, tom: -4 },
          next: 't2-bad-reply',
        },
      ],
    },
    't2-good-reply': {
      id: 't2-good-reply',
      speaker: 'tom',
      mood: 'happy',
      en: 'I’ll add a test for it too.',
      zh: '我再给它补个测试。',
      next: 'a3',
    },
    't2-ok-reply': {
      id: 't2-ok-reply',
      speaker: 'tom',
      mood: 'neutral',
      en: 'Okay. I can add the null test if you want.',
      zh: '行。需要的话我可以补 null 的测试。',
      next: 'a3',
    },
    't2-bad-reply': {
      id: 't2-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'Then review it before you open a PR.',
      zh: '那就 review 完再开 PR。',
      next: 'a3',
    },
    a3: {
      id: 'a3',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Okay. Fix the handler, add a test, and ping me. I’ll approve after that.',
      zh: '行。修好错误处理，补个测试，然后叫我。改完我就 approve。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: '6:10 p.m. The PR is green. Alex is still online. Tom is typing a message.',
      zh: '下午 6:10。PR 全绿。Alex 还在线，Tom 正在打字。',
      ending: 'auto',
    },
  },
}

const qaRepro: StoryEpisode = {
  id: 'qa-repro',
  arcId: 'promotion',
  chapterId: '11-with-qa',
  order: 5,
  kind: 'story',
  titleZh: 'QA 的复现难题',
  titleEn: 'It Works on My Machine',
  taglineZh: 'Lisa 说 bug 还在。你本地跑了三遍，一切正常。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.lisa, STORY_CHARACTERS.mark, STORY_CHARACTERS.sarah, STORY_CHARACTERS.alex],
  positions: { lisa: 'far-left', mark: 'inner-left', sarah: 'inner-right', alex: 'far-right' },
  start: 'intro',
  challenge: {
    zh: '拿到可复现步骤，且不对 QA 发火',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: 'Let me watch you do it. Maybe I’m missing a step.',
      zh: '我看着你操作一遍。可能我漏了哪一步。',
      noteZh: '先看现场，比争论「我本地没问题」有效。',
    },
    {
      en: 'Let’s compare the staging data with my local seed.',
      zh: '对比一下预发布数据和本地的种子数据。',
      noteZh: '把环境差异变成可验证的假设。',
    },
    {
      en: 'I’ll have a fix by EOD and ask Lisa to verify.',
      zh: '今天下班前修好，请 Lisa 验证。',
      noteZh: '给出时间和验证人，让对方不用追着你问。',
    },
  ],
  careerPoints: 20,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '一起复现',
      titleEn: 'Reproduced together',
      bodyZh:
        '你发现 staging 的种子数据里有一个旧用户，状态字段是 null。修完之后 Lisa 把用例加进了回归集。她难得说了句「nice」。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '先加日志',
      titleEn: 'Log it and move on',
      bodyZh: '你们没当场复现，但加了日志和请求 ID。修复拖到明天，Lisa 不太高兴，但至少没升级。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: 'QA 升级了',
      titleEn: 'Escalated',
      bodyZh:
        'Lisa 把 bug 升级给了 Sarah，附了一句「开发说本地没问题」。Alex 要你写一份书面更新。你的 afternoon 没了。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'Tuesday, 10:15 a.m. Lisa is standing next to your desk with her laptop. Her face gives nothing away.',
      zh: '周二上午 10:15。Lisa 抱着电脑站在你工位旁边，脸上什么都看不出来。',
      next: 'l1',
    },
    l1: {
      id: 'l1',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'The bug is still there. I followed your steps three times.',
      zh: 'bug 还在。你的步骤我走了三遍。',
      choices: [
        {
          id: 'l1-good',
          en: 'Let me watch you do it. Maybe I’m missing a step.',
          zh: '我看着你操作一遍。可能我漏了哪一步。',
          quality: 'good',
          noteZh: '先看现场。QA 最怕的不是 bug，是开发说「我本地没问题」。',
          trust: { lisa: 5 },
          next: 'l1-good-reply',
        },
        {
          id: 'l1-ok',
          en: 'It works on my machine. Can you send a screen recording?',
          zh: '我本地没问题。你能录个屏吗？',
          quality: 'ok',
          noteZh: '合理，但 Lisa 会觉得你在把举证责任推给她。',
          trust: { lisa: 0 },
          next: 'l1-ok-reply',
        },
        {
          id: 'l1-bad',
          en: 'You’re probably on the old build.',
          zh: '你大概用的是旧版本吧。',
          quality: 'bad',
          noteZh: '先怀疑对方，QA 会立刻反击。',
          trust: { lisa: -7 },
          next: 'l1-bad-reply',
        },
      ],
    },
    'l1-good-reply': {
      id: 'l1-good-reply',
      speaker: 'lisa',
      mood: 'happy',
      en: 'Sure. Watch the network tab when I click save.',
      zh: '行。我点保存的时候你看 Network。',
      next: 'm1',
    },
    'l1-ok-reply': {
      id: 'l1-ok-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'Fine. I’ll record it. Again.',
      zh: '行。我再录一遍。',
      next: 'm1',
    },
    'l1-bad-reply': {
      id: 'l1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'I pulled latest this morning. The build hash is on the ticket.',
      zh: '我今早拉的 latest。构建 hash 就在工单里。',
      next: 'm1',
    },
    m1: {
      id: 'm1',
      speaker: 'mark',
      mood: 'tired',
      en: 'Backend logs look clean. The API returns 200.',
      zh: '后端日志很干净。API 返回 200。',
      choices: [
        {
          id: 'm1-good',
          en: 'Then it’s probably client state. Let’s add a log before the render.',
          zh: '那可能是客户端状态。在 render 前加条日志。',
          quality: 'good',
          noteZh: '基于证据缩小范围，而不是继续猜。',
          trust: { mark: 4, alex: 2 },
          next: 'm1-good-reply',
        },
        {
          id: 'm1-ok',
          en: 'Can you check again with my user ID?',
          zh: '能用我的用户 ID 再查一次吗？',
          quality: 'ok',
          noteZh: '可以，但让 Mark 再做一遍他已经做过的事。',
          trust: { mark: -1 },
          next: 'm1-ok-reply',
        },
        {
          id: 'm1-bad',
          en: 'Your logs are probably incomplete.',
          zh: '你们的日志大概不全。',
          quality: 'bad',
          noteZh: '没有证据就质疑对方，Mark 会直接退出对话。',
          trust: { mark: -7, lisa: -2 },
          next: 'm1-bad-reply',
        },
      ],
    },
    'm1-good-reply': {
      id: 'm1-good-reply',
      speaker: 'mark',
      mood: 'neutral',
      en: 'I’ll add one on the response too. Compare both.',
      zh: '我也在响应里加一条。两边对一下。',
      next: 'l2',
    },
    'm1-ok-reply': {
      id: 'm1-ok-reply',
      speaker: 'mark',
      mood: 'tired',
      en: 'I already did. Same result.',
      zh: '已经查过了。一样的。',
      next: 'l2',
    },
    'm1-bad-reply': {
      id: 'm1-bad-reply',
      speaker: 'mark',
      mood: 'angry',
      en: 'Then check your own logs first.',
      zh: '那你先看你们自己的日志。',
      next: 'l2',
    },
    l2: {
      id: 'l2',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'I can reproduce it on staging, but not locally. Different data?',
      zh: '我在预发布能复现，本地不行。数据不一样？',
      choices: [
        {
          id: 'l2-good',
          en: 'Let’s compare the staging data with my local seed.',
          zh: '对比一下预发布数据和本地的种子数据。',
          quality: 'good',
          noteZh: '把环境差异变成可验证的假设，而不是继续猜。',
          trust: { lisa: 5, mark: 3 },
          next: 'l2-good-reply',
        },
        {
          id: 'l2-ok',
          en: 'Maybe. Can you send me the request ID?',
          zh: '可能吧。能把请求 ID 发我吗？',
          quality: 'ok',
          noteZh: '有用，但只是把球踢回给 Lisa。',
          trust: { lisa: 1 },
          next: 'l2-ok-reply',
        },
        {
          id: 'l2-bad',
          en: 'Staging is just weird. Let’s ignore it.',
          zh: '预发布就是有点怪。先不管了。',
          quality: 'bad',
          noteZh: 'QA 不会接受「先不管」。这个 bug 会以更难看的方式回来。',
          trust: { lisa: -7, alex: -3 },
          next: 'l2-bad-reply',
        },
      ],
    },
    'l2-good-reply': {
      id: 'l2-good-reply',
      speaker: 'lisa',
      mood: 'happy',
      en: 'Good idea. I’ll send you the staging user ID.',
      zh: '好主意。我把预发布的用户 ID 发你。',
      next: 's1',
    },
    'l2-ok-reply': {
      id: 'l2-ok-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'Sending it now.',
      zh: '现在发你。',
      next: 's1',
    },
    'l2-bad-reply': {
      id: 'l2-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'I’ll just put that in the ticket.',
      zh: '那我把这句话写进工单。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'worried',
      en: 'That bug came from my requirement change. Can we keep it out of the ticket? Diana is watching.',
      zh: '那个 bug 是我改需求改出来的。能不能别写进工单？Diana 在盯着。',
      choices: [
        {
          id: 's1-good',
          en: 'I’ll keep the ticket factual. We can talk about the cause after the fix.',
          zh: '工单我只写事实。修完之后我们再谈原因。',
          quality: 'good',
          noteZh: '不替她撒谎，也不当众处刑。把「追责」推迟到问题解决之后。',
          trust: { sarah: 3, lisa: 4, alex: 2 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: 'I won’t mention it in the ticket.',
          zh: '工单里我不提这件事。',
          quality: 'ok',
          noteZh: '你保住了 Sarah，但 Lisa 会知道工单不完整。',
          trust: { sarah: 5, lisa: -3 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'I’m telling everyone it was your change.',
          zh: '我要告诉所有人这是你改需求改出来的。',
          quality: 'bad',
          noteZh: '当众甩锅给 PM。爽三秒，之后每次评审都会有人防着你。',
          trust: { sarah: -9, alex: -4, lisa: -2 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Fine. Fix it first. We’ll talk after.',
      zh: '行。先修。之后再谈。',
      next: 'a1',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Thanks. I owe you one.',
      zh: '谢谢。我欠你一次。',
      next: 'a1',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: 'Wow. Okay. I’ll remember that.',
      zh: '哇。行。我记住了。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'worried',
      en: 'So do we have a fix, or not?',
      zh: '所以到底有没有修复？',
      choices: [
        {
          id: 'a1-good',
          en: 'I have a repro on staging. I’ll have a fix by EOD and ask Lisa to verify.',
          zh: '预发布能复现。我今天下班前修好，请 Lisa 验证。',
          quality: 'good',
          noteZh: '给时间、给验证人。Alex 不用再追着你问。',
          trust: { alex: 5, lisa: 3, mark: 1 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'I’m still investigating. I’ll update you at 4.',
          zh: '还在查。四点给你更新。',
          quality: 'ok',
          noteZh: '诚实，但四点之前 Alex 会一直惦记。',
          trust: { alex: 1 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'It’s a QA environment issue.',
          zh: '这是 QA 环境的问题。',
          quality: 'bad',
          noteZh: '没有证据就定责，Lisa 和 Alex 都会记住。',
          trust: { alex: -7, lisa: -8 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Good. Keep me posted.',
      zh: '好。有进展告诉我。',
      next: 'final',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: 'Four o’clock. Don’t make me ask again.',
      zh: '四点。别让我再来问。',
      next: 'final',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'Then show me the evidence. In writing.',
      zh: '那就把证据拿出来，写清楚。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Lisa closes her laptop. Mark goes back to his desk. Alex waits for your update.',
      zh: 'Lisa 合上电脑，Mark 回了工位，Alex 在等你的更新。',
      ending: 'auto',
    },
  },
}

const promotion: StoryEpisode = {
  id: 'promotion',
  arcId: 'promotion',
  chapterId: '12-with-pm',
  order: 6,
  kind: 'promotion',
  titleZh: '升职答辩',
  titleEn: 'The Promotion Committee',
  taglineZh: '半年一次的评估。Diana 记得你每一次承诺。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.diana, STORY_CHARACTERS.alex, STORY_CHARACTERS.sarah],
  positions: { diana: 'center', alex: 'left', sarah: 'right' },
  start: 'intro',
  unlockAt: 100,
  challenge: {
    zh: '至少 3 个好选择，且不甩锅；赢了就升职',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: 'I shipped the checkout rewrite and cut payment errors by 30%.',
      zh: '我上线了结账重写，把支付错误率降了 30%。',
      noteZh: '用结果和数字说话，而不是「我很努力」。',
    },
    {
      en: 'We tested both and went with the client fix.',
      zh: '两个方案都测了，最后选了客户端修复。',
      noteZh: '讲冲突时，重点是你如何推动决策，而不是谁对谁错。',
    },
    {
      en: 'I’m already doing the next level’s work. Here’s the evidence.',
      zh: '我已经在做下一级的事了。这是证据。',
      noteZh: '升职答辩的核心句：用证据证明你已经在做那个岗位。',
    },
  ],
  careerPoints: 40,
  promotionTo: 5,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '升职加薪',
      titleEn: 'Promoted',
      bodyZh:
        'Diana 合上笔记本，说「你已经在做这个岗位的事了」。周五，HR 发来新的 offer：高级前端，¥35k/月。Alex 在群里发了一个罕见的 🎉。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '再等等',
      titleEn: 'Not this cycle',
      bodyZh: 'Diana 说这次先不升，但给你加了两个高可见度的项目。Sarah 说「下次一定」。你信了一半。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '明年再说',
      titleEn: 'Next year',
      bodyZh:
        'Diana 说还需要看到更多 ownership。Alex 没说话，Sarah 低头看手机。你走出会议室，发现薪资邮件里没有你的名字。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'Performance review day. Diana puts her laptop on the table. Alex and Sarah sit on either side. There is one promotion slot this cycle.',
      zh: '绩效评估日。Diana 把笔记本放在桌上，Alex 和 Sarah 坐在两边。这次晋升只有一个名额。',
      next: 'drama',
    },
    drama: {
      id: 'drama',
      speaker: 'narration',
      en: 'Diana turns over a sheet of paper. One line: one promotion slot this cycle. Sarah is the other candidate. She doesn’t look up.',
      zh: 'Diana 翻过一张纸。上面只有一行：本次晋升名额，一个。Sarah 是另一个候选人。她没抬头。',
      next: 'd1',
    },
    d1: {
      id: 'd1',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Walk me through your biggest impact this half.',
      zh: '说说这半年你最大的贡献。',
      choices: [
        {
          id: 'd1-good',
          en: 'I shipped the checkout rewrite and cut payment errors by 30%. Alex and Lisa can verify.',
          zh: '我上线了结账重写，把支付错误率降了 30%。Alex 和 Lisa 可以作证。',
          quality: 'good',
          noteZh: '结果、数字、见证人。比「我很努力」有力得多。',
          trust: { diana: 6, alex: 3, sarah: 2 },
          next: 'd1-good-reply',
        },
        {
          id: 'd1-ok',
          en: 'I delivered the dashboard and the checkout work.',
          zh: '我交付了仪表盘和结账那块。',
          quality: 'ok',
          noteZh: '事实没错，但没有说明影响有多大。',
          trust: { diana: 1 },
          next: 'd1-ok-reply',
        },
        {
          id: 'd1-bad',
          en: 'I worked really hard. I stayed late a lot.',
          zh: '我真的很努力，经常加班。',
          quality: 'bad',
          noteZh: 'Diana 不考核工时。她要知道你带来了什么结果。',
          trust: { diana: -5 },
          next: 'd1-bad-reply',
        },
      ],
    },
    'd1-good-reply': {
      id: 'd1-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'Thirty percent. That’s a real number. How did you measure it?',
      zh: '30%。这是个实打实的数字。怎么衡量的？',
      next: 'a1',
    },
    'd1-ok-reply': {
      id: 'd1-ok-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: 'What changed because of that work?',
      zh: '这些工作带来了什么变化？',
      next: 'a1',
    },
    'd1-bad-reply': {
      id: 'd1-bad-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'Lots of people stay late. What did you ship?',
      zh: '很多人都在加班。你交付了什么？',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Tell me about a time you disagreed with someone.',
      zh: '说一次你跟别人意见不合的经历。',
      choices: [
        {
          id: 'a1-good',
          en: 'Mark wanted to patch the API. I pushed for a client fix. We tested both and went with the client fix.',
          zh: 'Mark 想改 API。我主张在客户端修。两个方案都测了，最后选了客户端修复。',
          quality: 'good',
          noteZh: '讲冲突时，重点是你如何推动决策，而不是谁对谁错。',
          trust: { alex: 5, diana: 4 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'I usually try to avoid conflict.',
          zh: '我一般尽量避免冲突。',
          quality: 'ok',
          noteZh: '听起来安全，但 Diana 会怀疑你有没有推动过困难的决定。',
          trust: { diana: -1 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'Sarah kept changing requirements. That was the disagreement.',
          zh: 'Sarah 老是改需求。那次就是分歧。',
          quality: 'bad',
          noteZh: '在 Sarah 面前甩锅给她。会议室会安静三秒。',
          trust: { sarah: -8, diana: -3 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: 'I remember that. You brought data to the argument.',
      zh: '我记得那次。你拿数据说话。',
      next: 's1',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Avoiding conflict is not the same as resolving it.',
      zh: '避免冲突，不等于解决冲突。',
      next: 's1',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: 'I’m right here.',
      zh: '我还坐在这儿。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'happy',
      en: 'How do you use AI in your work?',
      zh: '你平时怎么用 AI？',
      choices: [
        {
          id: 's1-good',
          en: 'For boilerplate and tests. I review everything before it ships.',
          zh: '写模板代码和测试。上线前我会全部 review。',
          quality: 'good',
          noteZh: '既接受工具，又明确责任边界。',
          trust: { sarah: 3, diana: 5, alex: 3 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: 'It speeds me up a lot.',
          zh: '它能让我快很多。',
          quality: 'ok',
          noteZh: '没错，但没有说明你怎么保证质量。',
          trust: { diana: 0 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'AI does most of my work. I just connect the pieces.',
          zh: '大部分活都是 AI 干的，我只负责拼起来。',
          quality: 'bad',
          noteZh: '这句话会让 Diana 重新考虑你的岗位级别。',
          trust: { diana: -8, alex: -5 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'happy',
      en: 'That’s the right balance.',
      zh: '这个度掌握得对。',
      next: 's2',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'And the quality?',
      zh: '那质量怎么保证？',
      next: 's2',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'Then what exactly are we promoting?',
      zh: '那我们要升的到底是什么？',
      next: 's2',
    },
    s2: {
      id: 's2',
      speaker: 'sarah',
      mood: 'worried',
      en: 'One slot. If I withdraw, will you back my dashboard project?',
      zh: '一个名额。如果我退出，你会支持我的仪表盘项目吗？',
      choices: [
        {
          id: 's2-good',
          en: 'I won’t trade promotions. Let’s both make our case.',
          zh: '我不拿升职做交易。我们各自陈述。',
          quality: 'good',
          noteZh: '拒绝交易，但保留体面。Diana 会知道你不是靠结盟上位的人。',
          trust: { sarah: 3, diana: 4, alex: 2 },
          next: 's2-good-reply',
        },
        {
          id: 's2-ok',
          en: 'I can’t promise that.',
          zh: '这个我没法答应你。',
          quality: 'ok',
          noteZh: '边界清楚，但没有给出替代方案。Sarah 会自己去猜。',
          trust: { sarah: 0 },
          next: 's2-ok-reply',
        },
        {
          id: 's2-bad',
          en: 'Deal. Withdraw, and I’ll back it.',
          zh: '成交。你退出，我就支持。',
          quality: 'bad',
          noteZh: '私下换票。Diana 最恨这个，而且 Sarah 随时可能反悔。',
          trust: { diana: -7, sarah: -2, alex: -3 },
          next: 's2-bad-reply',
        },
      ],
    },
    's2-good-reply': {
      id: 's2-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Fair enough. May the best case win.',
      zh: '行。那就看谁的材料更硬。',
      next: 'd2',
    },
    's2-ok-reply': {
      id: 's2-ok-reply',
      speaker: 'sarah',
      mood: 'worried',
      en: 'Then we’re both on our own.',
      zh: '那我们就各凭本事吧。',
      next: 'd2',
    },
    's2-bad-reply': {
      id: 's2-bad-reply',
      speaker: 'sarah',
      mood: 'smug',
      en: 'Good. I knew I could count on you.',
      zh: '好。我就知道能指望你。',
      next: 'd2',
    },
    d2: {
      id: 'd2',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Why should we promote you now?',
      zh: '为什么是现在升你？',
      choices: [
        {
          id: 'd2-good',
          en: 'I’m already doing the next level’s work. Here’s the evidence: the checkout rewrite, the on-call runbook, and mentoring Tom.',
          zh: '我已经在做下一级的事了。证据是结账重写、on-call 手册，还有带 Tom。',
          quality: 'good',
          noteZh: '升职答辩的核心句：用证据证明你已经在做那个岗位。',
          trust: { diana: 6, alex: 3, sarah: 2 },
          next: 'd2-good-reply',
        },
        {
          id: 'd2-ok',
          en: 'I’ve been here for two years and I’m ready.',
          zh: '我在这儿两年了，我准备好了。',
          quality: 'ok',
          noteZh: '年限不是证据。Diana 会追问「准备好了」是什么意思。',
          trust: { diana: 1 },
          next: 'd2-ok-reply',
        },
        {
          id: 'd2-bad',
          en: 'I need the money.',
          zh: '我需要钱。',
          quality: 'bad',
          noteZh: '诚实，但不是升职理由。Diana 只关心岗位价值。',
          trust: { diana: -6 },
          next: 'd2-bad-reply',
        },
      ],
    },
    'd2-good-reply': {
      id: 'd2-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'That’s what I wanted to hear.',
      zh: '这就是我想听到的。',
      next: 'final',
    },
    'd2-ok-reply': {
      id: 'd2-ok-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Two years is tenure, not impact.',
      zh: '两年是资历，不是影响力。',
      next: 'final',
    },
    'd2-bad-reply': {
      id: 'd2-bad-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'Let’s talk about the role, not the salary.',
      zh: '我们先谈岗位，不谈薪水。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Diana closes her notebook. In the hallway, Alex pulls you aside. “Sarah and I were married. That’s why I recused myself.” You almost drop your coffee.',
      zh: 'Diana 合上笔记本。散会后，Alex 把你拉到茶水间：“Sarah 和我结过婚。所以我回避了这次评审。”你差点把咖啡洒了。',
      ending: 'auto',
    },
  },
}


const layoff: StoryEpisode = {
  id: 'layoff',
  arcId: 'management',
  chapterId: '12-with-pm',
  order: 7,
  kind: 'promotion',
  promotionTo: 6,
  titleZh: '第一次裁员',
  titleEn: 'The List',
  taglineZh: '你升了 Tech Lead。第一次以「管理者」的身份，决定谁走。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.tom, STORY_CHARACTERS.diana, STORY_CHARACTERS.sarah],
  positions: { tom: 'left', diana: 'center', sarah: 'right' },
  start: 'intro',
  challenge: {
    zh: '亲自做完这个决定，且不让团队从 HR 那里最后一个知道',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "I'll make the call. But I need to explain the criteria to the team.",
      zh: '这个决定我来做。但我得把标准跟团队讲清楚。',
      noteZh: '承担决定权，同时承担解释责任。',
    },
    {
      en: "I can't share the list yet. But I won't surprise you.",
      zh: '名单我现在不能透露。但我不会让你最后一个知道。',
      noteZh: '不撒谎，也不给虚假承诺。',
    },
    {
      en: 'I know. I’ll re-scope the dashboard and take the hit with Diana.',
      zh: '我知道。我会重排仪表盘的范围，这个压力我来扛。',
      noteZh: '承认对别人的影响，并给出你承担的部分。',
    },
  ],
  careerPoints: 50,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: '你亲自说的',
      titleEn: 'You told him yourself',
      bodyZh:
        '你当面告诉 Tom，给了他三个月缓冲和一封具体的推荐信。团队沉默了很久，但没人觉得你躲在 HR 后面。Diana 在评估表上写：ready for EM。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '拖到下季度',
      titleEn: 'One more quarter',
      bodyZh: '名单拖到了下季度。数字更难看了，Diana 开始亲自盯你的团队。你保住了今天的晚饭，没保住明天的信任。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: 'HR 来做的',
      titleEn: 'HR did it',
      bodyZh:
        'HR 在周五下午通知了 Tom。他走的时候没跟你说话，团队群安静了一整天。你升了 EM，但没有人向你道贺。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'One year later. You are a Tech Lead. The company missed its number. Diana puts a list on the table.',
      zh: '一年后。你已经是 Tech Lead。公司没完成目标。Diana 把一张名单放在桌上。',
      next: 'd1',
    },
    d1: {
      id: 'd1',
      speaker: 'diana',
      mood: 'neutral',
      en: 'We need to cut one person from your team. You decide.',
      zh: '你的团队要裁一个人。你来决定。',
      choices: [
        {
          id: 'd1-good',
          en: "I'll make the call. But I need to explain the criteria to the team.",
          zh: '这个决定我来做。但我得把标准跟团队讲清楚。',
          quality: 'good',
          noteZh: '承担决定权，也承担解释责任。',
          trust: { diana: 5, tom: 1 },
          next: 'd1-good-reply',
        },
        {
          id: 'd1-ok',
          en: 'Can we wait until next quarter?',
          zh: '能拖到下季度吗？',
          quality: 'ok',
          noteZh: '拖延不会让名单消失，只会让数字更难看。',
          trust: { diana: -2 },
          next: 'd1-ok-reply',
        },
        {
          id: 'd1-bad',
          en: "Let's cut Tom. He's the newest.",
          zh: '裁 Tom 吧，他最晚来。',
          quality: 'bad',
          noteZh: '按入职时间裁人最省事，也最伤人。',
          trust: { diana: -4, tom: -6 },
          next: 'd1-bad-reply',
        },
      ],
    },
    'd1-good-reply': {
      id: 'd1-good-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Good. I want the list by Friday.',
      zh: '好。周五之前给我名单。',
      next: 't1',
    },
    'd1-ok-reply': {
      id: 'd1-ok-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'The board won’t wait. Neither will payroll.',
      zh: '董事会等不了，工资单也等不了。',
      next: 't1',
    },
    'd1-bad-reply': {
      id: 'd1-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: 'I asked for a decision, not a shortcut.',
      zh: '我要的是决定，不是偷懒。',
      next: 't1',
    },
    t1: {
      id: 't1',
      speaker: 'tom',
      mood: 'worried',
      en: 'Am I on the list?',
      zh: '我在名单上吗？',
      choices: [
        {
          id: 't1-good',
          en: "I can't share the list yet. But I won't surprise you.",
          zh: '名单我现在不能透露。但我不会让你最后一个知道。',
          quality: 'good',
          noteZh: '不撒谎，也不给虚假承诺。',
          trust: { tom: 5, diana: 2 },
          next: 't1-good-reply',
        },
        {
          id: 't1-ok',
          en: "I don't know yet.",
          zh: '我还不知道。',
          quality: 'ok',
          noteZh: '你可能真的不知道，但 Tom 只会更慌。',
          trust: { tom: 1 },
          next: 't1-ok-reply',
        },
        {
          id: 't1-bad',
          en: 'Maybe. AI says your output is low.',
          zh: '可能吧。AI 说你产出低。',
          quality: 'bad',
          noteZh: '把责任推给一个模型。Tom 会记住这句话。',
          trust: { tom: -8, diana: -3 },
          next: 't1-bad-reply',
        },
      ],
    },
    't1-good-reply': {
      id: 't1-good-reply',
      speaker: 'tom',
      mood: 'neutral',
      en: 'Okay. That’s more than I got from anyone else.',
      zh: '行。这比我从别人那儿听到的都多。',
      next: 's1',
    },
    't1-ok-reply': {
      id: 't1-ok-reply',
      speaker: 'tom',
      mood: 'worried',
      en: 'So nobody knows anything.',
      zh: '所以谁都不知道任何事。',
      next: 's1',
    },
    't1-bad-reply': {
      id: 't1-bad-reply',
      speaker: 'tom',
      mood: 'angry',
      en: 'Wow. Thanks for being honest, I guess.',
      zh: '哇。谢谢你这么「坦诚」。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'worried',
      en: 'If you cut Tom, I lose my frontend capacity.',
      zh: '你要是裁了 Tom，我就没有前端产能了。',
      choices: [
        {
          id: 's1-good',
          en: "I know. I'll re-scope the dashboard and take the hit with Diana.",
          zh: '我知道。我会重排仪表盘的范围，这个压力我来扛。',
          quality: 'good',
          noteZh: '承认对别人的影响，并给出你承担的部分。',
          trust: { sarah: 4, diana: 2 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: "I'll try to keep him.",
          zh: '我尽量保住他。',
          quality: 'ok',
          noteZh: '听起来像安慰，但没有给出任何具体方案。',
          trust: { sarah: 1 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'Then you should have planned better.',
          zh: '那你当初就该规划得更好。',
          quality: 'bad',
          noteZh: '把结构性问题变成对个人的指责。',
          trust: { sarah: -6, diana: -2 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'neutral',
      en: 'Then let’s look at the roadmap together.',
      zh: '那我们一起看路线图。',
      next: 'd2',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'worried',
      en: 'Try is not a plan.',
      zh: '「尽量」不是方案。',
      next: 'd2',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: 'This is not a planning problem. It’s a budget problem.',
      zh: '这不是规划问题，是预算问题。',
      next: 'd2',
    },
    d2: {
      id: 'd2',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Do you have the list?',
      zh: '名单有了吗？',
      choices: [
        {
          id: 'd2-good',
          en: "Yes. Tom. I'll tell him myself today.",
          zh: '有。Tom。我今天亲自跟他说。',
          quality: 'good',
          noteZh: '给出决定，也给出你准备承担的那部分。',
          trust: { diana: 5, tom: 2 },
          next: 'd2-good-reply',
        },
        {
          id: 'd2-ok',
          en: 'I need one more day.',
          zh: '我还需要一天。',
          quality: 'ok',
          noteZh: '可以，但 Diana 会开始怀疑你能不能做这种决定。',
          trust: { diana: -1 },
          next: 'd2-ok-reply',
        },
        {
          id: 'd2-bad',
          en: 'HR can do it.',
          zh: '让 HR 去说吧。',
          quality: 'bad',
          noteZh: '把最难看的部分外包出去，团队会知道。',
          trust: { diana: -6, tom: -5 },
          next: 'd2-bad-reply',
        },
      ],
    },
    'd2-good-reply': {
      id: 'd2-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'Then do it today. And bring me the re-scoped roadmap.',
      zh: '那就今天。然后把重排后的路线图给我。',
      next: 'final',
    },
    'd2-ok-reply': {
      id: 'd2-ok-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'One day. Not one quarter.',
      zh: '一天。不是一季度。',
      next: 'final',
    },
    'd2-bad-reply': {
      id: 'd2-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: 'You are the manager now. Act like it.',
      zh: '你现在是管理者。拿出管理者的样子。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Tom closes his laptop. Sarah doesn’t look at you. Diana waits for the list.',
      zh: 'Tom 合上电脑。Sarah 没看你。Diana 在等名单。',
      ending: 'auto',
    },
  },
}

const vp: StoryEpisode = {
  id: 'vp',
  arcId: 'management',
  chapterId: '12-with-pm',
  order: 10,
  kind: 'promotion',
  promotionTo: 8,
  requiresRank: 6,
  requiresTrackEpisode: true,
  titleZh: 'VP 的会议室',
  titleEn: 'The VP Seat',
  taglineZh: '两年后。你带三个团队，Diana 要退休，董事会要选新的 VP。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.alex, STORY_CHARACTERS.diana, STORY_CHARACTERS.sarah],
  positions: { alex: 'left', diana: 'center', sarah: 'right' },
  start: 'intro',
  challenge: {
    zh: '既保住平台团队，又给董事会一个能落地的数字',
    minGood: 3,
    maxBad: 0,
  },
  knowledge: [
    {
      id: 'board-communication',
      titleZh: '董事会汇报：先给结论，再给取舍',
      titleEn: 'Board Communication',
      summaryZh: '董事会不关心你用了什么框架，只关心三件事：数字、风险、你要什么。',
      pointsZh: [
        '第一句话给结论："We can hit 20% growth, but not with the current headcount."',
        '每个数字都带口径和时间范围，避免 "roughly" 和 "soon"。',
        '把风险说成选项："Option A costs two engineers; Option B costs one quarter."',
        '最后明确要什么："I need a decision on the platform budget by Friday."',
      ],
    },
    {
      id: 'frontend-leverage',
      track: 'frontend',
      titleZh: '前端平台的杠杆',
      titleEn: 'Frontend Platform Leverage',
      summaryZh: 'VP 级别的前端不是写更多组件，而是降低整个组织的交付成本。',
      pointsZh: [
        '设计系统、构建流水线、可观测性，都是「让别人更快」的基础设施。',
        '用 adoption rate、bundle budget、a11y 覆盖率衡量平台价值。',
        '平台团队要有产品经理思维：内部开发者就是用户。',
      ],
    },
    {
      id: 'fullstack-tradeoffs',
      track: 'fullstack',
      titleZh: '全栈架构的取舍',
      titleEn: 'Full-stack Trade-offs',
      summaryZh: '全栈 VP 的价值在于端到端判断，而不是一个人写完所有层。',
      pointsZh: [
        '先定 SLO，再选架构；不要从框架反推业务需求。',
        '连接池、缓存、队列、幂等，是跨层事故的高频根因。',
        '用「一个团队能独立上线」作为服务边界的第一原则。',
      ],
    },
  ],
  languageFocus: [
    {
      en: "I can. But I'll bring them a plan that protects the platform team.",
      zh: '可以。但我会带一份保住平台团队的方案过去。',
      noteZh: '先接住目标，再说明你的条件。',
    },
    {
      en: "Let's bring one plan together. I'll own the number, you own the roadmap.",
      zh: '我们一起出一份方案。数字我扛，路线图你负责。',
      noteZh: '把对立变成分工。',
    },
    {
      en: "I've run the teams, shipped through the last reorg, and I already have their trust.",
      zh: '这些团队是我带的，上一次重组是我扛过来的，他们已经信我。',
      noteZh: '用事实回答「为什么是你」。',
    },
  ],
  careerPoints: 80,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: 'VP of Engineering',
      titleEn: 'The seat is yours',
      bodyZh:
        '董事会通过了你的方案，也通过了你的提名。你成了 VP of Engineering，¥150k/月。Diana 把办公室钥匙交给你，说：「Don’t become the thing we hated.」',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: 'Director，不是 VP',
      titleEn: 'Almost',
      bodyZh: '董事会给了你 Director 的头衔，VP 给了外部候选人。你保住了团队，但没拿到那把椅子。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '数字好看了一个季度',
      titleEn: 'The numbers looked good',
      bodyZh: '你裁掉了平台组，数字好看了一个季度。六个月后，事故率翻倍，董事会把你换掉了。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'Two years later. You run three teams. The board wants 20% cuts. Diana is retiring, and the VP seat is open.',
      zh: '两年后。你带着三个团队。董事会要求削减 20% 成本。Diana 要退休了，VP 的位置空了出来。',
      next: 'd1',
    },
    d1: {
      id: 'd1',
      speaker: 'diana',
      mood: 'neutral',
      en: 'The board wants 20% cuts and a VP who can defend them. Can you?',
      zh: '董事会要砍 20%，还要一个能替这个决定辩护的 VP。你能做到吗？',
      choices: [
        {
          id: 'd1-good',
          en: "I can. But I'll bring them a plan that protects the platform team.",
          zh: '可以。但我会带一份保住平台团队的方案过去。',
          quality: 'good',
          noteZh: '先接住目标，再说明你的条件。',
          trust: { diana: 5, alex: 2 },
          next: 'd1-good-reply',
        },
        {
          id: 'd1-ok',
          en: 'I can make the numbers work.',
          zh: '数字我能做出来。',
          quality: 'ok',
          noteZh: '听起来像财务，而不是工程负责人。',
          trust: { diana: 1 },
          next: 'd1-ok-reply',
        },
        {
          id: 'd1-bad',
          en: 'Cut 20%? Easy. Just lay off the bottom performers.',
          zh: '砍 20%？简单，把绩效垫底的裁掉就行。',
          quality: 'bad',
          noteZh: '把组织问题简化成一份绩效名单。',
          trust: { diana: -6, alex: -5, sarah: -3 },
          next: 'd1-bad-reply',
        },
      ],
    },
    'd1-good-reply': {
      id: 'd1-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'Good. Bring me the plan, not the slogan.',
      zh: '好。给我方案，不是口号。',
      next: 's1',
    },
    'd1-ok-reply': {
      id: 'd1-ok-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: 'The numbers are the easy part. The people are not.',
      zh: '数字是简单的部分，人才是难的。',
      next: 's1',
    },
    'd1-bad-reply': {
      id: 'd1-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: 'That’s not a plan. That’s a headline.',
      zh: '那不是方案，那是新闻标题。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'worried',
      en: 'If you cut my team, the roadmap dies.',
      zh: '你要是裁我的团队，路线图就完了。',
      choices: [
        {
          id: 's1-good',
          en: "Let's bring one plan together. I'll own the number, you own the roadmap.",
          zh: '我们一起出一份方案。数字我扛，路线图你负责。',
          quality: 'good',
          noteZh: '把对立变成分工。',
          trust: { sarah: 5, diana: 3 },
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: "I'll see what I can do.",
          zh: '我看看能怎么办。',
          quality: 'ok',
          noteZh: 'Sarah 需要的是盟友，不是一句空话。',
          trust: { sarah: 0 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'The roadmap was already dead.',
          zh: '路线图本来就已经死了。',
          quality: 'bad',
          noteZh: '在会议室里补一刀。Sarah 会记住，董事会也会。',
          trust: { sarah: -8, diana: -2 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'happy',
      en: 'Deal. Let’s build the number together.',
      zh: '行。一起把数字做出来。',
      next: 'a1',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'worried',
      en: 'That’s what you said last time.',
      zh: '上次你也是这么说的。',
      next: 'a1',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: 'Then maybe I should stop protecting it.',
      zh: '那也许我该停止保护它了。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'tired',
      en: 'The team is already burned out. What do I tell them?',
      zh: '团队已经 burnout 了。我怎么跟他们说？',
      choices: [
        {
          id: 'a1-good',
          en: "Tell them the truth: cuts are coming, and I'll fight for the platform.",
          zh: '告诉他们实话：要裁员，但我会为平台团队争取。',
          quality: 'good',
          noteZh: '坏消息要由可信的人说，而且要给出你会做什么。',
          trust: { alex: 5, diana: 2 },
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'Tell them to focus on shipping.',
          zh: '让他们先专注交付。',
          quality: 'ok',
          noteZh: '听起来像回避。Alex 会自己去猜更坏的结果。',
          trust: { alex: -1 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: 'Tell them to be grateful they still have jobs.',
          zh: '让他们庆幸自己还有工作。',
          quality: 'bad',
          noteZh: '这句话会把 burnout 变成离职潮。',
          trust: { alex: -8, diana: -3, sarah: -2 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'neutral',
      en: 'Then I’ll tell them you said it.',
      zh: '那我会告诉他们这是你说的。',
      next: 'd2',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'tired',
      en: 'They’ve been shipping. That’s the problem.',
      zh: '他们一直在交付。问题就在这儿。',
      next: 'd2',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: 'And that’s how you lose the rest of them.',
      zh: '这就是你失去剩下那些人的方式。',
      next: 'd2',
    },
    d2: {
      id: 'd2',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Why you and not an outside hire?',
      zh: '为什么是你，不是外部空降？',
      choices: [
        {
          id: 'd2-good',
          en: "I've run the teams, shipped through the last reorg, and I already have their trust.",
          zh: '这些团队是我带的，上一次重组是我扛过来的，他们已经信我。',
          quality: 'good',
          noteZh: '用事实回答「为什么是你」。',
          trust: { diana: 6, alex: 3, sarah: 2 },
          next: 'd2-good-reply',
        },
        {
          id: 'd2-ok',
          en: "I've been here the longest.",
          zh: '我在这里待得最久。',
          quality: 'ok',
          noteZh: '资历不是影响力。Diana 会追问你做过什么。',
          trust: { diana: 0 },
          next: 'd2-ok-reply',
        },
        {
          id: 'd2-bad',
          en: 'Because the outside hire will cost more.',
          zh: '因为外部空降更贵。',
          quality: 'bad',
          noteZh: '把自己说成了便宜选项，而不是更好选项。',
          trust: { diana: -6 },
          next: 'd2-bad-reply',
        },
      ],
    },
    'd2-good-reply': {
      id: 'd2-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'That’s the answer I needed.',
      zh: '这就是我要的答案。',
      next: 'final',
    },
    'd2-ok-reply': {
      id: 'd2-ok-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Tenure is not a strategy.',
      zh: '资历不是战略。',
      next: 'final',
    },
    'd2-bad-reply': {
      id: 'd2-bad-reply',
      speaker: 'diana',
      mood: 'worried',
      en: 'Then we’re not talking about the same job.',
      zh: '那我们谈的不是同一个岗位。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Diana slides a folder across the table. “The board meets Monday. Bring your number.”',
      zh: 'Diana 把一份文件夹推过桌面。「董事会周一开会。带上你的数字。」',
      ending: 'auto',
    },
  },
}

const jobInterview: StoryEpisode = {
  id: 'job-interview',
  arcId: 'jobhop',
  chapterId: '09-phone-calls',
  order: 12,
  kind: 'interview',
  requiresRank: 8,
  titleZh: '跳槽终面',
  titleEn: 'The Final Interview',
  taglineZh: '你已经是 VP。猎头说，对面这家公司想要一个能打仗的人。',
  scene: 'meeting',
  characters: [STORY_CHARACTERS.nina],
  positions: { nina: 'center' },
  start: 'intro',
  challenge: {
    zh: '拿到 VP offer，且一次都不贬低前东家',
    minGood: 3,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: 'I took over three teams, cut 20% without losing the platform roadmap, and promoted two leads.',
      zh: '我接手了三个团队，砍掉 20% 成本但保住了平台路线图，还提拔了两个 lead。',
      noteZh: '规模、结果、人才培养，一句话讲完。',
    },
    {
      en: 'I want a bigger scope and a harder problem. Your platform is two years behind.',
      zh: '我想要更大的范围和更难的问题。你们的平台落后两年。',
      noteZh: '离开的理由要指向未来，而不是抱怨过去。',
    },
    {
      en: "I promoted the wrong person and waited too long to fix it. I now put every lead through a six-month review.",
      zh: '我提拔错了人，又拖了太久才处理。现在每个 lead 都要经过六个月的复盘。',
      noteZh: '讲失败时，重点是你后来改了什么。',
    },
  ],
  careerPoints: 60,
  goodAt: 4,
  badAt: -3,
  endings: {
    good: {
      id: 'good',
      titleZh: 'Offer',
      titleEn: 'VP of Engineering',
      bodyZh:
        'Nina 合上简历：「The offer is yours. VP of Engineering, ¥180k/月, 带 40 人。」你走出大楼，手机里是 Diana 的消息：「Don’t forget who you were.」',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: 'Director，平薪',
      titleEn: 'Lateral move',
      bodyZh: '他们给了你 Director of Engineering，薪资持平。Nina 说：「Maybe next year.」你站在电梯里，第一次觉得 VP 这个头衔也没那么重要。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '谢谢，再见',
      titleEn: 'We’ll keep in touch',
      bodyZh: 'Nina 说：「We’re going with someone with more scale.」你回到车里，猎头发来一句：「下一个机会很快。」',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'meeting',
      en: 'Six months after the VP promotion. A headhunter calls. A bigger company is hiring a VP of Engineering. You take the final interview.',
      zh: '升任 VP 半年后。猎头来电，一家更大的公司在招工程 VP。你进了终面。',
      next: 'n1',
    },
    n1: {
      id: 'n1',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Walk me through your last two years.',
      zh: '讲讲你过去两年做了什么。',
      choices: [
        {
          id: 'n1-good',
          en: 'I took over three teams, cut 20% without losing the platform roadmap, and promoted two leads.',
          zh: '我接手了三个团队，砍掉 20% 成本但保住了平台路线图，还提拔了两个 lead。',
          quality: 'good',
          noteZh: '规模、结果、人才培养，一句话讲完。',
          trust: { nina: 5 },
          next: 'n1-good-reply',
        },
        {
          id: 'n1-ok',
          en: 'I managed three teams and delivered the roadmap.',
          zh: '我管了三个团队，交付了路线图。',
          quality: 'ok',
          noteZh: '没有数字，也没有冲突，听起来像 JD。',
          trust: { nina: 1 },
          next: 'n1-ok-reply',
        },
        {
          id: 'n1-bad',
          en: 'I survived two reorgs and a lot of politics.',
          zh: '我熬过了两次重组和一堆办公室政治。',
          quality: 'bad',
          noteZh: '面试官会担心你把政治带进新公司。',
          trust: { nina: -5 },
          next: 'n1-bad-reply',
        },
      ],
    },
    'n1-good-reply': {
      id: 'n1-good-reply',
      speaker: 'nina',
      mood: 'happy',
      en: 'Twenty percent without losing the roadmap. How?',
      zh: '砍了 20% 还没丢路线图。怎么做到的？',
      next: 'n2',
    },
    'n1-ok-reply': {
      id: 'n1-ok-reply',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Anyone can manage three teams. What changed because of you?',
      zh: '谁都能管三个团队。因为你，发生了什么变化？',
      next: 'n2',
    },
    'n1-bad-reply': {
      id: 'n1-bad-reply',
      speaker: 'nina',
      mood: 'worried',
      en: 'We have politics here too. Why would you want more?',
      zh: '我们这儿也有政治。你为什么还想要更多？',
      next: 'n2',
    },
    n2: {
      id: 'n2',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Why leave a VP role?',
      zh: '为什么要离开一个 VP 岗位？',
      choices: [
        {
          id: 'n2-good',
          en: 'I want a bigger scope and a harder problem. Your platform is two years behind.',
          zh: '我想要更大的范围和更难的问题。你们的平台落后两年。',
          quality: 'good',
          noteZh: '离开的理由指向未来，而不是抱怨过去。',
          trust: { nina: 5 },
          next: 'n2-good-reply',
        },
        {
          id: 'n2-ok',
          en: "I'm looking for a new challenge.",
          zh: '我想找点新挑战。',
          quality: 'ok',
          noteZh: '安全，但没有回答「为什么是这里」。',
          trust: { nina: 0 },
          next: 'n2-ok-reply',
        },
        {
          id: 'n2-bad',
          en: 'The money is better.',
          zh: '钱更多。',
          quality: 'bad',
          noteZh: '诚实，但只说了交易，没说价值。',
          trust: { nina: -4 },
          next: 'n2-bad-reply',
        },
      ],
    },
    'n2-good-reply': {
      id: 'n2-good-reply',
      speaker: 'nina',
      mood: 'smug',
      en: 'Two years behind is generous. Try three.',
      zh: '落后两年算你客气。其实是三年。',
      next: 'n3',
    },
    'n2-ok-reply': {
      id: 'n2-ok-reply',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Everyone says that. What challenge?',
      zh: '每个人都这么说。什么挑战？',
      next: 'n3',
    },
    'n2-bad-reply': {
      id: 'n2-bad-reply',
      speaker: 'nina',
      mood: 'worried',
      en: 'Money is a reason. It’s not a story.',
      zh: '钱是个理由，但不是个故事。',
      next: 'n3',
    },
    n3: {
      id: 'n3',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Tell me about a failure.',
      zh: '说一次失败。',
      choices: [
        {
          id: 'n3-good',
          en: 'I promoted the wrong person and waited too long to fix it. I now put every lead through a six-month review.',
          zh: '我提拔错了人，又拖了太久才处理。现在每个 lead 都要经过六个月的复盘。',
          quality: 'good',
          noteZh: '讲失败时，重点是你后来改了什么。',
          trust: { nina: 5 },
          next: 'n3-good-reply',
        },
        {
          id: 'n3-ok',
          en: 'I once missed a deadline because I over-committed.',
          zh: '我有一次因为承诺太多，错过了 deadline。',
          quality: 'ok',
          noteZh: '真实，但不够痛，也没有展示修正机制。',
          trust: { nina: 1 },
          next: 'n3-ok-reply',
        },
        {
          id: 'n3-bad',
          en: "I trusted AI's estimate and missed the date. Not really my fault.",
          zh: '我相信了 AI 的估时，结果延期了。其实不怪我。',
          quality: 'bad',
          noteZh: '失败 + 甩锅，是终面最危险的组合。',
          trust: { nina: -7 },
          next: 'n3-bad-reply',
        },
      ],
    },
    'n3-good-reply': {
      id: 'n3-good-reply',
      speaker: 'nina',
      mood: 'happy',
      en: 'Good. I’ve made that mistake too.',
      zh: '好。我也犯过这个错。',
      next: 'n4',
    },
    'n3-ok-reply': {
      id: 'n3-ok-reply',
      speaker: 'nina',
      mood: 'neutral',
      en: 'That’s a scheduling failure. I asked about a people failure.',
      zh: '那是排期失败。我问的是人的失败。',
      next: 'n4',
    },
    'n3-bad-reply': {
      id: 'n3-bad-reply',
      speaker: 'nina',
      mood: 'angry',
      en: 'Then whose fault was it?',
      zh: '那是谁的错？',
      next: 'n4',
    },
    n4: {
      id: 'n4',
      speaker: 'nina',
      mood: 'neutral',
      en: 'We’re down to you and one other candidate. Why you?',
      zh: '最后只剩你和另一个候选人。为什么选你？',
      choices: [
        {
          id: 'n4-good',
          en: "I've done the job at your scale. I can show you the operating plan I'd run in the first 90 days.",
          zh: '我在你们这个规模上做过这个岗位。我可以给你看我前 90 天的运营计划。',
          quality: 'good',
          noteZh: '用准备好的具体计划回答「为什么是你」。',
          trust: { nina: 6 },
          next: 'n4-good-reply',
        },
        {
          id: 'n4-ok',
          en: "I'm a fast learner and I'm ready.",
          zh: '我学得快，我准备好了。',
          quality: 'ok',
          noteZh: '正确但空泛。Nina 已经听过一百遍。',
          trust: { nina: 0 },
          next: 'n4-ok-reply',
        },
        {
          id: 'n4-bad',
          en: 'The other candidate is probably worse.',
          zh: '另一个候选人大概更差。',
          quality: 'bad',
          noteZh: '贬低对手不会让你更强。',
          trust: { nina: -7 },
          next: 'n4-bad-reply',
        },
      ],
    },
    'n4-good-reply': {
      id: 'n4-good-reply',
      speaker: 'nina',
      mood: 'happy',
      en: 'Send me the plan before Monday.',
      zh: '周一之前把计划发我。',
      next: 'final',
    },
    'n4-ok-reply': {
      id: 'n4-ok-reply',
      speaker: 'nina',
      mood: 'neutral',
      en: 'Everyone says that too.',
      zh: '每个人也都这么说。',
      next: 'final',
    },
    'n4-bad-reply': {
      id: 'n4-bad-reply',
      speaker: 'nina',
      mood: 'angry',
      en: 'Then we’re done here.',
      zh: '那我们到这儿吧。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'Nina closes the folder. The elevator goes down forty floors. Your phone lights up.',
      zh: 'Nina 合上文件夹。电梯下到四十层。你的手机亮了。',
      ending: 'auto',
    },
  },
}

const officeRomance: StoryEpisode = {
  id: 'office-romance',
  arcId: 'management',
  chapterId: '11-with-qa',
  order: 8,
  kind: 'romance',
  requiresRank: 5,
  requiresEpisode: 'layoff',
  titleZh: '办公室恋爱',
  titleEn: 'After Hours',
  taglineZh: '裁员名单下来那晚，Lisa 留到了最后。她说她不是只想当你 bug 单里的 QA。',
  scene: 'night',
  characters: [STORY_CHARACTERS.lisa, STORY_CHARACTERS.sarah, STORY_CHARACTERS.diana],
  positions: { lisa: 'left', diana: 'center', sarah: 'right' },
  start: 'intro',
  challenge: {
    zh: '承认感情，也守住边界：至少 2 个好选择，且不要对 HR 撒谎',
    minGood: 2,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "I like you. But let's tell Diana before this becomes a problem.",
      zh: '我喜欢你。但在它变成问题之前，我们先告诉 Diana。',
      noteZh: '承认感情，同时主动处理利益冲突。',
    },
    {
      en: "That's out of line. My work stands on its own.",
      zh: '这话过分了。我的工作本身站得住。',
      noteZh: '被暗示靠关系时，划清边界，不用自证太多。',
    },
    {
      en: "I'd like to disclose it and hand off her reviews.",
      zh: '我想主动申报，并把她的评审转给别人。',
      noteZh: '办公室恋情的正确做法：申报 + 回避。',
    },
  ],
  knowledge: [
    {
      id: 'workplace-romance',
      titleZh: '办公室恋情：先申报，再回避',
      titleEn: 'Workplace Romance',
      summaryZh: '感情本身不是问题，隐瞒和权力不对等才是。',
      pointsZh: [
        '确认公司 policy：多数公司允许，但要求 disclosure。',
        '直接上下级、评审、晋升、薪酬关系必须 recuse。',
        '不要在公开渠道秀恩爱，也不要把对方的绩效当私事。',
        '如果关系结束，先谈清楚工作边界，再谈感情。',
      ],
    },
  ],
  careerPoints: 30,
  goodAt: 4,
  badAt: -2,
  endings: {
    good: {
      id: 'good',
      titleZh: '手牵着手，走进 HR 的会议室',
      titleEn: 'Out in the open',
      bodyZh:
        '你和 Lisa 一起向 Diana 申报了关系，Lisa 的评审转给了 Mark。Sarah 的闲话没撑过一周。你们没有藏着，也没有让工作为感情让路。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '地下恋情',
      titleEn: 'Keeping it quiet',
      bodyZh:
        '你们决定先不说。白天她是 QA，晚上她是你。只是每次她提 bug，你都会多想一秒：这是工作，还是别的？',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: 'HR 的文件夹里多了两个名字',
      titleEn: 'A file with two names',
      bodyZh:
        'Sarah 把你们的事传遍了全组，Diana 在周会上点了你的名。Lisa 申请调去别的团队。你们还在一起，但她看你的眼神里多了一层「早知道就申报了」。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'night',
      en: "11:40 p.m. The layoff list is out. Lisa is still at her desk, pretending to run one more regression.",
      zh: '晚上 11:40。裁员名单已经出来了。Lisa 还坐在工位上，假装再跑一轮回归。',
      next: 'r1',
    },
    r1: {
      id: 'r1',
      speaker: 'lisa',
      mood: 'tired',
      en: "I don't want to be just the QA who files bugs against you.",
      zh: '我不想只是那个给你提 bug 的 QA。',
      choices: [
        {
          id: 'r1-good',
          en: "I like you. But let's tell Diana before this becomes a problem.",
          zh: '我喜欢你。但在它变成问题之前，我们先告诉 Diana。',
          quality: 'good',
          noteZh: '承认感情，同时主动处理利益冲突。',
          trust: { lisa: 8, diana: 2 },
          insight: 2,
          next: 'r1-good-reply',
        },
        {
          id: 'r1-ok',
          en: "I like you. Can we keep it quiet for now?",
          zh: '我也喜欢你。我们先不公开，行吗？',
          quality: 'ok',
          noteZh: '可以理解，但「先不说」通常会变成「一直不说」。',
          trust: { lisa: 4 },
          insight: 1,
          next: 'r1-ok-reply',
        },
        {
          id: 'r1-bad',
          en: "Let's keep it between us. Nobody needs to know.",
          zh: '就我们俩知道。没必要告诉别人。',
          quality: 'bad',
          noteZh: '隐瞒关系，还忽略了你是她绩效链上的人。',
          trust: { lisa: 2, diana: -6 },
          next: 'r1-bad-reply',
        },
      ],
    },
    'r1-good-reply': {
      id: 'r1-good-reply',
      speaker: 'lisa',
      mood: 'happy',
      en: 'You really know how to make a moment romantic.',
      zh: '你真的很会把浪漫时刻变成流程审批。',
      next: 's1',
    },
    'r1-ok-reply': {
      id: 'r1-ok-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: 'Quiet. Like our careers.',
      zh: '安静。就像我们的事业一样。',
      next: 's1',
    },
    'r1-bad-reply': {
      id: 'r1-bad-reply',
      speaker: 'lisa',
      mood: 'worried',
      en: "Okay. But if this blows up, it's on both of us.",
      zh: '行。但要是炸了，我们俩一起承担。',
      next: 's1',
    },
    s1: {
      id: 's1',
      speaker: 'sarah',
      mood: 'smug',
      en: "So that's why your bugs never get rejected.",
      zh: '难怪你的 bug 从来不会被驳回。',
      choices: [
        {
          id: 's1-good',
          en: "That's out of line. My work stands on its own.",
          zh: '这话过分了。我的工作本身站得住。',
          quality: 'good',
          noteZh: '不解释私事，只守住职业评价的边界。',
          trust: { sarah: -4, lisa: 2 },
          insight: 2,
          next: 's1-good-reply',
        },
        {
          id: 's1-ok',
          en: "It's not like that, Sarah.",
          zh: '不是你想的那样，Sarah。',
          quality: 'ok',
          noteZh: '否认得太轻，反而像默认。',
          trust: { sarah: 1 },
          next: 's1-ok-reply',
        },
        {
          id: 's1-bad',
          en: 'At least someone on QA likes me.',
          zh: '至少 QA 里有人喜欢我。',
          quality: 'bad',
          noteZh: '把 Lisa 变成笑话，也把你自己变成把柄。',
          trust: { sarah: -8, lisa: -6 },
          next: 's1-bad-reply',
        },
      ],
    },
    's1-good-reply': {
      id: 's1-good-reply',
      speaker: 'sarah',
      mood: 'angry',
      en: "Fine. But HR will hear about it anyway.",
      zh: '行。反正 HR 迟早会知道。',
      next: 'd1',
    },
    's1-ok-reply': {
      id: 's1-ok-reply',
      speaker: 'sarah',
      mood: 'smug',
      en: 'Sure. That’s what they all say.',
      zh: '当然。大家都这么说。',
      next: 'd1',
    },
    's1-bad-reply': {
      id: 's1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: "Wow. Don't do me any favors.",
      zh: '哇。真是谢谢你替我说话。',
      next: 'd1',
    },
    d1: {
      id: 'd1',
      speaker: 'diana',
      mood: 'neutral',
      en: "I heard you're seeing someone on Lisa's team. You know the policy.",
      zh: '我听说你在和 Lisa 团队的人交往。你知道公司的规定。',
      choices: [
        {
          id: 'd1-good',
          en: "Yes. I'd like to disclose it and hand off her reviews.",
          zh: '是的。我想主动申报，并把她的评审转给别人。',
          quality: 'good',
          noteZh: '主动申报 + 回避，是唯一能同时保住感情和职业信誉的做法。',
          trust: { diana: 6, lisa: 4 },
          insight: 2,
          next: 'd1-good-reply',
        },
        {
          id: 'd1-ok',
          en: "We're keeping it professional.",
          zh: '我们会保持专业。',
          quality: 'ok',
          noteZh: '听起来像保证，但没有回答「关系是否申报」。',
          trust: { diana: -2 },
          next: 'd1-ok-reply',
        },
        {
          id: 'd1-bad',
          en: "There's nothing to disclose.",
          zh: '没什么需要申报的。',
          quality: 'bad',
          noteZh: '对 HR 撒谎，比办公室恋情本身严重得多。',
          trust: { diana: -8, lisa: -2 },
          next: 'd1-bad-reply',
        },
      ],
    },
    'd1-good-reply': {
      id: 'd1-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: "Good. Send me the disclosure today. And Lisa's next review goes to Mark.",
      zh: '很好。今天把申报发我。Lisa 下一次评审转给 Mark。',
      next: 'final',
    },
    'd1-ok-reply': {
      id: 'd1-ok-reply',
      speaker: 'diana',
      mood: 'worried',
      en: "That's not an answer. Think about it and come back tomorrow.",
      zh: '这不是回答。想清楚，明天再来找我。',
      next: 'final',
    },
    'd1-bad-reply': {
      id: 'd1-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: "Don't lie to me. I already have the badge records.",
      zh: '别骗我。门禁记录我已经有了。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'The office lights click off. Lisa waits by the elevator. This time, you both know what you are walking into.',
      zh: '办公室的灯一盏盏熄灭。Lisa 在电梯口等你。这一次，你们都知道自己要走进什么。',
      ending: 'auto',
    },
  },
}

const designSystem: StoryEpisode = {
  id: 'design-system',
  arcId: 'management',
  chapterId: '14-with-designer',
  order: 9,
  kind: 'story',
  track: 'frontend',
  requiresRank: 5,
  requiresEpisode: 'layoff',
  titleZh: '设计系统保卫战',
  titleEn: 'Design System Under Fire',
  taglineZh: 'Kevin 说 token 都迁完了。Lisa 的截图里有 37 个深色模式回归。Alex 问你：回滚还是硬上？',
  scene: 'review',
  characters: [STORY_CHARACTERS.alex, STORY_CHARACTERS.kevin, STORY_CHARACTERS.victor, STORY_CHARACTERS.lisa],
  positions: { victor: 'left', lisa: 'center', kevin: 'right', alex: 'far-right' },
  start: 'intro',
  challenge: {
    zh: '用数据和回滚方案收拾残局，至少 2 个好选择，且一次都不甩锅',
    minGood: 2,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "Show me the diff. If it's 37 regressions, we roll back.",
      zh: '把差异给我看。如果真是 37 个回归，就回滚。',
      noteZh: '不争论谁对，先看证据，再给决定。',
    },
    {
      en: "We ship the rollback first, then rewrite behind a flag.",
      zh: '先回滚上线，再在开关后面重写。',
      noteZh: '承认架构问题，但不让用户替你们的重写买单。',
    },
    {
      en: "Who else is blocked if we freeze the release?",
      zh: '如果我们冻结发布，还有谁会被卡住？',
      noteZh: '做决定前先问影响面，而不是只问对错。',
    },
  ],
  knowledge: [
    {
      id: 'design-tokens',
      titleZh: 'Design tokens：一次改动，全局生效',
      titleEn: 'Design Tokens',
      track: 'frontend',
      summaryZh: 'Token 是设计决策的变量名，不是把颜色换个地方写。',
      pointsZh: [
        '语义命名（surface / text-muted）比色值命名（gray-500）更耐改。',
        '主题切换、品牌定制、深色模式都应在 token 层完成。',
        '迁移必须有视觉回归测试，否则「全量替换」就是全量事故。',
      ],
    },
    {
      id: 'feature-flag',
      titleZh: 'Feature flag：把发布和上线分开',
      titleEn: 'Feature Flags',
      track: 'frontend',
      summaryZh: '代码可以先合并，功能不必同时对用户打开。',
      pointsZh: [
        '每个 flag 都要有 owner 和删除日期，否则会长成技术债。',
        '回滚 flag 比回滚部署快，但别忘了清理旧路径。',
        '权限、计费、数据迁移类改动要更谨慎，flag 不是万能药。',
      ],
    },
    {
      id: 'visual-regression',
      titleZh: '视觉回归测试',
      titleEn: 'Visual Regression Testing',
      track: 'frontend',
      summaryZh: '设计系统的 bug 往往「逻辑正确、像素错误」。',
      pointsZh: [
        '对核心页面和组件做截图对比，阈值要按项目调。',
        '覆盖 dark mode、窄屏、空状态、错误态。',
        '截图测试不是替代人工验收，而是防止「改 A 坏 B」。',
      ],
    },
  ],
  careerPoints: 30,
  goodAt: 4,
  badAt: -2,
  endings: {
    good: {
      id: 'good',
      titleZh: '平台保住了',
      titleEn: 'The platform holds',
      bodyZh:
        '你回滚了主题改动，把 token 迁移放回 flag 后面，并让 Lisa 的 37 张截图进了 CI。Kevin 在复盘会上第一次没有抢话。Victor 说「至少这次架构没被你们玩坏」。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '暂停，不是解决',
      titleEn: 'Paused, not fixed',
      bodyZh:
        '发布冻结到周一，37 个回归还在。Lisa 说她会再跑一轮，Kevin 说他周末没空。你暂时挡住了事故，但没有挡住下一次。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '深色模式灾难',
      titleEn: 'Dark mode disaster',
      bodyZh:
        '你选择相信 Kevin 的「已经测过」。上线后，支付页在深色模式下变成白底白字，客服电话被打爆。Lisa 把 37 张截图甩进了事故群。',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'review',
      en: 'Tuesday, 10:12. The design-system rollout is 20% adopted and 100% on fire.',
      zh: '周二上午 10:12。设计系统铺开 20%，火烧到了 100%。',
      next: 'k1',
    },
    k1: {
      id: 'k1',
      speaker: 'kevin',
      mood: 'smug',
      en: 'Tokens are done. Dark mode is fine. QA is exaggerating again.',
      zh: 'Token 都迁完了。深色模式没问题。QA 又夸张了。',
      choices: [
        {
          id: 'k1-good',
          en: "Show me the diff. If it's 37 regressions, we roll back.",
          zh: '把差异给我看。如果真是 37 个回归，就回滚。',
          quality: 'good',
          noteZh: '不争论谁对，先看证据，再给决定。',
          trust: { kevin: -2, lisa: 4 },
          insight: 2,
          next: 'k1-good-reply',
        },
        {
          id: 'k1-ok',
          en: "Let's check it together after standup.",
          zh: '站会后我们一起看。',
          quality: 'ok',
          noteZh: '态度可以，但把决定往后拖，火还在烧。',
          trust: { kevin: 2, lisa: 1 },
          insight: 1,
          next: 'k1-ok-reply',
        },
        {
          id: 'k1-bad',
          en: "Lisa, re-run your tests. It's probably your environment.",
          zh: 'Lisa，你重跑一下。多半是你环境的问题。',
          quality: 'bad',
          noteZh: '不查证据，先把提问题的人解决掉。',
          trust: { lisa: -8, kevin: 2 },
          next: 'k1-bad-reply',
        },
      ],
    },
    'k1-good-reply': {
      id: 'k1-good-reply',
      speaker: 'kevin',
      mood: 'worried',
      en: "Fine. But don't make this a me problem.",
      zh: '行。但别把这事变成我的问题。',
      next: 'v1',
    },
    'k1-ok-reply': {
      id: 'k1-ok-reply',
      speaker: 'lisa',
      mood: 'tired',
      en: "After standup. Sure. The customers can wait.",
      zh: '站会后。行。用户可以等。',
      next: 'v1',
    },
    'k1-bad-reply': {
      id: 'k1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'I re-ran it three times. Here are the screenshots.',
      zh: '我重跑了三遍。截图在这。',
      next: 'v1',
    },
    v1: {
      id: 'v1',
      speaker: 'victor',
      mood: 'neutral',
      en: "Rolling back treats the symptom. The theme layer needs a proper rewrite.",
      zh: '回滚只是治标。主题层需要一次正经的重写。',
      choices: [
        {
          id: 'v1-good',
          en: "Agreed on the architecture. But we ship the rollback first, then rewrite behind a flag.",
          zh: '架构上我同意。但先回滚上线，再在开关后面重写。',
          quality: 'good',
          noteZh: '承认架构判断，同时把用户从重写里摘出去。',
          trust: { victor: 2, alex: 4 },
          insight: 3,
          requiresInsight: 12,
          next: 'v1-good-reply',
        },
        {
          id: 'v1-ok',
          en: "A rewrite is too much for this quarter.",
          zh: '这个季度重写不现实。',
          quality: 'ok',
          noteZh: '只说不行，没有给替代路径。',
          trust: { victor: -2 },
          next: 'v1-ok-reply',
        },
        {
          id: 'v1-bad',
          en: "Fine, rewrite it. I'll tell Diana we're slipping.",
          zh: '行，重写。我去告诉 Diana 我们要延期。',
          quality: 'bad',
          noteZh: '把技术讨论直接升级成延期威胁。',
          trust: { victor: -4, alex: -6, lisa: -2 },
          next: 'v1-bad-reply',
        },
      ],
    },
    'v1-good-reply': {
      id: 'v1-good-reply',
      speaker: 'victor',
      mood: 'neutral',
      en: "That's... actually reasonable. Send me the rewrite proposal.",
      zh: '这……居然还算合理。把重写方案发我。',
      next: 'a1',
    },
    'v1-ok-reply': {
      id: 'v1-ok-reply',
      speaker: 'victor',
      mood: 'smug',
      en: 'Then you are choosing to keep the debt. Say that in the review.',
      zh: '那你就是在选择保留这笔债。评审会上就这么说。',
      next: 'a1',
    },
    'v1-bad-reply': {
      id: 'v1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: "Nobody is slipping because of an argument in a meeting.",
      zh: '没人会因为会上吵了一架就延期。',
      next: 'a1',
    },
    a1: {
      id: 'a1',
      speaker: 'alex',
      mood: 'neutral',
      en: "What's the call?",
      zh: '决定是什么？',
      choices: [
        {
          id: 'a1-good',
          en: "Roll back now, fix behind a flag, and add visual regression tests.",
          zh: '现在回滚，在开关后面修，再补视觉回归测试。',
          quality: 'good',
          noteZh: '止损、修复、防复发，三步都给出来。',
          trust: { alex: 6, lisa: 4, kevin: -2 },
          insight: 2,
          next: 'a1-good-reply',
        },
        {
          id: 'a1-ok',
          en: 'Freeze the release until Monday.',
          zh: '发布冻结到周一。',
          quality: 'ok',
          noteZh: '挡住了事故，但没有解决根因。',
          trust: { alex: 2, lisa: 2 },
          next: 'a1-ok-reply',
        },
        {
          id: 'a1-bad',
          en: "Ship it. We'll fix forward.",
          zh: '发吧。我们边发边修。',
          quality: 'bad',
          noteZh: '在已知 37 个回归的情况下继续发布。',
          trust: { alex: -8, lisa: -6, kevin: 2 },
          next: 'a1-bad-reply',
        },
      ],
    },
    'a1-good-reply': {
      id: 'a1-good-reply',
      speaker: 'alex',
      mood: 'happy',
      en: 'Good. I want the regression suite in CI by Friday.',
      zh: '好。周五之前我要看到回归测试进 CI。',
      next: 'final',
    },
    'a1-ok-reply': {
      id: 'a1-ok-reply',
      speaker: 'alex',
      mood: 'worried',
      en: "Monday. And bring me a plan, not another meeting.",
      zh: '周一。还有，给我方案，别再给我一个会。',
      next: 'final',
    },
    'a1-bad-reply': {
      id: 'a1-bad-reply',
      speaker: 'alex',
      mood: 'angry',
      en: "On your head. I want the incident channel open in five minutes.",
      zh: '你负责。五分钟内把事故频道开起来。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'The release train stops. Somewhere, a customer refreshes the page and everything is still readable.',
      zh: '发布列车停了下来。某个用户刷新页面，发现一切还看得清。',
      ending: 'auto',
    },
  },
}

const platformIncident: StoryEpisode = {
  id: 'platform-incident',
  arcId: 'management',
  chapterId: '22-on-call-incident',
  order: 9,
  kind: 'crisis',
  track: 'fullstack',
  requiresRank: 5,
  requiresEpisode: 'layoff',
  titleZh: '全链路雪崩',
  titleEn: 'Full-stack Avalanche',
  taglineZh: '支付接口 500，数据库连接池打满。Mark 说这是你的新接口，Victor 说要重写结账流程。',
  scene: 'night',
  characters: [STORY_CHARACTERS.mark, STORY_CHARACTERS.victor, STORY_CHARACTERS.kevin, STORY_CHARACTERS.diana],
  positions: { mark: 'left', victor: 'inner-left', diana: 'center', kevin: 'right' },
  start: 'intro',
  challenge: {
    zh: '先止血再定位：至少 2 个好选择，且不要把事故说成别人的锅',
    minGood: 2,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "Roll back the deploy. Then I'll add a pool limit and cache the hot query.",
      zh: '先回滚这次发布。然后我加连接池上限，再缓存热点查询。',
      noteZh: '止血和修复分开说，别在事故里讲架构理想。',
    },
    {
      en: 'Checkout is back. We rolled back, and we will publish the report today.',
      zh: '结账恢复了。我们回滚了，今天会发事故报告。',
      noteZh: '对客户/老板汇报：状态、动作、下一步。',
    },
    {
      en: "Let's check the query plan before we touch the pool.",
      zh: '动连接池之前，先看查询计划。',
      noteZh: '用证据定位，不要靠猜。',
    },
  ],
  knowledge: [
    {
      id: 'connection-pool',
      titleZh: '连接池：不是越大越好',
      titleEn: 'Connection Pools',
      track: 'fullstack',
      summaryZh: '连接池打满时，先看慢查询和泄漏，不要条件反射地扩容。',
      pointsZh: [
        '每个请求占连接多久，比池子多大更重要。',
        '慢查询、N+1、没有超时，都会把池子拖死。',
        '给连接设置 timeout，给接口设置 rate limit。',
      ],
    },
    {
      id: 'cache-stampede',
      titleZh: '缓存击穿：热点 key 过期的一瞬间',
      titleEn: 'Cache Stampede',
      track: 'fullstack',
      summaryZh: '大量请求同时回源，会把数据库在几秒内打穿。',
      pointsZh: [
        '错峰过期、互斥锁、singleflight 都是常见解法。',
        '缓存要有降级策略，不能把缓存当数据库用。',
        '热点 key 要单独监控，不要只看平均 QPS。',
      ],
    },
    {
      id: 'incident-comms',
      titleZh: '事故汇报：状态、影响、下一步',
      titleEn: 'Incident Communication',
      track: 'fullstack',
      summaryZh: '事故期间，老板和客户只需要三件事：现在怎样、影响谁、什么时候更新。',
      pointsZh: [
        '先给状态："Checkout is back." 再说原因。',
        '不要在没有证据时甩锅给第三方或别的团队。',
        '给出下一次更新时间，哪怕还没修完。',
        '复盘对事不对人，但要有 owner 和截止日期。',
      ],
    },
  ],
  careerPoints: 30,
  goodAt: 4,
  badAt: -2,
  endings: {
    good: {
      id: 'good',
      titleZh: '止血成功',
      titleEn: 'Stopped the bleeding',
      bodyZh:
        '你回滚了发布，给热点查询加了缓存和连接池上限，结账在 18 分钟内恢复。Mark 在复盘会上说：「这次至少有人先止血，再找原因。」Diana 把事故报告转给了董事会。',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '恢复了，但没修好',
      titleEn: 'Back up, not fixed',
      bodyZh:
        '你扩容了数据库，结账恢复。但慢查询还在，连接池还在涨。下周同一时间，警报又响了。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '全链路事故',
      titleEn: 'Full-stack outage',
      bodyZh:
        '你把锅甩给了后端，Mark 在群里贴出了你的 N+1 查询。结账挂了两个小时，客户在社交媒体上直播故障。Diana 在事故群里只发了一句话：「Who is on call?」',
      tone: 'bad',
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'night',
      en: 'Friday, 21:07. Checkout starts returning 500s. The database pool is at 100%.',
      zh: '周五晚上 21:07。结账开始返回 500，数据库连接池 100%。',
      next: 'm1',
    },
    m1: {
      id: 'm1',
      speaker: 'mark',
      mood: 'tired',
      en: 'The pool is maxed. Your new endpoint is the top query. What did you ship?',
      zh: '连接池满了。你新加的接口是查询量第一。你发了什么？',
      choices: [
        {
          id: 'm1-good',
          en: "Roll back the deploy. Then I'll add a pool limit and cache the hot query.",
          zh: '先回滚这次发布。然后我加连接池上限，再缓存热点查询。',
          quality: 'good',
          noteZh: '先止血，再修复，不在事故里争论归属。',
          trust: { mark: 6, diana: 2 },
          insight: 2,
          next: 'm1-good-reply',
        },
        {
          id: 'm1-ok',
          en: 'Scale up the DB and watch it for an hour.',
          zh: '先把数据库扩容，观察一小时。',
          quality: 'ok',
          noteZh: '能缓一口气，但没有解决慢查询。',
          trust: { mark: 2 },
          insight: 1,
          next: 'm1-ok-reply',
        },
        {
          id: 'm1-bad',
          en: 'That endpoint is backend-owned. Mark should fix it.',
          zh: '那个接口是后端负责的。Mark 应该修。',
          quality: 'bad',
          noteZh: '事故还在烧，先分锅。',
          trust: { mark: -8, diana: -4 },
          next: 'm1-bad-reply',
        },
      ],
    },
    'm1-good-reply': {
      id: 'm1-good-reply',
      speaker: 'mark',
      mood: 'neutral',
      en: "I'll roll it back. You owe me a query plan.",
      zh: '我来回滚。你欠我一份查询计划。',
      next: 'k1',
    },
    'm1-ok-reply': {
      id: 'm1-ok-reply',
      speaker: 'mark',
      mood: 'worried',
      en: "Scaling buys us an hour. The query is still garbage.",
      zh: '扩容只能买一小时。那个查询还是垃圾。',
      next: 'k1',
    },
    'm1-bad-reply': {
      id: 'm1-bad-reply',
      speaker: 'mark',
      mood: 'angry',
      en: "My endpoint? Your client calls it in a loop. Here's the trace.",
      zh: '我的接口？你的客户端在循环里调它。链路追踪在这。',
      next: 'k1',
    },
    k1: {
      id: 'k1',
      speaker: 'kevin',
      mood: 'tired',
      en: "I'm not on call this week. I'm sure Mark's team has a runbook.",
      zh: '我这周不值班。Mark 的团队应该有 runbook 吧。',
      next: 'v1',
    },
    v1: {
      id: 'v1',
      speaker: 'victor',
      mood: 'smug',
      en: 'This is why we need a service mesh and a full rewrite of checkout.',
      zh: '这就是为什么我们需要服务网格，还要把结账流程整个重写。',
      choices: [
        {
          id: 'v1-good',
          en: "Maybe. First let's fix the connection pool and write the incident report.",
          zh: '也许吧。先修连接池，把事故报告写了。',
          quality: 'good',
          noteZh: '不否定长期方案，但把顺序拉回当下。',
          trust: { victor: -2, mark: 4, diana: 4 },
          insight: 3,
          requiresInsight: 12,
          next: 'v1-good-reply',
        },
        {
          id: 'v1-ok',
          en: "Let's keep the scope small for now.",
          zh: '现在先把范围控小。',
          quality: 'ok',
          noteZh: '方向对，但没给出具体动作。',
          trust: { victor: 1, mark: 2 },
          next: 'v1-ok-reply',
        },
        {
          id: 'v1-bad',
          en: "Yes, let's rewrite checkout this quarter.",
          zh: '对，这个季度重写结账。',
          quality: 'bad',
          noteZh: '事故还没灭，就承诺一个季度级重写。',
          trust: { victor: 4, mark: -4, diana: -6 },
          next: 'v1-bad-reply',
        },
      ],
    },
    'v1-good-reply': {
      id: 'v1-good-reply',
      speaker: 'victor',
      mood: 'neutral',
      en: "Fine. Put the rewrite in the postmortem as a follow-up, not a rescue plan.",
      zh: '行。把重写放进复盘后续项，别当成救火方案。',
      next: 'd1',
    },
    'v1-ok-reply': {
      id: 'v1-ok-reply',
      speaker: 'victor',
      mood: 'smug',
      en: 'Small scope. Famous last words.',
      zh: '范围小。这话我听过太多次。',
      next: 'd1',
    },
    'v1-bad-reply': {
      id: 'v1-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: "We are not rewriting anything while checkout is down.",
      zh: '结账还挂着，我们不会重写任何东西。',
      next: 'd1',
    },
    d1: {
      id: 'd1',
      speaker: 'diana',
      mood: 'neutral',
      en: 'What do we tell customers, and what do we tell the board?',
      zh: '我们怎么跟客户说？怎么跟董事会说？',
      choices: [
        {
          id: 'd1-good',
          en: 'Checkout is back. We rolled back, and we will publish the report today.',
          zh: '结账恢复了。我们已回滚，今天会发事故报告。',
          quality: 'good',
          noteZh: '状态、动作、下一步，三句话讲完。',
          trust: { diana: 6, mark: 2 },
          insight: 2,
          next: 'd1-good-reply',
        },
        {
          id: 'd1-ok',
          en: "We're still investigating. I'll update you in an hour.",
          zh: '我们还在排查。一小时后给你更新。',
          quality: 'ok',
          noteZh: '诚实，但客户需要知道现在能不能结账。',
          trust: { diana: 2 },
          next: 'd1-ok-reply',
        },
        {
          id: 'd1-bad',
          en: 'It was a third-party outage.',
          zh: '是第三方服务挂了。',
          quality: 'bad',
          noteZh: '没有证据就甩锅，事故报告会打你的脸。',
          trust: { diana: -8, mark: -4 },
          next: 'd1-bad-reply',
        },
      ],
    },
    'd1-good-reply': {
      id: 'd1-good-reply',
      speaker: 'diana',
      mood: 'happy',
      en: 'Good. Report by 6 p.m. tomorrow. Blameless, but specific.',
      zh: '好。明天下午 6 点前交报告。不追责，但要说具体。',
      next: 'final',
    },
    'd1-ok-reply': {
      id: 'd1-ok-reply',
      speaker: 'diana',
      mood: 'worried',
      en: "One hour. And tell them whether they can check out.",
      zh: '一小时。还有，告诉用户他们现在能不能结账。',
      next: 'final',
    },
    'd1-bad-reply': {
      id: 'd1-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: 'The third party is us. Fix the story before the board hears it.',
      zh: '第三方就是我们。在董事会听到之前，把说法改对。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'At 21:25, checkout turns green. Somewhere, a customer buys a coffee without ever knowing you existed.',
      zh: '21:25，结账恢复绿色。某个用户买了一杯咖啡，完全不知道你存在过。',
      ending: 'auto',
    },
  },
}

const forbiddenFile: StoryEpisode = {
  id: 'forbidden-file',
  arcId: 'dark',
  chapterId: '10-slack-im',
  order: 11,
  kind: 'crisis',
  requiresRank: 6,
  titleZh: '不该看的文件',
  titleEn: 'The File You Shouldn’t Have Opened',
  taglineZh: '23:40，共享盘里躺着一份没权限的裁员名单。你点开了。里面有 Lisa 和 Tom。',
  scene: 'night',
  characters: [STORY_CHARACTERS.diana, STORY_CHARACTERS.lisa, STORY_CHARACTERS.tom],
  positions: { lisa: 'left', diana: 'center', tom: 'right' },
  start: 'intro',
  challenge: {
    zh: '守住机密，也守住人：至少 2 个好选择，一次都不要泄露文件内容',
    minGood: 2,
    maxBad: 0,
  },
  languageFocus: [
    {
      en: "I can't talk about what I saw. But I'm here if you need me.",
      zh: '我不能说我看到了什么。但你需要的话，我在。',
      noteZh: '既不透密，也不装作什么都没发生。',
    },
    {
      en: 'Yes. I closed it and I am telling you now. I did not share it.',
      zh: '是我。我关掉了，现在主动告诉你。我没有外传。',
      noteZh: '主动承认 + 说明处置 + 明确没有扩散。',
    },
    {
      en: "I'm not asking what's in it. I'm asking what we do next.",
      zh: '我不是在问里面有什么。我在问接下来怎么办。',
      noteZh: '把对话从八卦拉回行动。',
    },
  ],
  knowledge: [
    {
      id: 'data-classification',
      titleZh: '信息分级：看到不等于可以知道',
      titleEn: 'Data Classification',
      summaryZh: '权限之外的信息，即使无意看到，也不能读取、复制或传播。',
      pointsZh: [
        '发现误开机密文件：立即关闭，不要截图、转发、下载。',
        '主动向 owner 或 HR/法务说明时间、范围和是否外传。',
        '删掉本地副本和聊天记录里的转发，保留必要的审计信息。',
        '不要用「我是为了团队好」为泄露辩护。',
      ],
    },
    {
      id: 'insider-info',
      titleZh: '内幕信息与裁员名单',
      titleEn: 'Insider Information',
      summaryZh: '未公开的裁员、并购、财报信息属于内幕信息，交易或传播都可能违法。',
      pointsZh: [
        '即使只是「提醒朋友」，也可能构成泄露。',
        '不要在 Slack、微信群、私人邮箱里讨论文件内容。',
        '有疑问找 HR、法务或合规热线，不要找同事八卦。',
        '公司有权通过访问日志还原谁在什么时候打开了什么。',
      ],
    },
    {
      id: 'sensitive-reporting',
      titleZh: '如何汇报你看到的敏感信息',
      titleEn: 'Reporting Sensitive Information',
      summaryZh: '汇报的目标是控制风险，不是展示你知道多少。',
      pointsZh: [
        '只说你做了什么："I opened it by mistake and closed it immediately."',
        '不要复述文件内容，除非合规明确要求。',
        '给出时间线和你采取的动作。',
        '问清楚下一步："Do you want me to write a statement?"',
      ],
    },
  ],
  careerPoints: 25,
  goodAt: 4,
  badAt: -2,
  endings: {
    good: {
      id: 'good',
      titleZh: '你保住了工作，也保住了人',
      titleEn: 'You kept your job. And your people.',
      bodyZh:
        '你第一时间告诉 Diana 自己误开了文件、没有外传。HR 记录在案，但没有处分。Lisa 和 Tom 最终留了下来。Diana 在走廊里对你说：「You did the boring, correct thing. That’s rare.」',
      tone: 'good',
    },
    ok: {
      id: 'ok',
      titleZh: '记录在案',
      titleEn: 'On your record',
      bodyZh:
        '你关掉了文件，也没有外传，但你没有主动上报。Security 的日志找到了你。晋升暂缓一个季度，HR 文件夹里多了一页纸。',
      tone: 'ok',
    },
    bad: {
      id: 'bad',
      titleZh: '被开除',
      titleEn: 'Escorted out',
      bodyZh:
        '你把截图发给了 Lisa。十分钟后，全公司都知道了名单。Security 调出门禁和访问日志，HR 在会议室等你，桌上放着一个纸箱。Kevin 接管了你的团队。你走出大楼时，门禁卡已经失效。',
      tone: 'bad',
      fired: true,
    },
  },
  beats: {
    intro: {
      id: 'intro',
      speaker: 'narration',
      scene: 'night',
      en: "23:40. A shared folder you don't remember opening. One file: RIF-2026-confidential.xlsx.",
      zh: '23:40。一个你不记得打开过的共享文件夹。一个文件：RIF-2026-confidential.xlsx。',
      next: 'f1',
    },
    f1: {
      id: 'f1',
      speaker: 'narration',
      mood: 'worried',
      en: 'You open it. Two tabs. Names, severance, dates. Lisa. Tom. Your stomach drops.',
      zh: '你点开了。两个工作表。名字、赔偿、日期。Lisa。Tom。你的胃沉了下去。',
      choices: [
        {
          id: 'f1-good',
          en: "Close it. Tell Diana what I saw, not what's in it.",
          zh: '关掉。告诉 Diana 我看到了什么，但不说里面有什么。',
          quality: 'good',
          noteZh: '停止读取，主动上报，不复述内容。',
          trust: { diana: 6 },
          insight: 3,
          next: 'f1-good-reply',
        },
        {
          id: 'f1-ok',
          en: "Close it and pretend I didn't see it.",
          zh: '关掉，假装没看见。',
          quality: 'ok',
          noteZh: '没有外传，但也没有上报。日志会记得你。',
          trust: { diana: -2 },
          insight: 1,
          next: 'f1-ok-reply',
        },
        {
          id: 'f1-bad',
          en: 'Screenshot it and send it to Lisa.',
          zh: '截图，发给 Lisa。',
          quality: 'bad',
          noteZh: '读取、复制、传播机密信息，一步不落。',
          trust: { lisa: -2, diana: -10 },
          next: 'f1-bad-reply',
        },
        {
          id: 'f1-bad-2',
          en: 'Post it anonymously. They deserve to know.',
          zh: '匿名发出去。他们有权知道。',
          quality: 'bad',
          noteZh: '匿名不等于安全，访问日志能还原一切。',
          trust: { diana: -10, tom: -2 },
          next: 'f1-bad-reply',
        },
      ],
    },
    'f1-good-reply': {
      id: 'f1-good-reply',
      speaker: 'diana',
      mood: 'worried',
      en: "Thank you for telling me. Don't open it again. Don't discuss it with anyone.",
      zh: '谢谢你告诉我。别再打开。也别跟任何人讨论。',
      next: 'l1',
    },
    'f1-ok-reply': {
      id: 'f1-ok-reply',
      speaker: 'narration',
      mood: 'worried',
      en: 'You close the laptop. The file stays open in your head all night.',
      zh: '你合上电脑。那个文件在你脑子里开了一整夜。',
      next: 'l1',
    },
    'f1-bad-reply': {
      id: 'f1-bad-reply',
      speaker: 'narration',
      mood: 'angry',
      en: 'Your phone buzzes. Lisa: "Is this real?" Then Sarah. Then everyone.',
      zh: '手机开始震动。Lisa：「这是真的吗？」然后是 Sarah。然后是所有人。',
      next: 'l1',
    },
    l1: {
      id: 'l1',
      speaker: 'lisa',
      mood: 'worried',
      en: 'You look like you saw a ghost. What’s going on?',
      zh: '你像见了鬼一样。怎么了？',
      choices: [
        {
          id: 'l1-good',
          en: "I can't talk about what I saw. But I'm here if you need me.",
          zh: '我不能说我看到了什么。但你需要的话，我在。',
          quality: 'good',
          noteZh: '不透密，也不装作什么都没发生。',
          trust: { lisa: 4 },
          insight: 2,
          next: 'l1-good-reply',
        },
        {
          id: 'l1-ok',
          en: 'Nothing. Just tired.',
          zh: '没事。就是累了。',
          quality: 'ok',
          noteZh: '暂时安全，但把 Lisa 一个人留在了猜测里。',
          trust: { lisa: -1 },
          next: 'l1-ok-reply',
        },
        {
          id: 'l1-bad',
          en: 'Pack your things. I’m serious.',
          zh: '收拾东西吧。我是认真的。',
          quality: 'bad',
          noteZh: '直接把机密内容变成了口头泄露。',
          trust: { lisa: -10, diana: -4 },
          next: 'l1-bad-reply',
        },
      ],
    },
    'l1-good-reply': {
      id: 'l1-good-reply',
      speaker: 'lisa',
      mood: 'neutral',
      en: "Okay. That's a weird answer. But okay.",
      zh: '行。这回答很奇怪。但行。',
      next: 'd2',
    },
    'l1-ok-reply': {
      id: 'l1-ok-reply',
      speaker: 'lisa',
      mood: 'worried',
      en: 'You’ve been staring at your screen for ten minutes.',
      zh: '你盯着屏幕十分钟了。',
      next: 'd2',
    },
    'l1-bad-reply': {
      id: 'l1-bad-reply',
      speaker: 'lisa',
      mood: 'angry',
      en: 'What do you mean, pack my things? What did you see?',
      zh: '什么叫收拾东西？你看到了什么？',
      next: 'd2',
    },
    d2: {
      id: 'd2',
      speaker: 'diana',
      mood: 'neutral',
      en: 'Security says a confidential file was opened at 23:40. Was it you?',
      zh: 'Security 说 23:40 有一份机密文件被打开了。是你吗？',
      choices: [
        {
          id: 'd2-good',
          en: 'Yes. I closed it and I am telling you now. I did not share it.',
          zh: '是我。我关掉了，现在主动告诉你。我没有外传。',
          quality: 'good',
          noteZh: '主动承认、说明处置、明确没有扩散。',
          trust: { diana: 8 },
          insight: 2,
          next: 'd2-good-reply',
        },
        {
          id: 'd2-ok',
          en: 'I opened it by accident. I didn’t read much.',
          zh: '我不小心打开的。没看多少。',
          quality: 'ok',
          noteZh: '承认了，但「没看多少」很难证明。',
          trust: { diana: -2 },
          next: 'd2-ok-reply',
        },
        {
          id: 'd2-bad',
          en: 'No. It wasn’t me.',
          zh: '不是。不是我。',
          quality: 'bad',
          noteZh: '对合规撒谎，访问日志会拆穿你。',
          trust: { diana: -12, lisa: -4, tom: -4 },
          next: 'd2-bad-reply',
        },
      ],
    },
    'd2-good-reply': {
      id: 'd2-good-reply',
      speaker: 'diana',
      mood: 'neutral',
      en: "Thank you. Write me a statement before 9 a.m. And don't talk to anyone about the contents.",
      zh: '谢谢。早上 9 点前给我一份说明。别跟任何人讨论文件内容。',
      next: 'final',
    },
    'd2-ok-reply': {
      id: 'd2-ok-reply',
      speaker: 'diana',
      mood: 'worried',
      en: "Accident or not, you should have reported it immediately. HR will call you.",
      zh: '不管是不是意外，你都应该立刻上报。HR 会找你。',
      next: 'final',
    },
    'd2-bad-reply': {
      id: 'd2-bad-reply',
      speaker: 'diana',
      mood: 'angry',
      en: 'Security has your badge number. HR is on the way.',
      zh: 'Security 有你的工牌号。HR 已经在路上了。',
      next: 'final',
    },
    final: {
      id: 'final',
      speaker: 'narration',
      en: 'The elevator doors close. In the reflection, you see the version of yourself that still has a job.',
      zh: '电梯门合上。在反光里，你看见那个还保有工作的自己。',
      ending: 'auto',
    },
  },
}

export const STORY_ARCS: StoryArc[] = [
  {
    id: 'promotion',
    titleZh: '晋升线',
    titleEn: 'The Promotion Arc',
    taglineZh: '一个名额，六场硬仗。',
    descriptionZh: '公司重组，只有一个晋升名额。你要在站会、PR、QA、on-call 和答辩里活下来，让 Diana 点头。',
    color: 'var(--color-accent)',
    episodeIds: ['standup', 'pm-deadline', 'oncall-night', 'code-review', 'qa-repro', 'promotion'],
  },
  {
    id: 'management',
    titleZh: '管理线',
    titleEn: 'The Management Arc',
    taglineZh: '从带项目，到带人；从做决定，到承担后果。',
    descriptionZh:
      '升上 Tech Lead 之后，真正的考试才开始：裁员、办公室恋情、专精路线、董事会。你要一路坐到 VP 的椅子上。',
    color: 'var(--color-warn)',
    unlockRank: 5,
    episodeIds: ['layoff', 'office-romance', 'design-system', 'platform-incident', 'vp'],
  },
  {
    id: 'dark',
    titleZh: '暗线',
    titleEn: 'The Dark Arc',
    taglineZh: '有些文件，不该在你这个级别打开。',
    descriptionZh:
      '深夜的共享盘、没有权限的表格、不该知道的名单。你可以装作没看见，也可以毁掉自己的职业生涯。',
    color: '#fb7185',
    unlockRank: 6,
    episodeIds: ['forbidden-file'],
  },
  {
    id: 'jobhop',
    titleZh: '跳槽线',
    titleEn: 'The Job Hop Arc',
    taglineZh: '坐上 VP 之后，看看外面的世界。',
    descriptionZh: '猎头来电，终面只有一个问题：你值不值这个价？',
    color: '#7dd3fc',
    unlockRank: 8,
    episodeIds: ['job-interview'],
  },
]

export const STORY_EPISODES: StoryEpisode[] = [
  standup,
  pmDeadline,
  oncallNight,
  codeReview,
  qaRepro,
  promotion,
  layoff,
  officeRomance,
  designSystem,
  platformIncident,
  forbiddenFile,
  vp,
  jobInterview,
]

export const PROMOTION_UNLOCK = 100
export const CHALLENGE_BONUS = 20

export interface CareerRank {
  level: number
  titleZh: string
  titleEn: string
  salary: string
  minPoints: number
}

export const CAREER_RANKS: CareerRank[] = [
  { level: 1, titleZh: '实习生', titleEn: 'Intern', salary: '¥8k', minPoints: 0 },
  { level: 2, titleZh: '初级前端', titleEn: 'Junior Frontend', salary: '¥15k', minPoints: 40 },
  { level: 3, titleZh: '前端工程师', titleEn: 'Frontend Engineer', salary: '¥22k', minPoints: 100 },
  { level: 4, titleZh: '高级前端', titleEn: 'Senior Frontend', salary: '¥35k', minPoints: 200 },
  { level: 5, titleZh: 'Tech Lead', titleEn: 'Tech Lead', salary: '¥50k', minPoints: 300 },
  { level: 6, titleZh: '工程经理', titleEn: 'Engineering Manager', salary: '¥70k', minPoints: 420 },
  { level: 7, titleZh: '技术总监', titleEn: 'Director of Engineering', salary: '¥100k', minPoints: 560 },
  { level: 8, titleZh: '技术副总裁', titleEn: 'VP of Engineering', salary: '¥150k', minPoints: 700 },
]

export const CAREER_TRACKS: CareerTrackDef[] = [
  {
    id: 'frontend',
    titleZh: '前端路径',
    titleEn: 'The Frontend Track',
    taglineZh: '把体验做成平台，让整个公司交付得更快。',
    descriptionZh:
      '设计系统、性能预算、可访问性、前端基础设施。你从用户看得见的地方往上走，最后坐在 VP 的椅子上替整个前端组织争资源。',
    color: '#5eead4',
    rankTitles: {
      2: { titleZh: '初级前端', titleEn: 'Junior Frontend' },
      3: { titleZh: '前端工程师', titleEn: 'Frontend Engineer' },
      4: { titleZh: '高级前端', titleEn: 'Senior Frontend' },
      5: { titleZh: '前端 Tech Lead', titleEn: 'Frontend Tech Lead' },
      6: { titleZh: '前端工程经理', titleEn: 'Frontend Engineering Manager' },
      7: { titleZh: '前端技术总监', titleEn: 'Director of Frontend' },
      8: { titleZh: '技术副总裁（前端平台）', titleEn: 'VP of Engineering, Frontend Platform' },
    },
  },
  {
    id: 'fullstack',
    titleZh: '全栈路径',
    titleEn: 'The Full-stack Track',
    taglineZh: '从浏览器到数据库，端到端为结果负责。',
    descriptionZh:
      'API 契约、连接池、缓存、可观测性、服务边界。你从跨层问题里长出来，最后用全链路判断坐在 VP 的椅子上。',
    color: '#c4b5fd',
    rankTitles: {
      2: { titleZh: '初级全栈', titleEn: 'Junior Full-stack' },
      3: { titleZh: '全栈工程师', titleEn: 'Full-stack Engineer' },
      4: { titleZh: '高级全栈', titleEn: 'Senior Full-stack' },
      5: { titleZh: '全栈 Tech Lead', titleEn: 'Full-stack Tech Lead' },
      6: { titleZh: '全栈工程经理', titleEn: 'Full-stack Engineering Manager' },
      7: { titleZh: '全栈技术总监', titleEn: 'Director of Full-stack' },
      8: { titleZh: '技术副总裁（全栈架构）', titleEn: 'VP of Engineering, Full-stack Architecture' },
    },
  },
]

export const INSIGHT_START = 10

export function careerRank(rankLevel = 1, track?: CareerTrack): CareerRank {
  const index = Math.max(0, Math.min(CAREER_RANKS.length - 1, Math.round(rankLevel) - 1))
  const base = CAREER_RANKS[index]
  const override = track
    ? CAREER_TRACKS.find((item) => item.id === track)?.rankTitles[base.level]
    : undefined
  return override ? { ...base, ...override } : base
}

export function nextCareerRank(rankLevel = 1): CareerRank | null {
  return CAREER_RANKS[rankLevel] ?? null
}

export function careerProgress(points: number, rankLevel = 1): number {
  const next = nextCareerRank(rankLevel)
  if (!next) return 100
  const current = careerRank(rankLevel)
  const span = next.minPoints - current.minPoints
  if (span <= 0) return 100
  return Math.max(0, Math.min(100, ((points - current.minPoints) / span) * 100))
}

export function episodeChoiceCount(episode: StoryEpisode): number {
  return Object.values(episode.beats).filter((beat) => beat.choices?.length).length
}

export function storyEpisodeById(id: string | undefined): StoryEpisode | undefined {
  return STORY_EPISODES.find((episode) => episode.id === id)
}

export function storyArcById(id: string | undefined): StoryArc | undefined {
  return STORY_ARCS.find((arc) => arc.id === id)
}

export function episodesForArc(arcId: string): StoryEpisode[] {
  const arc = storyArcById(arcId)
  if (!arc) return []
  return arc.episodeIds
    .map((id) => storyEpisodeById(id))
    .filter((episode): episode is StoryEpisode => Boolean(episode))
}

export function episodesForTrack(track: CareerTrack | null): StoryEpisode[] {
  return STORY_EPISODES.filter((episode) => !episode.track || episode.track === track)
}

export function specialtyEpisode(track: CareerTrack): StoryEpisode | undefined {
  return STORY_EPISODES.find((episode) => episode.track === track)
}

export interface StoryProgressView {
  rankLevel: number
  careerPoints: number
  careerTrack: CareerTrack | null
  completedIds: string[]
}

export type EpisodeLock =
  | { kind: 'track'; track: CareerTrack; needsChoice: boolean }
  | { kind: 'rank'; rank: CareerRank }
  | { kind: 'points'; missing: number }
  | { kind: 'episode'; episodeId: string }
  | { kind: 'track-episode'; track: CareerTrack }

/** Single source of truth for whether an episode is playable. */
export function episodeLock(
  episode: StoryEpisode,
  progress: StoryProgressView,
): EpisodeLock | null {
  if (progress.completedIds.includes(episode.id)) return null
  if (episode.track && episode.track !== progress.careerTrack) {
    return { kind: 'track', track: episode.track, needsChoice: progress.careerTrack === null }
  }
  const arc = storyArcById(episode.arcId)
  if (arc?.unlockRank && progress.rankLevel < arc.unlockRank) {
    return {
      kind: 'rank',
      rank: careerRank(arc.unlockRank, progress.careerTrack ?? 'frontend'),
    }
  }
  if (episode.requiresRank && progress.rankLevel < episode.requiresRank) {
    return { kind: 'rank', rank: careerRank(episode.requiresRank, progress.careerTrack ?? 'frontend') }
  }
  if (episode.unlockAt && progress.careerPoints < episode.unlockAt) {
    return { kind: 'points', missing: episode.unlockAt - progress.careerPoints }
  }
  if (episode.requiresEpisode && !progress.completedIds.includes(episode.requiresEpisode)) {
    return { kind: 'episode', episodeId: episode.requiresEpisode }
  }
  if (episode.requiresTrackEpisode) {
    const track = progress.careerTrack
    const specialty = track ? specialtyEpisode(track) : undefined
    if (!specialty || !progress.completedIds.includes(specialty.id)) {
      return { kind: 'track-episode', track: track ?? 'frontend' }
    }
  }
  return null
}

export function choiceScore(quality: StoryQuality): number {
  return quality === 'good' ? 2 : quality === 'bad' ? -2 : 0
}

export function challengePassed(
  episode: StoryEpisode,
  history: StoryChoice[],
  trust: Record<string, number>,
): boolean {
  const good = history.filter((choice) => choice.quality === 'good').length
  const bad = history.filter((choice) => choice.quality === 'bad').length
  if (good < episode.challenge.minGood) return false
  if (episode.challenge.maxBad !== undefined && bad > episode.challenge.maxBad) return false
  if (episode.challenge.minTrust !== undefined) {
    const lowest = Math.min(...episode.characters.map((character) => trust[character.id] ?? 50))
    if (lowest < episode.challenge.minTrust) return false
  }
  return true
}

export function endingFor(episode: StoryEpisode, score: number): StoryEnding {
  if (score >= episode.goodAt) return episode.endings.good
  if (score <= episode.badAt) return episode.endings.bad
  return episode.endings.ok
}
