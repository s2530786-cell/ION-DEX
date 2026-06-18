#!/usr/bin/env python3
"""ION DEX Telegram 频道内容发布系统 v2.0
支持：日报 / 周报 / 里程碑公告 / 维护公告 / 双语输出
"""

import os, subprocess, datetime, urllib.request, urllib.parse, json, sys

BOT_TOKEN = os.environ.get("IONDEX_BOT_TOKEN", "")
CHAT_ID = os.environ.get("IONDEX_TG_CHAT_ID", "@iondex888")
REPO = r"D:\openclaw-tools\ion-dex-nuke"
MODE = os.environ.get("IONDEX_REPORT_MODE", "daily").lower()
GITHUB_URL = "https://github.com/s2530786-cell/ION-DEX"
EXPLORER_URL = "https://explorer.ice.io"

# ── 词汇表 ──
CN_EN_MAP = {
    "新增": "Feature",
    "修复": "Fix",
    "流程": "Chore",
    "文档": "Docs",
    "界面": "UI",
    "进展": "Progress",
    "今日进展": "Today's Progress",
    "今日暂无新的提交记录，开发面保持稳定推进。": "No new public commits today. Development continues steadily.",
    "开发状态": "Dev Status",
    "主线分支": "Main branch",
    "今日提交数": "Today's commits",
    "最近一次自动流水线已触发，主线开发在持续推进。": "The latest automated pipeline has been triggered. Mainline development continues.",
    "当前存在在制改动，部分流程仍在推进中。": "Work-in-progress changes exist. Pipeline operations are ongoing.",
    "当前主线状态稳定。": "Mainline status is stable.",
    "工作区干净，当前版本已整理。": "Workspace is clean. Current version is tidy.",
    "最新提交": "Latest Commits",
    "当前重点": "Current Focus",
    "继续整理在制改动，推进核心功能与部署路径。": "Continuing to organize work-in-progress changes and advance core functionality and deployment paths.",
    "保持前后端与合约主线同步，减少集成阻塞。": "Keeping frontend, backend, and contract mainlines synchronized to reduce integration bottlenecks.",
    "继续推进下一阶段功能落地与验证。": "Advancing the next phase of feature implementation and verification.",
    "保持交付节奏，逐步沉淀公开品牌资产。": "Maintaining delivery cadence and gradually building public brand assets.",
    "官方频道": "Official Channel",
    "验证入口": "Verification",
    "本周进展": "This Week's Progress",
    "本周暂无可提炼的公开开发更新。": "No public development updates to report this week.",
    "本周状态": "Weekly Status",
    "近 7 天提交数": "Last 7 days commits",
    "开发主线仍围绕产品迭代、基础设施稳定和交付节奏推进。": "Development continues on core iteration, infrastructure stability, and delivery cadence.",
    "下周重点": "Next Week's Focus",
    "持续推进核心功能落地与公开可见进展。": "Continue advancing core feature implementation and publicly visible progress.",
    "优化工程流程与对外交付质量。": "Optimize engineering workflows and public delivery quality.",
    "强化 ION DEX 官方品牌窗口的持续输出。": "Strengthen the ION DEX official brand channel's ongoing output.",
}


def run(cmd):
    try:
        return subprocess.check_output(
            cmd, shell=True, text=True, encoding='utf-8', errors='ignore',
            cwd=REPO, stderr=subprocess.STDOUT,
        ).strip()
    except subprocess.CalledProcessError as e:
        return (e.output or str(e)).strip()


def lines(text):
    return [line.strip() for line in text.splitlines() if line.strip()]


def classify_commit(msg):
    m = msg.lower()
    if "fix(" in m or m.startswith("fix"): return "新增" if "feat" in m else "修复"
    if "feat(" in m or m.startswith("feat"): return "新增"
    if "pipeline:" in m or "chore(" in m or m.startswith("chore"): return "流程"
    if "docs(" in m or "readme" in m: return "文档"
    if "ui(" in m or "style(" in m: return "界面"
    return "进展"


def summarize_commits(commit_lines, limit=4):
    out = []
    for raw in commit_lines[:limit]:
        parts = raw.split(" ", 1)
        sha, msg = (parts[0][:8], parts[1]) if len(parts) == 2 else (raw[:8], raw)
        out.append((sha, classify_commit(msg), msg))
    return out


def working_state(status_lines):
    if not status_lines:
        return "工作区干净，当前版本已整理。"
    return f"工作区仍有 {len(status_lines)} 项变更，正在持续整理与推进。"


def pipeline_state(status_lines, latest_lines):
    latest = " ".join(latest_lines[:2]).lower()
    if "pipeline:" in latest:
        return "最近一次自动流水线已触发，主线开发在持续推进。"
    if status_lines:
        return "当前存在在制改动，部分流程仍在推进中。"
    return "当前主线状态稳定。"


def translate_cn(text):
    """简单词汇表翻译，不翻译 commit message 和变量"""
    return CN_EN_MAP.get(text, text)


def build_bilingual_section(cn_lines, en_lines):
    """构建中英双语段落"""
    out = []
    out.append("[中]")
    out.extend(cn_lines)
    out.append("")
    out.append("[EN]")
    out.extend(en_lines)
    return out


def build_daily_report():
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    branch = run("git branch --show-current") or "main"
    latest = lines(run("git log --oneline -8"))
    today = lines(run("git log --since=midnight --oneline"))
    status = lines(run("git status --short"))
    today_summary = summarize_commits(today if today else latest, 4)
    latest_summary = summarize_commits(latest, 3)

    report = []
    report.append(f"ION DEX Development Update | {now}")
    report.append("")

    # ── 今日进展 ──
    cn_progress = []
    en_progress = []
    if today_summary:
        for sha, kind, msg in today_summary:
            en_kind = translate_cn(kind)
            cn_progress.append(f"- {kind}：{msg} ({sha})")
            en_progress.append(f"- {en_kind}: {msg} ({sha})")
    else:
        cn_progress.append("- 今日暂无新的提交记录，开发面保持稳定推进。")
        en_progress.append("- No new public commits today. Development continues steadily.")

    report.append("[中] 今日进展")
    report.extend(cn_progress)
    report.append("")
    report.append("[EN] Today's Progress")
    report.extend(en_progress)
    report.append("")

    # ── 开发状态 ──
    report.append("[中] 开发状态")
    report.append(f"- 主线分支：{branch}")
    report.append(f"- 今日提交数：{len(today)}")
    report.append(f"- {pipeline_state(status, latest)}")
    report.append(f"- {working_state(status)}")
    report.append("")
    report.append("[EN] Dev Status")
    report.append(f"- Main branch: {branch}")
    report.append(f"- Today's commits: {len(today)}")
    report.append(f"- {translate_cn(pipeline_state(status, latest))}")
    ws = working_state(status)
    if "工作区干净" in ws:
        report.append("- Workspace is clean. Current version is tidy.")
    else:
        report.append(f"- Workspace has {len(status)} pending changes, being organized and advanced.")
    report.append("")

    # ── 最新提交 ──
    report.append("[中] 最新提交")
    for sha, kind, msg in latest_summary:
        report.append(f"- {msg} ({sha})")
    report.append("")
    report.append("[EN] Latest Commits")
    for sha, kind, msg in latest_summary:
        report.append(f"- {msg} ({sha})")
    report.append("")

    # ── 当前重点 ──
    report.append("[中] 当前重点")
    if status:
        report.append("- 继续整理在制改动，推进核心功能与部署路径。")
        report.append("- 保持前后端与合约主线同步，减少集成阻塞。")
    else:
        report.append("- 继续推进下一阶段功能落地与验证。")
        report.append("- 保持交付节奏，逐步沉淀公开品牌资产。")
    report.append("")
    report.append("[EN] Current Focus")
    if status:
        report.append("- Continuing to organize work-in-progress changes and advance core functionality and deployment paths.")
        report.append("- Keeping frontend, backend, and contract mainlines synchronized to reduce integration bottlenecks.")
    else:
        report.append("- Advancing the next phase of feature implementation and verification.")
        report.append("- Maintaining delivery cadence and gradually building public brand assets.")

    report.append("")
    report.append(f"验证入口：{GITHUB_URL}")
    report.append(f"Verification: {GITHUB_URL}")
    report.append("@iondex888")
    return "\n".join(report)


def build_weekly_report():
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    weekly = lines(run("git log --since=\"7 days ago\" --oneline"))
    latest = lines(run("git log --oneline -10"))
    status = lines(run("git status --short"))
    summary = summarize_commits(weekly if weekly else latest, 6)

    report = []
    report.append(f"ION DEX Weekly Development Report | {now}")
    report.append("")

    # ── 本周进展 ──
    cn_progress = []
    en_progress = []
    if summary:
        for sha, kind, msg in summary:
            en_kind = translate_cn(kind)
            cn_progress.append(f"- {kind}：{msg} ({sha})")
            en_progress.append(f"- {en_kind}: {msg} ({sha})")
    else:
        cn_progress.append("- 本周暂无可提炼的公开开发更新。")
        en_progress.append("- No public development updates to report this week.")

    report.append("[中] 本周进展")
    report.extend(cn_progress)
    report.append("")
    report.append("[EN] This Week's Progress")
    report.extend(en_progress)
    report.append("")

    # ── 本周状态 ──
    report.append("[中] 本周状态")
    report.append(f"- 近 7 天提交数：{len(weekly)}")
    report.append(f"- {working_state(status)}")
    report.append("- 开发主线仍围绕产品迭代、基础设施稳定和交付节奏推进。")
    report.append("")
    report.append("[EN] Weekly Status")
    report.append(f"- Last 7 days commits: {len(weekly)}")
    ws = working_state(status)
    if "工作区干净" in ws:
        report.append("- Workspace is clean. Current version is tidy.")
    else:
        report.append(f"- Workspace has {len(status)} pending changes, being organized and advanced.")
    report.append("- Development continues on core iteration, infrastructure stability, and delivery cadence.")
    report.append("")

    # ── 下周重点 ──
    report.append("[中] 下周重点")
    report.append("- 持续推进核心功能落地与公开可见进展。")
    report.append("- 优化工程流程与对外交付质量。")
    report.append("- 强化 ION DEX 官方品牌窗口的持续输出。")
    report.append("")
    report.append("[EN] Next Week's Focus")
    report.append("- Continue advancing core feature implementation and publicly visible progress.")
    report.append("- Optimize engineering workflows and public delivery quality.")
    report.append("- Strengthen the ION DEX official brand channel's ongoing output.")

    report.append("")
    report.append(f"验证入口：{GITHUB_URL}")
    report.append(f"Verification: {GITHUB_URL}")
    report.append("@iondex888")
    return "\n".join(report)


def build_report():
    if MODE == "weekly":
        return build_weekly_report()
    return build_daily_report()


def send(text):
    if not BOT_TOKEN:
        raise SystemExit("Missing IONDEX_BOT_TOKEN")
    data = urllib.parse.urlencode({"chat_id": CHAT_ID, "text": text}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", data=data
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read().decode())
        if not result.get("ok"):
            print(f"Telegram send error: {result}", file=sys.stderr)
        return result


if __name__ == '__main__':
    report = build_report()
    try:
        print(report.encode('utf-8', errors='ignore').decode('utf-8'))
    except Exception:
        pass
    send(report)
