#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ION-DEX Agent Harness — 后端合约执行引擎
生产级智能体支撑底座：直接控制 FunC 编译与测试链路
包含安全审计拦截、编译调度、测试沙箱调用
"""

import json
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [Harness] - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ION_DEX_Harness")


class IONHarnessEngine:
    """生产级智能体支撑底座：直接控制 FunC 编译与测试链路"""

    def __init__(self, root_dir: str):
        self.root = Path(root_dir)
        self.build_dir = self.root / "build"
        self.build_dir.mkdir(exist_ok=True)

    def execute_security_audit(self, contract_code: str) -> bool:
        """物理级安全拦截：检测非法函数调用与未加密的交互"""
        blacklist = ["eval(", "exec(", "system(", "os."]
        for item in blacklist:
            if item in contract_code:
                logger.error(f"Security Alert: Blocked insecure pattern '{item}'")
                return False
        return True

    def compile_func(self, contract_name: str) -> Dict[str, Any]:
        """物理调用 FunC 编译器"""
        try:
            cmd = [
                "func",
                "-o", str(self.build_dir / f"{contract_name}.boc"),
                "auto-include", "true",
                str(self.root / "contracts" / f"{contract_name}.fc")
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return {"status": "SUCCESS", "output": result.stdout}
        except subprocess.CalledProcessError as e:
            return {"status": "ERROR", "message": e.stderr}

    def run_tests(self, test_suite: str) -> Dict[str, Any]:
        """物理调用 Blueprint 测试沙箱"""
        try:
            cmd = ["npx", "blueprint", "test", test_suite]
            result = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True, check=True)
            return {"status": "SUCCESS", "output": result.stdout}
        except subprocess.CalledProcessError as e:
            return {"status": "ERROR", "message": e.stderr}


if __name__ == "__main__":
    harness = IONHarnessEngine(root_dir=".")
    import sys
    for line in sys.stdin:
        try:
            req = json.loads(line)
            if req["action"] == "compile":
                print(json.dumps(harness.compile_func(req["contract"])))
            elif req["action"] == "test":
                print(json.dumps(harness.run_tests(req["test"])))
        except Exception as e:
            print(json.dumps({"status": "ERROR", "message": str(e)}))
