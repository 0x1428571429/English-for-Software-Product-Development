# English for Software Product Development

> [English](README.md) · [中文](README.zh.md)

A practical English guide for Chinese software engineers in global teams. Focuses on real-world communication scenarios and spoken English that engineers actually use.

---

## Overview

Most English courses teach you "correct English." But nobody actually talks like that at work.

This book doesn't teach grammar, writing, or business emails. It answers one question:

> **What would an actual engineer say in this situation?**

Each chapter starts with a **real conversation**, then breaks it down expression by expression — with alternatives, common Chinglish mistakes, and pronunciation tips.

---

## Features

- **No textbook English** — Every expression is under 8 words. No one talks like that to their teammates.
- **AI is everywhere** — AI is embedded in every scenario, not a separate chapter. You discuss AI-generated code, debug together, and review AI output with colleagues.
- **Nobody is perfect** — Someone shifts blame, someone can't say no, someone cuts corners, AI makes things worse. Real problems make real content.
- **No product names** — No ChatGPT, GPT, or Claude. Just AI.

---

## Contents

| Chapter | Scenarios |
|---------|-----------|
| 01-daily-standup | Standup — progress, blockers, stuck, interruptions, AI |
| 02-sprint-planning | Planning — estimation, scope creep, unrealistic demands |
| 03-refinement | Requirements review — challenges, pushback, compromises |
| 04-test-review | Test review — edge cases, priorities, automation vs manual |
| 05-demo | Demo meeting — crashes, unexpected questions, scope changes |
| 06-bug-demo | Bug demo — can't reproduce, environment issues, AI analysis |
| 07-code-review | Code review — suggestions, debates, LGTM, nitpicking |
| 08-api-integration | API integration — 500s, mismatched fields, timeouts, CORS |
| 09-phone-calls | Phone calls — lag, mute, missed audio, interruptions |
| 10-slack-im | Slack / IM — @mentions, bumping, code snippets, async |
| 11-with-qa | Talking to QA — reproduction, environment, old bugs |
| 12-with-pm | Talking to PM — changes, deadlines, wasted work, AI magic |
| 13-with-backend | Talking to backend — outdated docs, untracked changes |
| 14-with-designer | Talking to designer — feasibility, missing edge cases |
| 15-user-guidance | User guidance — screenshots, cache, "old version was better" |
| 16-task-assignment | Task assignment — nobody wants it, mentoring, urgent breaks |
| 17-help-colleague | Helping colleagues — don't know either, AI made it worse |
| 18-debugging | Debugging — "it was working", bisecting, restart fixed it |
| 19-asking-for-help | Asking for help — dumb questions, solved it myself |
| 20-technical-discussion | Technical discussion — spikes, trade-offs, debt |
| 21-alignment-discussion | Alignment meetings — info gaps, blame game |
| 22-on-call-incident | On-call incidents — rollback, hotfix, postmortem |

---

## How to Use

Each chapter is a folder containing one full dialogue and multiple analysis files.

```
01-daily-standup/
├── 01-dialogue.md           Full dialogue (English only)
├── 02-still-on-it.md        Analysis: "Still on it"
├── 03-wrapped-up-pr-up.md   Analysis: "Wrapped up / PR is up"
├── ...
├── 10-vocab.md              Vocabulary list
└── 11-pronunciation.md      Pronunciation guide
```

**Suggested workflow:**

1. **Read the dialogue** `01-dialogue.md` — get a feel for the scenario
2. **Study the breakdown** `02-xxx.md` — learn alternatives and common mistakes
3. **Practice pronunciation** `pronunciation.md` — say the tricky words out loud
4. **Review vocabulary** `vocab.md` — reinforce key terms

---

## Project Structure

```
AGENTS.md                   Style guide
README.md                   This document (English)
README.zh.md                Chinese version
frontend-engineer/          22 chapters
└── reference/              Reference files
    ├── common-mistakes.md        Common Chinglish mistakes
    ├── pronunciation.md          Pronunciation table
    ├── high-frequency-expressions.md  Quick reference
    └── scenarios-brainstorm.md   Master scenario list
```

---

## Contributing

Found a new trouble scenario? Want to add expressions for a situation?

1. Add the scenario to `reference/scenarios-brainstorm.md`
2. Create an analysis file in the corresponding chapter
3. Mark `[ ]` to `[x]` in the brainstorm file

---

## License

MIT
