#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convert_all_sds.py —— 批量将解包后的 SD/Q版二头身素材转换为真 RGBA PNG
"""

import os
import sys
import glob
import json
import subprocess
import argparse
import unicodedata

MAX_SIDE = 944

def nfc(s):
    return unicodedata.normalize("NFC", s)

def convert_one_sd(src, dst):
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-i", src,
        "-vf", f"scale={MAX_SIDE}:{MAX_SIDE}:force_original_aspect_ratio=decrease:flags=lanczos",
        "-pix_fmt", "rgba",
        "-compression_level", "6",
        dst,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0

def main():
    parser = argparse.ArgumentParser(description="Convert SD/Chibi images to RGBA PNG")
    parser.add_argument("--source", required=True, help="Directory containing raw SD images (e.g. assets/cg/evimage/SD)")
    parser.add_argument("-o", "--output", default="./sd_png", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    files = glob.glob(os.path.join(args.source, "**", "*.*"), recursive=True)
    files = [f for f in files if not os.path.basename(f).startswith("._") and f.lower().endswith(('.png', '.webp', '.jpg'))]

    print(f"[*] Found {len(files)} SD candidate images.")
    done = 0
    for idx, fpath in enumerate(files):
        stem = os.path.splitext(os.path.basename(fpath))[0]
        # 归一化ID
        out_name = nfc(stem.upper()) + ".png"
        dst = os.path.join(args.output, out_name)
        if os.path.exists(dst) and os.path.getsize(dst) > 5000:
            done += 1
            continue
        if convert_one_sd(fpath, dst):
            os.chmod(dst, 0o644)
            done += 1
            if done % 50 == 0:
                print(f"    Converted {done}/{len(files)}...")

    print(f"[+] Successfully converted {done}/{len(files)} SD images into {args.output}")

if __name__ == '__main__':
    main()
