#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sync_sanoba_audio.py —— 《魔女的夜宴》全量语音与 BGM 媒体同步工具

使用零开销硬链接 (os.link) 瞬间将 2 万余条 .opus 语音与 186 首 BGM 整理并归类至 build_assets 规范媒体目录：
- build_assets/bgm/
- build_assets/voice/
- build_assets/se/
"""

import os
import sys
import shutil
import argparse

def link_or_copy(src_p, dst_p):
    if os.path.exists(dst_p):
        return
    try:
        os.link(src_p, dst_p)
    except OSError:
        shutil.copy2(src_p, dst_p)

def sync_sanoba_audio(src_root, out_root):
    os.makedirs(os.path.join(out_root, "bgm"), exist_ok=True)
    os.makedirs(os.path.join(out_root, "voice"), exist_ok=True)
    os.makedirs(os.path.join(out_root, "se"), exist_ok=True)

    # 1. 同步 BGM
    bgm_src = os.path.join(src_root, "audio", "bgm", "bgm")
    if not os.path.exists(bgm_src):
        bgm_src = os.path.join(src_root, "audio", "bgm")
    
    bgm_count = 0
    if os.path.exists(bgm_src):
        for f in os.listdir(bgm_src):
            if f.endswith((".opus", ".ogg", ".mp3", ".wav")) and not f.startswith("."):
                src_p = os.path.join(bgm_src, f)
                dst_p = os.path.join(out_root, "bgm", f)
                link_or_copy(src_p, dst_p)
                bgm_count += 1
        print(f"[+] Synced {bgm_count} BGM files to {out_root}/bgm", flush=True)
    else:
        print(f"[!] BGM source dir not found: {bgm_src}", flush=True)

    # 2. 同步语音与音效 (other 目录下)
    other_src = os.path.join(src_root, "other")
    voice_count = 0
    se_count = 0
    if os.path.exists(other_src):
        print(f"[*] Scanning {other_src} for voice & se files...", flush=True)
        for root, dirs, files in os.walk(other_src):
            for f in files:
                if f.startswith("."):
                    continue
                f_lower = f.lower()
                if f_lower.endswith((".opus", ".ogg", ".wav")):
                    src_p = os.path.join(root, f)
                    if "se" in f_lower or "sys" in f_lower:
                        dst_p = os.path.join(out_root, "se", f)
                        se_count += 1
                    else:
                        dst_p = os.path.join(out_root, "voice", f)
                        voice_count += 1
                    link_or_copy(src_p, dst_p)
                    if (voice_count + se_count) % 3000 == 0:
                        print(f"    Synced {voice_count + se_count} audio files...", flush=True)
        print(f"[+] Successfully linked/synced {voice_count} voice files and {se_count} se files to {out_root}", flush=True)
    else:
        print(f"[!] Other/voice directory not found: {other_src}", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync audio assets for Sanoba Witch")
    parser.add_argument("--source", default="/Volumes/500GB/sanoba_witch_assets", help="Source assets root")
    parser.add_argument("-o", "--output", default="/Volumes/500GB/sanoba-witch-ydpen-port/build_assets", help="Output root")
    args = parser.parse_args()

    sync_sanoba_audio(args.source, args.output)
