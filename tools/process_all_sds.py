#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_all_sds.py —— 汇集并处理《魔女的夜宴》全量 292 个 SD Q 版二头身图片
输出到 build_assets/sd/，统一命名为小写规范（例如 sd101a.png）
"""

import os
import sys
import glob
import subprocess
import shutil

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SD_OUT = os.path.join(PROJECT_DIR, "build_assets", "sd")
SRC_DIR_1 = "/Volumes/500GB/魔女的夜宴/cg/evimage/sd"
SRC_DIR_2 = "/Volumes/500GB/魔女的夜宴/other"

os.makedirs(SD_OUT, exist_ok=True)

def find_sd_source():
    mapping = {}
    # 优先从 cg/evimage/sd
    if os.path.exists(SRC_DIR_1):
        for f in os.listdir(SRC_DIR_1):
            if f.lower().startswith("sd") and f.lower().endswith(".png"):
                stem = f.lower().replace(".png", "")
                mapping[stem] = os.path.join(SRC_DIR_1, f)
    # 补充从 other
    if os.path.exists(SRC_DIR_2):
        for f in os.listdir(SRC_DIR_2):
            if f.lower().startswith("sd") and f.lower().endswith(".png"):
                stem = f.lower().replace(".png", "")
                if stem not in mapping:
                    mapping[stem] = os.path.join(SRC_DIR_2, f)
    return mapping

def convert_image(src, dst):
    # 用 sips 或 ffmpeg 进行高质量缩放 (780x440 contain)
    # 保持长宽比，最大宽780，最大高440
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-i", src,
        "-vf", "scale=780:440:force_original_aspect_ratio=decrease:flags=lanczos",
        "-pix_fmt", "rgba",
        "-compression_level", "6",
        dst
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0

def main():
    print("[*] 正在扫描所有 SD 原始素材...")
    mapping = find_sd_source()
    print(f"    共找到 {len(mapping)} 个 SD 候选图片。")

    count = 0
    for stem in sorted(mapping.keys()):
        src_path = mapping[stem]
        dst_path = os.path.join(SD_OUT, stem + ".png")
        if os.path.exists(dst_path) and os.path.getsize(dst_path) > 1000:
            count += 1
            continue
        if convert_image(src_path, dst_path):
            count += 1
            if count % 50 == 0 or count == len(mapping):
                print(f"    已处理 {count}/{len(mapping)} ...")
        else:
            print(f"[!] 转换失败: {src_path}")

    print(f"[+] SD 图片处理完成！共生成 {count} 张透明底高清小人素材至 {SD_OUT}")

if __name__ == '__main__':
    main()
