export type ReportingSectionKey = 'conclusion' | 'evidence' | 'risk' | 'ask'

export interface ReportingSection {
  key: ReportingSectionKey
  labelZh: string
  labelEn: string
  placeholderZh: string
  exampleEn: string
}

export interface ReportingScenario {
  id: string
  titleZh: string
  titleEn: string
  situationZh: string
  audienceZh: string
  goalZh: string
  frameworkZh: string
  sections: ReportingSection[]
  phrases: { en: string; zh: string; noteZh: string }[]
}

export interface ReportingFramework {
  id: string
  titleZh: string
  titleEn: string
  formulaZh: string
  descriptionZh: string
  bestForZh: string
}

export const REPORTING_FRAMEWORKS: ReportingFramework[] = [
  {
    id: 'bluf',
    titleZh: '结论先行',
    titleEn: 'BLUF — Bottom Line Up Front',
    formulaZh: '结论 → 依据 → 风险 → 请求',
    descriptionZh: '先说结果，再说过程。老板可以在 10 秒内知道要不要继续听。',
    bestForZh: '周报、向 VP/董事会同步、跨团队对齐',
  },
  {
    id: 'scqa',
    titleZh: '情境—冲突—问题—答案',
    titleEn: 'SCQA',
    formulaZh: 'Situation → Complication → Question → Answer',
    descriptionZh: '先建立共识，再制造张力，最后给出答案。适合说服和方案汇报。',
    bestForZh: '方案评审、预算申请、晋升答辩',
  },
  {
    id: 'star',
    titleZh: '情境—任务—行动—结果',
    titleEn: 'STAR',
    formulaZh: 'Situation → Task → Action → Result',
    descriptionZh: '用具体行为证明能力。每个行动都要能对应一个可验证的结果。',
    bestForZh: '面试、晋升材料、复盘个人贡献',
  },
  {
    id: 'incident',
    titleZh: '事故汇报',
    titleEn: 'Incident Update',
    formulaZh: '状态 → 影响 → 已采取动作 → 下次更新时间',
    descriptionZh: '事故期间不追求完整，追求可行动。先告诉别人现在能不能用。',
    bestForZh: '线上事故、客户通告、值班交接',
  },
]

export const REPORTING_SCENARIOS: ReportingScenario[] = [
  {
    id: 'weekly-update',
    titleZh: '向 VP 做周报',
    titleEn: 'Weekly Update to the VP',
    situationZh: '你负责的结账重构晚了两周，但核心链路已经上线，错误率下降。',
    audienceZh: 'VP of Engineering',
    goalZh: '让 VP 知道进展、风险和你要的支持，而不是听你解释为什么延期。',
    frameworkZh: '结论先行',
    sections: [
      {
        key: 'conclusion',
        labelZh: '结论',
        labelEn: 'Bottom line',
        placeholderZh: '一句话：现在是什么状态？',
        exampleEn: 'Checkout is live for 80% of traffic, two weeks behind the original date.',
      },
      {
        key: 'evidence',
        labelZh: '依据',
        labelEn: 'Evidence',
        placeholderZh: '用什么数字或事实支撑？',
        exampleEn: 'Error rate dropped from 2.1% to 0.4%, and p95 latency is down 300ms.',
      },
      {
        key: 'risk',
        labelZh: '风险',
        labelEn: 'Risk',
        placeholderZh: '最大的风险是什么？',
        exampleEn: 'The remaining 20% depends on the legacy pricing service.',
      },
      {
        key: 'ask',
        labelZh: '请求',
        labelEn: 'Ask',
        placeholderZh: '你需要老板做什么决定？',
        exampleEn: 'I need one backend engineer for two weeks to finish the migration.',
      },
    ],
    phrases: [
      {
        en: "Here's the headline: we're two weeks behind, but the core path is live.",
        zh: '先给结论：我们晚了两周，但核心链路已经上线。',
        noteZh: '先给状态，再解释。',
      },
      {
        en: 'The risk is the legacy pricing service. I need one engineer to de-risk it.',
        zh: '风险在旧版计价服务。我需要一个工程师来降低风险。',
        noteZh: '风险后面紧跟请求，别让老板猜。',
      },
      {
        en: "I'll update you again on Friday.",
        zh: '周五我再同步一次。',
        noteZh: '主动给出下一次更新时间。',
      },
    ],
  },
  {
    id: 'incident-review',
    titleZh: '线上事故复盘',
    titleEn: 'Incident Review',
    situationZh: '结账接口因连接池耗尽挂了 18 分钟，已回滚，客户影响约 4,000 单。',
    audienceZh: '工程团队 + 客服 + 管理层',
    goalZh: '不甩锅，讲清楚发生了什么、影响多大、怎么防止复发。',
    frameworkZh: '事故汇报',
    sections: [
      {
        key: 'conclusion',
        labelZh: '状态',
        labelEn: 'Status',
        placeholderZh: '现在恢复了吗？',
        exampleEn: 'Checkout is back. The rollback completed at 21:25.',
      },
      {
        key: 'evidence',
        labelZh: '影响',
        labelEn: 'Impact',
        placeholderZh: '影响了谁、多久、多少？',
        exampleEn: 'About 4,000 orders failed over 18 minutes. No data was lost.',
      },
      {
        key: 'risk',
        labelZh: '根因',
        labelEn: 'Root cause',
        placeholderZh: '根因是什么？不要写人名。',
        exampleEn: 'A new endpoint ran an N+1 query and exhausted the connection pool.',
      },
      {
        key: 'ask',
        labelZh: '后续',
        labelEn: 'Follow-ups',
        placeholderZh: '谁在什么时候之前做什么？',
        exampleEn: 'I own the pool limit by Tuesday; Mark owns the query fix by Thursday.',
      },
    ],
    phrases: [
      {
        en: 'Checkout is back. We rolled back and will publish the report today.',
        zh: '结账恢复了。我们已回滚，今天会发报告。',
        noteZh: '状态、动作、下一步。',
      },
      {
        en: 'This was our change, not a third-party outage.',
        zh: '这是我们的改动，不是第三方故障。',
        noteZh: '有证据就承担，别甩锅。',
      },
      {
        en: 'The follow-up has an owner and a date.',
        zh: '后续项有负责人和截止日期。',
        noteZh: '复盘没有 owner 就等于没复盘。',
      },
    ],
  },
  {
    id: 'promotion-case',
    titleZh: '晋升答辩',
    titleEn: 'Promotion Case',
    situationZh: '你要证明自己已经具备下一职级的影响力，而不只是完成了本职工作。',
    audienceZh: '晋升委员会 / Diana',
    goalZh: '用三个有结果的故事，证明你的影响超出了当前职级。',
    frameworkZh: 'STAR',
    sections: [
      {
        key: 'conclusion',
        labelZh: '主张',
        labelEn: 'Claim',
        placeholderZh: '你要证明什么？',
        exampleEn: "I'm operating at the next level: I changed how three teams ship.",
      },
      {
        key: 'evidence',
        labelZh: '证据',
        labelEn: 'Evidence',
        placeholderZh: '哪一个项目、什么结果？',
        exampleEn: 'The design system cut UI bugs by 40% and onboarding time by two weeks.',
      },
      {
        key: 'risk',
        labelZh: '反思',
        labelEn: 'Reflection',
        placeholderZh: '你哪里做得不够？学到了什么？',
        exampleEn: 'I rolled out too fast and missed dark-mode regressions. Now I ship behind flags.',
      },
      {
        key: 'ask',
        labelZh: '请求',
        labelEn: 'Ask',
        placeholderZh: '你要委员会做什么？',
        exampleEn: "I'm asking the committee to confirm my promotion to Tech Lead.",
      },
    ],
    phrases: [
      {
        en: "I'm not here to list tasks. I'm here to show impact.",
        zh: '我不是来列任务的。我是来证明影响力的。',
        noteZh: '开场就把答辩从「苦劳」拉到「结果」。',
      },
      {
        en: 'The result was a 40% drop in UI bugs across three teams.',
        zh: '结果是三个团队的 UI bug 下降了 40%。',
        noteZh: '结果要有数字和范围。',
      },
      {
        en: 'I rolled it out too fast. That is why I now ship behind flags.',
        zh: '我当时推得太快。所以我现在都用开关发布。',
        noteZh: '承认失误，但落到行为改变。',
      },
    ],
  },
  {
    id: 'budget-ask',
    titleZh: '向董事会要预算',
    titleEn: 'Budget Ask',
    situationZh: '平台团队缺两个人，否则明年的稳定性目标无法完成。',
    audienceZh: '董事会 / CFO',
    goalZh: '把「我要人」翻译成「不给人会损失什么」。',
    frameworkZh: 'SCQA',
    sections: [
      {
        key: 'conclusion',
        labelZh: '答案',
        labelEn: 'Answer',
        placeholderZh: '你要多少钱、多少人？',
        exampleEn: 'I need two engineers to hit the 99.95% availability target.',
      },
      {
        key: 'evidence',
        labelZh: '情境',
        labelEn: 'Situation',
        placeholderZh: '现在的业务背景是什么？',
        exampleEn: 'Checkout volume doubled this year, and on-call load doubled with it.',
      },
      {
        key: 'risk',
        labelZh: '冲突',
        labelEn: 'Complication',
        placeholderZh: '不解决会怎样？',
        exampleEn: 'Without the hires, we miss the target and pay more in incident overtime.',
      },
      {
        key: 'ask',
        labelZh: '请求',
        labelEn: 'Ask',
        placeholderZh: '你要董事会什么时候决定？',
        exampleEn: 'I need a decision by Friday so we can open the reqs this quarter.',
      },
    ],
    phrases: [
      {
        en: 'Option A costs two engineers. Option B costs one quarter of roadmap.',
        zh: '方案 A 要两个工程师，方案 B 要一个季度的路线图。',
        noteZh: '把预算变成选项，而不是乞讨。',
      },
      {
        en: 'Without the hires, we miss the target and pay more in incidents.',
        zh: '不招人，我们完不成目标，还会在事故上付更多。',
        noteZh: '把成本和风险挂钩。',
      },
      {
        en: 'I need a decision by Friday.',
        zh: '我需要周五之前拿到决定。',
        noteZh: '明确决策截止时间。',
      },
    ],
  },
]

export function reportingScenarioById(id: string | undefined): ReportingScenario | undefined {
  return REPORTING_SCENARIOS.find((scenario) => scenario.id === id)
}

export function reportingFramework(id: string): ReportingFramework | undefined {
  return REPORTING_FRAMEWORKS.find((framework) => framework.id === id)
}
