#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convert_all_bgs.py —— 批量将解包后的千恋万花场景背景缩放转码为 960x540 (16:9 标准高清) PNG
支持从 assets/bg/bgimage 或 assets/image/bg 等源目录扫描，自动处理 WebP 伪 PNG 并高质量抗锯齿缩放
"""

import os
import sys
import glob
import subprocess
import argparse
import shutil

TARGET_W = 960
TARGET_H = 540

def find_ffmpeg():
    for p in ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']:
        if shutil.which(p):
            return p
    return 'ffmpeg'

FFMPEG = find_ffmpeg()

def convert_one_bg(src, dst):
    # 使用 ffmpeg lanczos 高画质缩放到 960x540
    cmd = [
        FFMPEG, "-v", "error", "-y", "-i", src,
        "-vf", f"scale={TARGET_W}:{TARGET_H}:flags=lanczos",
        dst
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0

def main():
    parser = argparse.ArgumentParser(description="Convert Senren Banka backgrounds to 960x540 PNG")
    parser.add_argument("--source", required=True, help="Directory containing raw backgrounds (e.g. assets_ready/bg/bgimage)")
    parser.add_argument("-o", "--output", default="./bg_hd", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    candidates = glob.glob(os.path.join(args.source, "**", "*.*"), recursive=True)
    candidates = [f for f in candidates if not os.path.basename(f).startswith("._") and f.lower().endswith(('.png', '.webp', '.jpg', '.tlg'))]

    print(f"[*] Found {len(candidates)} background candidate images in {args.source}.")
    done = 0
    for idx, fpath in enumerate(candidates):
        stem = os.path.splitext(os.path.basename(fpath))[0]
        out_name = f"{stem}.png"
        dst = os.path.join(args.output, out_name)
        if os.path.exists(dst) and os.path.getsize(dst) > 10000:
            done += 1
            continue
        if convert_one_bg(fpath, dst):
            os.chmod(dst, 0o644)
            done += 1
            if done % 20 == 0:
                print(f"    Converted {done}/{len(candidates)}...")

    print(f"[+] Successfully converted {done}/{len(candidates)} backgrounds into {args.output}")

if __name__ == '__main__':
    main()
