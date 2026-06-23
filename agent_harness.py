#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ION-DEX 生产级合约审计器 — 后端防错核心
集成到 CI/CD 流水线中，发现漏洞立即阻断构建。
"""

import sys
import argparse
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


class IONContractAuditor:
    """ION DEX 合约安全审计引擎"""

    # 高危模式：任何合约代码中出现以下模式，立即阻断
    CRITICAL_PATTERNS = [
        "exec(",
        "eval(",
        "unsafe_op",
    ]

    # 审查模式：FunC/TVM 低层原语，必须标记供人工/CI 审查，但不能无条件阻断所有出站消息合约
    REVIEW_PATTERNS = [
        "send_raw_message",
        "raw_reserve",
    ]

    # 警告模式：需标记但不阻断
    WARNING_PATTERNS = [
        "now()",           # 时间戳可被矿工操控
        "block_lt(",       # 区块哈希不可靠
        "rand(",           # 链上随机数不安全
    ]

    def __init__(self, contracts_dir: str = "./contracts"):
        self.contracts_dir = Path(contracts_dir)

    def check_security_vulnerabilities(self) -> bool:
        """扫描合约常见漏洞模式"""
        if not self.contracts_dir.exists():
            print(f"[INFO] 合约目录 {self.contracts_dir} 不存在，跳过合约审计")
            return True

        fc_files = list(self.contracts_dir.glob("*.fc")) + list(self.contracts_dir.glob("*.func"))
        if not fc_files:
            print(f"[INFO] 未找到 FunC 合约文件，跳过合约审计")
            return True

        has_critical = False
        for file in fc_files:
            content = file.read_text(encoding='utf-8')
            lines = content.split('\n')

            # 检查高危模式
            for pattern in self.CRITICAL_PATTERNS:
                for lineno, line in enumerate(lines, 1):
                    if pattern in line:
                        print(f"[SECURITY ALERT] {file}:{lineno} 包含禁止模式: {pattern}")
                        print(f"  → {line.strip()[:120]}")
                        has_critical = True

            # 检查低层原语审查模式
            for pattern in self.REVIEW_PATTERNS:
                for lineno, line in enumerate(lines, 1):
                    if pattern in line:
                        print(f"[SECURITY REVIEW] {file}:{lineno} 包含需审查原语: {pattern}")
                        print(f"  → {line.strip()[:120]}")

            # 检查警告模式
            for pattern in self.WARNING_PATTERNS:
                for lineno, line in enumerate(lines, 1):
                    if pattern in line:
                        print(f"[SECURITY WARN] {file}:{lineno} 包含需审查模式: {pattern}")
                        print(f"  → {line.strip()[:120]}")

        if has_critical:
            print("\n[SECURITY FAILED] 发现高危安全漏洞，禁止构建！")
            return False

        return True

    def check_gas_limits(self) -> bool:
        """检查合约是否包含 gas 边界处理"""
        if not self.contracts_dir.exists():
            return True

        fc_files = list(self.contracts_dir.glob("*.fc")) + list(self.contracts_dir.glob("*.func"))
        if not fc_files:
            return True

        for file in fc_files:
            content = file.read_text(encoding='utf-8')
            if 'throw_if' not in content and 'require(' not in content:
                print(f"[GAS WARN] {file} 未检测到 gas 边界检查 (throw_if/require)")
                # 不阻断，仅警告

        return True

    def run(self, mode: str) -> int:
        """执行审计，返回 exit code"""
        if mode == "audit":
            print("[Audit] 开始合约安全审计...")
            security_ok = self.check_security_vulnerabilities()
            self.check_gas_limits()

            if not security_ok:
                return 1

            print("[AUDIT PASSED] 合约安全审计通过 [OK]")
            return 0

        print(f"[ERROR] 未知模式: {mode}")
        return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ION DEX 合约审计器")
    parser.add_argument("--audit", action="store_true", help="运行安全审计")
    parser.add_argument("--contracts", default="./contracts", help="合约目录路径")
    args = parser.parse_args()

    auditor = IONContractAuditor(contracts_dir=args.contracts)

    if args.audit:
        sys.exit(auditor.run("audit"))
    else:
        print("用法: python3 agent_harness.py --audit")
        sys.exit(0)
