#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convert_all_cgs.py —— 全量提取并转换千恋万花官方全屏 CG 为 16:9 (944x532) PNG
支持从解包出的 assets/cg/evimage、assets/other 或 steam unencrypted 目录批量处理
"""

import os
import sys
import glob
import json
import shutil
import subprocess
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
DECOMPILER = os.path.join(HERE, "FreeMote", "PsbDecompile.exe")
TLG2BMP = os.path.join(HERE, "tlg2bmp")

def find_binary(name, default_path):
    if shutil.which(name):
        return name
    if os.path.exists(default_path):
        return default_path
    for p in ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']:
        candidate = os.path.join(p, name)
        if os.path.exists(candidate):
            return candidate
    return name

MONO = find_binary('mono', '/opt/homebrew/bin/mono')
FFMPEG = find_binary('ffmpeg', '/opt/homebrew/bin/ffmpeg')


def convert_one_pimg(pimg_path, out_png, tmp_dir):
    stem = os.path.basename(pimg_path)[:-5]
    cur_tmp = os.path.join(tmp_dir, stem)
    shutil.rmtree(cur_tmp, ignore_errors=True)
    os.makedirs(cur_tmp, exist_ok=True)

    try:
        subprocess.run([MONO, DECOMPILER, '-raw', pimg_path, '-o', cur_tmp], capture_output=True, timeout=60)
        bins = glob.glob(os.path.join(cur_tmp, '**', '*.bin'), recursive=True)
        bins = [b for b in bins if not os.path.basename(b).startswith('._')]
        if not bins:
            return False, 'no_bin'

        bins.sort(key=os.path.getsize, reverse=True)
        base = bins[0]

        with open(base, 'rb') as f:
            head = f.read(16)

        if head.startswith(b'RIFF') and b'WEBP' in head:
            cmd = [FFMPEG, '-v', 'error', '-i', base, '-vf', 'scale=944:532', out_png, '-y']
            subprocess.run(cmd, capture_output=True, timeout=30)
        elif head.startswith(b'TLG'):
            tmp_bmp = os.path.join(cur_tmp, 'base.bmp')
            subprocess.run([TLG2BMP, base, tmp_bmp], capture_output=True, timeout=30)
            cmd = ['sips', '-s', 'format', 'png', '--resampleHeightWidth', '532', '944', tmp_bmp, '--out', out_png]
            subprocess.run(cmd, capture_output=True, timeout=30)
        else:
            cmd = [FFMPEG, '-v', 'error', '-i', base, '-vf', 'scale=944:532', out_png, '-y']
            subprocess.run(cmd, capture_output=True, timeout=30)

        if os.path.exists(out_png) and os.path.getsize(out_png) > 10000:
            os.chmod(out_png, 0o644)
            return True, 'ok'
        return False, 'convert_fail'
    except Exception as e:
        return False, str(e)
    finally:
        shutil.rmtree(cur_tmp, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Convert Senren Banka CGs (.pimg) to 944x532 PNG")
    parser.add_argument("--sources", nargs="+", required=True, help="Directories containing .pimg files")
    parser.add_argument("-o", "--output", default="./cg_png", help="Output directory for PNGs")
    parser.add_argument("--tmp", default="./tmp_cg_decomp", help="Temporary directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    os.makedirs(args.tmp, exist_ok=True)

    all_pimgs = {}
    for s in args.sources:
        if os.path.exists(s):
            for f in glob.glob(os.path.join(s, '**', '*.pimg'), recursive=True):
                fname = os.path.basename(f)
                if fname.startswith('._'):
                    continue
                stem = fname[:-5].replace('_censored', '').replace('_a', 'a')
                if stem not in all_pimgs:
                    all_pimgs[stem] = f

    print(f"[*] Found {len(all_pimgs)} unique CGs to convert.")
    success = 0
    for idx, (stem, pimg_path) in enumerate(sorted(all_pimgs.items())):
        out_png = os.path.join(args.output, f"{stem}.png")
        if os.path.exists(out_png) and os.path.getsize(out_png) > 20000:
            print(f"[{idx+1}/{len(all_pimgs)}] [EXISTS] {stem}.png")
            success += 1
            continue
        ok, reason = convert_one_pimg(pimg_path, out_png, args.tmp)
        if ok:
            print(f"[{idx+1}/{len(all_pimgs)}] [OK] {stem}.png ({os.path.getsize(out_png)} bytes)")
            success += 1
        else:
            print(f"[{idx+1}/{len(all_pimgs)}] [FAIL] {stem}.png -> {reason}")

    shutil.rmtree(args.tmp, ignore_errors=True)
    print(f"\n[+] Successfully converted {success}/{len(all_pimgs)} CGs into {args.output}")


if __name__ == '__main__':
    main()
