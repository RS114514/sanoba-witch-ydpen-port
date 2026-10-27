#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
decompile_scenarios.py —— 批量反编译 .scn (PSB) 剧本为 JSON 格式
使用 FreeMote / PsbDecompile.exe (运行于 Mono 环境)
"""

import os
import sys
import glob
import shutil
import subprocess
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
DEFAULT_SRC = os.path.join(PROJECT_DIR, "assets_ready", "scenario")
DEFAULT_OUT = os.path.join(PROJECT_DIR, "scenario_json")
DECOMPILER = os.path.join(HERE, "FreeMote", "PsbDecompile.exe")

def find_mono():
    for p in ['mono', '/opt/homebrew/bin/mono', '/usr/local/bin/mono', '/usr/bin/mono']:
        if shutil.which(p) or os.path.exists(p):
            return p
    return 'mono'

MONO = find_mono()

def decompile_all(src_dir, out_dir):
    if not os.path.exists(src_dir):
        print(f"[!] 源剧本目录不存在: {src_dir}")
        return False

    os.makedirs(out_dir, exist_ok=True)
    candidates = glob.glob(os.path.join(src_dir, "**", "*.scn"), recursive=True)
    candidates = [f for f in candidates if not os.path.basename(f).startswith("._")]

    print(f"[*] 发现 {len(candidates)} 个 .scn 剧本文件。")
    if not candidates:
        return False

    # 过滤出尚未反编译的文件
    to_decompile = []
    for fpath in candidates:
        stem = os.path.splitext(os.path.basename(fpath))[0]
        json_target = os.path.join(out_dir, f"{stem}.json")
        if not (os.path.exists(json_target) and os.path.getsize(json_target) > 1000):
            to_decompile.append(fpath)

    print(f"[*] 需要反编译的剧本数量: {len(to_decompile)} (已有 {len(candidates) - len(to_decompile)} 个)")
    if not to_decompile:
        print("[+] 所有剧本均已反编译完成。")
        return True

    batch_size = 20
    for i in range(0, len(to_decompile), batch_size):
        batch = to_decompile[i:i + batch_size]
        print(f"    -> 正在反编译批次 [{i+1}~{min(i+batch_size, len(to_decompile))}/{len(to_decompile)}] ...")
        cmd = [MONO, DECOMPILER, "-o", out_dir] + batch
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if res.returncode != 0:
                print(f"[!] 批次出现警告或错误: {res.stderr[:200]}")
        except subprocess.TimeoutExpired:
            print(f"[!] 批次反编译超时，继续后续批次。")

    out_jsons = glob.glob(os.path.join(out_dir, "*.ks.json"))
    print(f"[+] 剧本反编译结束，当前已生成 {len(out_jsons)} 份 JSON 剧本。")
    return len(out_jsons) > 0

def main():
    parser = argparse.ArgumentParser(description="Decompile .scn scripts to JSON")
    parser.add_argument("--src", default=DEFAULT_SRC, help="Source directory containing .scn files")
    parser.add_argument("-o", "--output", default=DEFAULT_OUT, help="Output directory for .json files")
    args = parser.parse_args()

    decompile_all(args.src, args.output)

if __name__ == '__main__':
    main()
