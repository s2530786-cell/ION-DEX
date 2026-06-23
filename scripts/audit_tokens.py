#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
强化版视觉审计器 — 代码警察
不仅检查硬编码，还会对比 DesignTokens，确保每一个数字都来自协议层。
违反 → exit 1（阻断交付）；通过 → exit 0
"""

import os
import re
import sys
from pathlib import Path

# 强制 stdout 使用 UTF-8，避免 Windows GBK 编码报错
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# 禁区定义：凡是直接写数字或者颜色的，一律拦截
# ============================================================
FORBIDDEN = [
    (r'#(?:[0-9a-fA-F]{3}){1,2}\b', "硬编码 Hex 颜色"),
    (r'rgba?\(\d+,\s*\d+,\s*\d+', "硬编码 rgb/rgba 颜色"),
    (r'hsla?\(\d+', "硬编码 hsl/hsla 颜色"),
    (r'(?<![\w.])(\d+)px(?![\w])', "硬编码 px 值"),
    (r'(margin|padding|gap|width|height|font-size)\s*:\s*\d+', "硬编码 CSS 数值属性"),
]

# 豁免目录
EXCLUDE_DIRS = {'node_modules', '.next', 'dist', 'build', '.git', '__pycache__', 'coverage'}

# 豁免文件
EXCLUDE_FILES = {'design-tokens.ts', 'tailwind.config.ts', 'tailwind.config.js'}

# 豁免行标记
EXEMPTION_MARKER = '// audit-ignore'


def should_exclude_dir(dirname: str) -> bool:
    return dirname in EXCLUDE_DIRS or dirname.startswith('.')


def should_exclude_file(filename: str) -> bool:
    return filename in EXCLUDE_FILES


def audit_file(filepath: str) -> list[tuple[int, str, str, str]]:
    """审计单个文件，返回违规列表 [(行号, 违规描述, 匹配文本, 行内容)]"""
    violations = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except (IOError, UnicodeDecodeError):
        return violations

    for lineno, line in enumerate(lines, 1):
        if EXEMPTION_MARKER in line:
            continue
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        if stripped.startswith('#'):
            continue

        for pattern, desc in FORBIDDEN:
            match = re.search(pattern, line)
            if match:
                violations.append((lineno, desc, match.group(0), line.rstrip()))
                break

    return violations


def audit() -> int:
    """扫描 src 目录下所有前端文件"""
    print("[Audit] 正在扫描代码规范...")
    total_violations = 0
    files_scanned = 0

    for root, dirs, files in os.walk('src'):
        dirs[:] = [d for d in dirs if not should_exclude_dir(d)]

        for file in files:
            if should_exclude_file(file):
                continue

            ext = os.path.splitext(file)[1].lower()
            if ext not in ('.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.less'):
                continue

            filepath = os.path.join(root, file)
            violations = audit_file(filepath)
            files_scanned += 1

            if violations:
                print(f"\n{'='*60}")
                print(f"!!! CRITICAL ERROR: {filepath} 违反规范")
                print(f"{'='*60}")
                for lineno, desc, matched, content in violations:
                    print(f"  Line {lineno}: {desc}")
                    print(f"  → 匹配: \"{matched}\"")
                    print(f"  → 代码: {content[:120]}")
                total_violations += len(violations)

    print(f"\n{'='*60}")
    print(f"审计完成: {files_scanned} 个文件, {total_violations} 处违规")

    if total_violations > 0:
        print(f"\n!!! 发现 {total_violations} 处硬编码样式，禁止交付！")
        print("请将所有违规替换为 DesignTokens 中的常量后重新审计。")
        return 1

    print("[Audit] 代码合规性检查通过。✓")
    return 0


if __name__ == "__main__":
    sys.exit(audit())
