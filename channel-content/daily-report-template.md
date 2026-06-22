# 日报模板

```
ION DEX Development Update | {YYYY-MM-DD}

[中]
今日进展
- {分类}：{描述} ({commit_short})
- ...

开发状态
- 主线分支：{branch}
- 今日提交数：{count}
- {状态描述}
- {工作区状态}

当前重点
- {重点1}
- {重点2}

验证入口：https://github.com/s2530786-cell/ION-DEX

[EN]
Today's Progress
- {Category}: {Description} ({commit_short})
- ...

Dev Status
- Main branch: {branch}
- Today's commits: {count}
- {Status description}
- {Workspace status}

Current Focus
- {Focus 1}
- {Focus 2}

Verification: https://github.com/s2530786-cell/ION-DEX
@iondex888
```

### 使用说明

- 由 `../scripts/telegram_daily_report.py` 自动生成，21:00 发送
- commit 分类：新增 / 修复 / 流程 / 文档 / 界面 / 进展
- 若今日无提交 → "今日暂无公开提交，开发面保持推进"
