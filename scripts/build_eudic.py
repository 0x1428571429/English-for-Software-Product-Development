#!/usr/bin/env python3
"""
Build output/eudic_import.txt for 欧路词典 import.
Reads English-Chinese pairs from frontend-engineer markdown files,
and pairs dialogue lines with translations from scripts/dialogue_data.json.
"""
import re
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "frontend-engineer"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CHAPTER_NAMES = {
    "01-daily-standup": "站会",
    "02-sprint-planning": "迭代排期",
    "03-refinement": "需求评审",
    "04-test-review": "测试评审",
    "05-demo": "演示",
    "06-bug-demo": "Bug演示",
    "07-code-review": "代码审查",
    "08-api-integration": "API联调",
    "09-phone-calls": "电话会议",
    "10-slack-im": "Slack消息",
    "11-with-qa": "与QA沟通",
    "12-with-pm": "与PM沟通",
    "13-with-backend": "与后端沟通",
    "14-with-designer": "与设计师沟通",
    "15-user-guidance": "用户指导",
    "16-task-assignment": "任务分配",
    "17-help-colleague": "帮助同事",
    "18-debugging": "调试",
    "19-asking-for-help": "请求帮助",
    "20-technical-discussion": "技术讨论",
    "21-alignment-discussion": "对齐会议",
    "22-on-call-incident": "线上事故",
}

EXPRESSION_FALLBACK = {
    "CI is failing": "CI 挂了",
    "There's a flaky test": "有个不稳定的测试",
    "The build is red": "构建红了",
    "I can't choose": "选不了——每个都很重要",
    "I'm confused": "我搞混了——需求一直在变",
    "It's intermittent": "时好时坏——大概 60% 的概率",
    "It's a regression": "这是回归——之前修过的",
    "This blocks the UI": "这阻塞了 UI——用户会走掉",
    "LGTM": "LGTM——Looks Good To Me",
    "Just saw this thread": "刚看到这个 thread——我的看法",
    "Slack me the details": "Slack 发我细节",
    "I already tried AI": "我试过 AI 了",
    "AI suggested X but I'm not sure": "AI 说是 X 但我不确定",
    "AI can generate it but you need to verify": "AI 能生成但你要验证",
    "AI doesn't know the business logic": "AI 不了解业务逻辑",
    "AI fixed it": "AI 修好了——我直接信了",
    "AI can't build your backend for you": "AI 不能帮你建后端",
    "AI won't solve this": "AI 解决不了这个",
    "I know about that issue": "我知道那个问题——正在修",
    "We can't finish so many works": "做不完这么多工作",
    "AI estimated it at X but I think it's Y": "AI 估了 X 但我觉得是 Y",
    "AI doesn't know our codebase": "AI 不了解我们的代码库",
    "AI's estimate is too optimistic": "AI 估得太乐观",
}

def escape_comma(text):
    return text.replace(",", "，")

def has_cjk(text):
    return any('\u4e00' <= c <= '\u9fff' or '\u3000' <= c <= '\u303f' for c in text)

def extract_expression_pairs(filepath):
    pairs = []
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if " — " in stripped and not stripped.startswith("|"):
            if stripped.startswith("❌") or stripped.startswith("- ❌"):
                continue
            parts = stripped.split(" — ", 1)
            if len(parts) != 2:
                continue
            english = parts[0].lstrip("- ").strip()
            chinese = parts[1].strip().lstrip("- ").strip()
            if not english:
                continue
            if has_cjk(chinese) and not chinese.startswith("http"):
                pairs.append((english, chinese))
            else:
                zh = EXPRESSION_FALLBACK.get(english)
                if zh:
                    pairs.append((english, zh))
    return pairs

def extract_vocab_pairs(filepath):
    pairs = []
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- ") and " — " in stripped:
            parts = stripped.split(" — ", 1)
            english = parts[0].lstrip("- ").strip()
            chinese = parts[1].strip()
            idx = chinese.find("。")
            if idx != -1:
                chinese = chinese[:idx]
            if chinese.startswith('"') and chinese.endswith('"'):
                chinese = chinese[1:-1]
            if english and chinese:
                pairs.append((english, chinese))
    return pairs

def extract_dialogue_lines(filepath):
    lines = filepath.read_text(encoding="utf-8").split("\n")
    dialogue_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("> ") and ": " in stripped:
            content = stripped[2:]
            idx = content.find(": ")
            sentence = content[idx+2:].strip()
            if sentence:
                dialogue_lines.append(sentence)
    return dialogue_lines

def extract_heading_pairs(filepath):
    pairs = []
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = re.match(r'^##+\s+"(.+)"', stripped)
        if m:
            current_en = m.group(1)
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and not next_line.startswith("#") and not next_line.startswith(">") and not next_line.startswith("-") and not next_line.startswith("|"):
                    pairs.append((current_en, next_line))
    return pairs

def extract_standalone_bullets(filepath):
    pairs = []
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- ") and " — " not in stripped and not stripped.startswith("- ❌"):
            content = stripped[2:].strip()
            if content and content[0].isascii() and content[0].isalpha():
                zh = EXPRESSION_FALLBACK.get(content)
                if zh:
                    pairs.append((content, zh))
    return pairs

def extract_table_pairs(filepath):
    pairs = []
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            cols = [c.strip() for c in stripped.split("|")[1:-1]]
            if len(cols) != 2:
                continue
            if all(re.match(r'^-{2,}$', c) for c in cols):
                continue
            header_keywords = {"怎么说", "情况", "英文", "中文", "使用场景", "例句"}
            if header_keywords & set(cols):
                continue
            if cols[0] and cols[1]:
                pairs.append((cols[1], cols[0]))
    return pairs

def generate_output():
    chapter_dirs = sorted([d for d in BASE_DIR.iterdir() if d.is_dir() and d.name != "reference"])
    
    # Load dialogue translations
    translations_path = Path(__file__).parent / "dialogue_data.json"
    dialogue_translations = {}
    if translations_path.exists():
        with open(translations_path, "r", encoding="utf-8") as f:
            dialogue_translations = json.load(f)

    all_lines = []
    chapter_count = 0
    dialogue_count = 0
    expression_count = 0
    vocab_count = 0

    for chapter in chapter_dirs:
        chapter_name = chapter.name
        chapter_title = CHAPTER_NAMES.get(chapter_name, chapter_name)
        files = sorted(chapter.glob("*.md"))
        
        chapter_lines = []

        for filepath in files:
            fname = filepath.name

            if fname == "pronunciation.md":
                continue

            if fname == "01-dialogue.md":
                for sentence in extract_dialogue_lines(filepath):
                    zh = dialogue_translations.get(sentence, "")
                    if zh:
                        chapter_lines.append((escape_comma(sentence), escape_comma(zh)))
                        dialogue_count += 1

            elif "vocab" in fname:
                for en, zh in extract_vocab_pairs(filepath):
                    chapter_lines.append((escape_comma(en), escape_comma(zh)))
                    vocab_count += 1

            else:
                for en, zh in extract_heading_pairs(filepath):
                    chapter_lines.append((escape_comma(en), escape_comma(zh)))
                    expression_count += 1

                for en, zh in extract_expression_pairs(filepath):
                    chapter_lines.append((escape_comma(en), escape_comma(zh)))
                    expression_count += 1

                for en, zh in extract_standalone_bullets(filepath):
                    chapter_lines.append((escape_comma(en), escape_comma(zh)))
                    expression_count += 1

                for en, zh in extract_table_pairs(filepath):
                    chapter_lines.append((escape_comma(en), escape_comma(zh)))
                    expression_count += 1

        # Dedup within chapter
        seen = set()
        deduped = []
        for en, zh in chapter_lines:
            key = (en.lower().strip(), zh.strip())
            if key not in seen:
                seen.add(key)
                deduped.append((en, zh))

        all_lines.append((chapter_title, deduped))
        chapter_count += 1

    # Write output
    output_path = OUTPUT_DIR / "eudic_import.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        for chapter_title, lines in all_lines:
            f.write(f"#{chapter_title}\n")
            for en, zh in lines:
                f.write(f"{en},{zh}\n")

    total = sum(len(lines) for _, lines in all_lines)
    print(f"Chapters: {chapter_count}")
    print(f"Total entries: {total}")
    print(f"  Dialogue (with translations): {dialogue_count}")
    print(f"  Expression: {expression_count}")
    print(f"  Vocab: {vocab_count}")
    print(f"\nOutput: {output_path}")

if __name__ == "__main__":
    generate_output()
