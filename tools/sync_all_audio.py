#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_all_audio.py —— 批量同步与格式化千恋万花全量语音、BGM与SE音效
支持从解包后的 audio/ 目录提取 26,278 条角色语音、30+ 首 BGM (opus/ogg) 与 768 个音效，并统一命名对齐
"""

import os
import sys
import glob
import shutil
import argparse

def copy_or_link_audio(src_dir, out_dir, extensions=('.ogg', '.opus', '.wav')):
    os.makedirs(out_dir, exist_ok=True)
    files = glob.glob(os.path.join(src_dir, "**", "*.*"), recursive=True)
    files = [f for f in files if not os.path.basename(f).startswith("._") and f.lower().endswith(extensions)]

    print(f"[*] Processing audio from {src_dir}: found {len(files)} files.")
    count = 0
    for fpath in files:
        fname = os.path.basename(fpath).lower()
        dst = os.path.join(out_dir, fname)
        if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(fpath):
            count += 1
            continue
        try:
            shutil.copy2(fpath, dst)
            os.chmod(dst, 0o644)
            count += 1
            if count % 2000 == 0:
                print(f"    Synced {count}/{len(files)} files...")
        except Exception as e:
            print(f"[!] Error copying {fpath}: {e}")

    print(f"[+] Successfully synced {count}/{len(files)} audio files to {out_dir}")
    return count

def main():
    parser = argparse.ArgumentParser(description="Synchronize all audio assets for Senren Banka")
    parser.add_argument("--source-root", required=True, help="Directory containing unpacked audio/ assets")
    parser.add_argument("-o", "--output-root", default="./build_assets", help="Target root directory")
    args = parser.parse_args()

    # 1. 语音同步 (voice)
    voice_src = os.path.join(args.source_root, "audio", "voice")
    if not os.path.exists(voice_src):
        voice_src = os.path.join(args.source_root, "voice")
    if os.path.exists(voice_src):
        copy_or_link_audio(voice_src, os.path.join(args.output_root, "voice"))
    else:
        print(f"[!] Voice directory not found in {args.source_root}")

    # 2. BGM 同步
    bgm_src = os.path.join(args.source_root, "audio", "bgm")
    if not os.path.exists(bgm_src):
        bgm_src = os.path.join(args.source_root, "bgm")
    if os.path.exists(bgm_src):
        copy_or_link_audio(bgm_src, os.path.join(args.output_root, "bgm"))
    else:
        print(f"[!] BGM directory not found in {args.source_root}")

    # 3. SE 音效同步
    se_src = os.path.join(args.source_root, "audio", "se")
    if not os.path.exists(se_src):
        se_src = os.path.join(args.source_root, "sound")
    if not os.path.exists(se_src):
        se_src = os.path.join(args.source_root, "se")
    if os.path.exists(se_src):
        copy_or_link_audio(se_src, os.path.join(args.output_root, "se"))
    else:
        print(f"[!] SE directory not found in {args.source_root}")

if __name__ == '__main__':
    main()
