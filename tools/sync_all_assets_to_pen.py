#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_all_assets_to_pen.py —— 《魔女的夜宴》全量游戏素材（立绘/SD小人/语音/背景/音乐）一键同步到词典笔
"""

import os
import sys
import subprocess
import time
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
ASSETS_DIR = os.path.join(PROJECT_DIR, "build_assets")
DEVICE_ROOT = "/userdisk/gal_data/sanoba_witch"

CATEGORIES = [
    ("sys", "系统UI素材"),
    ("se", "音效SE"),
    ("sd", "Q版二头身素材 (292张)"),
    ("fg", "全角色差分立绘 (含6位配角)"),
    ("stand", "全身立绘"),
    ("bg", "场景背景"),
    ("cg", "全量CG与事件图"),
    ("bgm", "BGM音乐"),
    ("voice", "角色语音 (全量2.3万句)"),
]

def run_adb(cmd, serial=None):
    full = ["adb"]
    if serial:
        full += ["-s", serial]
    full += cmd
    p = subprocess.run(full, capture_output=True, text=True)
    return p.returncode, (p.stdout or "") + (p.stderr or "")

def main():
    parser = argparse.ArgumentParser(description="一键同步所有素材到词典笔")
    parser.add_argument("--serial", default=os.environ.get("PEN_SERIAL"), help="adb 设备序列号")
    parser.add_argument("--only", choices=[c[0] for c in CATEGORIES], help="仅同步特定分类")
    args = parser.parse_args()

    # 检查 adb 设备
    ret, out = run_adb(["devices"])
    lines = [l for l in out.strip().splitlines()[1:] if "\tdevice" in l]
    if not lines:
        print("[x] 未检测到连接的词典笔设备。请插好数据线并确认已开启 adb。")
        sys.exit(1)

    serial = args.serial or lines[0].split("\t")[0]
    print(f"[*] 目标设备: {serial}")
    print(f"[*] 远端数据根目录: {DEVICE_ROOT}")

    # 确保远端根目录存在
    run_adb(["shell", f"mkdir -p {DEVICE_ROOT}"], serial)

    cats = CATEGORIES
    if args.only:
        cats = [c for c in CATEGORIES if c[0] == args.only]

    for cat_name, desc in cats:
        local_path = os.path.join(ASSETS_DIR, cat_name)
        if not os.path.exists(local_path):
            print(f"[-] 跳过 {cat_name} ({desc})：本地目录不存在")
            continue

        file_count = len([f for f in os.listdir(local_path) if not f.startswith(".")])
        print(f"\n[+] 正在推送 {cat_name} ({desc}) —— 共 {file_count} 个文件...")
        t0 = time.time()
        run_adb(["shell", f"mkdir -p {DEVICE_ROOT}/{cat_name}"], serial)
        ret, out = run_adb(["push", local_path + "/.", f"{DEVICE_ROOT}/{cat_name}/"], serial)
        if ret == 0:
            print(f"    完成！耗时 {time.time()-t0:.1f} 秒。")
        else:
            print(f"    [!] 推送出现警告或错误:\n{out[:500]}")

    print("\n[✔] 全量资源同步完毕！可在词典笔上顺畅体验《魔女的夜宴》！")

if __name__ == '__main__':
    main()
