# Hermes Agent 定制改动存档

> 来源：hermes-agent 子仓库（上游 https://github.com/NousResearch/hermes-agent，记录 commit 2517917de）。
> 这些是我们对 Hermes（旺财军师/副手）的实质定制开发。因 hermes-agent/ 整目录将被 gitignore，在此存档避免丢失。

## 改动清单（811 行 patch）

### 核心改动
- **agent/codex_responses_adapter.py** | agent/codex_runtime.py | agent/transports/codex.py：Codex Responses API 适配
- **gateway/platforms/weixin.py**：微信长轮询超时调优（35s→25s）+ 指数退避（2/4/8/30s）+ PollHealthTracker 集成
- **gateway/platforms/wecom.py**：企业微信平台适配改进
- **gateway/platforms/yuanbao.py**：元宝平台集成
- **gateway/platforms/poll_health.py** (新增)：统一各平台健康监控（连续失败计数+指数退避+统一快照接口）
- **gateway/run.py** | gateway/status.py | hermes_cli/status.py：网关运行时监控改进
- **pyproject.toml**：依赖更新

### 测试覆盖
- tests/agent/transports/test_codex_transport.py
- tests/gateway/test_weixin.py | test_poll_health.py (新增)
- tests/run_agent/test_provider_parity.py | test_run_agent_codex_responses.py

## 如何应用回 hermes-agent

1. 重新 clone：git clone https://github.com/NousResearch/hermes-agent，checkout 2517917de
2. 应用改动：git apply hermes-modifications.patch
3. 拷贝新文件：new-files/ 下的 2 个文件复制回对应路径

_提取日期：2026-06-26。脱离了 hermes 依赖（wcferry 等），单独无法运行，仅作存档。_
