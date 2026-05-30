import os, subprocess, datetime, urllib.request, urllib.parse

BOT_TOKEN = os.environ.get("IONDEX_BOT_TOKEN", "")
CHAT_ID = os.environ.get("IONDEX_TG_CHAT_ID", "@iondex888")
REPO = r"D:\openclaw-tools\ion-dex-nuke"
MODE = os.environ.get("IONDEX_REPORT_MODE", "daily").lower()


def run(cmd):
    try:
        return subprocess.check_output(
            cmd,
            shell=True,
            text=True,
            encoding='utf-8',
            errors='ignore',
            cwd=REPO,
            stderr=subprocess.STDOUT,
        ).strip()
    except subprocess.CalledProcessError as e:
        return (e.output or str(e)).strip()


def lines(text):
    return [line.strip() for line in text.splitlines() if line.strip()]


def classify_commit(msg):
    m = msg.lower()
    if "fix(" in m or m.startswith("fix"):
        return "修复"
    if "feat(" in m or m.startswith("feat"):
        return "新增"
    if "pipeline:" in m or "chore(" in m or m.startswith("chore"):
        return "流程"
    if "docs(" in m or "readme" in m:
        return "文档"
    if "ui(" in m or "style(" in m:
        return "界面"
    return "进展"


def summarize_commits(commit_lines, limit=4):
    out = []
    for raw in commit_lines[:limit]:
        parts = raw.split(" ", 1)
        if len(parts) == 2:
            sha, msg = parts
        else:
            sha, msg = raw[:8], raw
        out.append((sha[:8], classify_commit(msg), msg))
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
    report.append("今日进展")
    if today_summary:
        for sha, kind, msg in today_summary:
            report.append(f"- {kind}：{msg} ({sha})")
    else:
        report.append("- 今日暂无新的提交记录，开发面保持稳定推进。")

    report.append("")
    report.append("开发状态")
    report.append(f"- 主线分支：{branch}")
    report.append(f"- 今日提交数：{len(today)}")
    report.append(f"- {pipeline_state(status, latest)}")
    report.append(f"- {working_state(status)}")

    report.append("")
    report.append("最新提交")
    for sha, kind, msg in latest_summary:
        report.append(f"- {msg} ({sha})")

    report.append("")
    report.append("当前重点")
    if status:
        report.append("- 继续整理在制改动，推进核心功能与部署路径。")
        report.append("- 保持前后端与合约主线同步，减少集成阻塞。")
    else:
        report.append("- 继续推进下一阶段功能落地与验证。")
        report.append("- 保持交付节奏，逐步沉淀公开品牌资产。")

    report.append("")
    report.append("官方频道：@iondex888")
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
    report.append("本周进展")
    if summary:
        for sha, kind, msg in summary:
            report.append(f"- {kind}：{msg} ({sha})")
    else:
        report.append("- 本周暂无可提炼的公开开发更新。")

    report.append("")
    report.append("本周状态")
    report.append(f"- 近 7 天提交数：{len(weekly)}")
    report.append(f"- {working_state(status)}")
    report.append("- 开发主线仍围绕产品迭代、基础设施稳定和交付节奏推进。")

    report.append("")
    report.append("下周重点")
    report.append("- 持续推进核心功能落地与公开可见进展。")
    report.append("- 优化工程流程与对外交付质量。")
    report.append("- 强化 ION DEX 官方品牌窗口的持续输出。")

    report.append("")
    report.append("官方频道：@iondex888")
    return "\n".join(report)


def build_report():
    if MODE == "weekly":
        return build_weekly_report()
    return build_daily_report()


def send(text):
    if not BOT_TOKEN:
        raise SystemExit("Missing IONDEX_BOT_TOKEN")
    data = urllib.parse.urlencode({
        "chat_id": CHAT_ID,
        "text": text
    }).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", data=data)
    with urllib.request.urlopen(req, timeout=30) as r:
        print(r.read().decode())


if __name__ == '__main__':
    report = build_report()
    try:
        print(report.encode('utf-8', errors='ignore').decode('utf-8'))
    except Exception:
        pass
    send(report)
