#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_all_voices.py —— 从 data.xp3 与 adult.xp3 中完整提取《魔女的夜宴》全量台词语音
"""

import os
import sys
import glob
import json
import re
import struct
import zlib
import time

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "app", "data")
VOICE_OUT = os.path.join(PROJECT_DIR, "build_assets", "voice")
RAW_DIR = "/Volumes/500GB/魔女的夜宴/sanoba_witch_raw"

os.makedirs(VOICE_OUT, exist_ok=True)

def collect_script_voices():
    """扫描所有剧本，收集所有引用的语音文件名（不含扩展名）"""
    needed = set()
    for f in glob.glob(os.path.join(DATA_DIR, "*.js")):
        bn = os.path.basename(f)
        if not (bn.startswith("chapter_") or bn.startswith("scn_") or bn.startswith("after_")):
            continue
        with open(f, "r", encoding="utf-8") as fp:
            c = fp.read()
        m = re.search(r"export\s+var\s+\w+\s*=\s*(\[[\s\S]*\]);?", c)
        if not m:
            continue
        try:
            data = json.loads(m.group(1))
        except Exception:
            continue
        for r in data:
            if isinstance(r, list) and len(r) > 3 and r[3]:
                needed.add(str(r[3]).strip().lower())
    return needed

def parse_xp3_index(xp3_path):
    """解析 XP3 索引，返回 dict: lower_basename -> (name, segments)"""
    file_map = {}
    with open(xp3_path, 'rb') as f:
        f.seek(11)
        idx_off = struct.unpack('<Q', f.read(8))[0]
        if idx_off == 0x17:
            f.seek(idx_off)
            tag = struct.unpack('<I', f.read(4))[0]
            if tag == 0x80:
                f.seek(idx_off + 9)
                idx_off = struct.unpack('<Q', f.read(8))[0]
        f.seek(idx_off)
        b = f.read(17)
        psize, usize = struct.unpack('<QQ', b[1:17])
        decomp = zlib.decompress(f.read(psize))
        pos = 0
        while pos < len(decomp):
            tag = decomp[pos:pos+4]
            sz = struct.unpack('<Q', decomp[pos+4:pos+12])[0]
            body = decomp[pos+12:pos+12+sz]
            pos += 12 + sz
            if tag == b'File':
                sub = 0
                name = None
                segments = []
                while sub < len(body):
                    stag = body[sub:sub+4]
                    ssz = struct.unpack('<Q', body[sub+4:sub+12])[0]
                    sbody = body[sub+12:sub+12+ssz]
                    sub += 12 + ssz
                    if stag == b'info':
                        nlen = struct.unpack('<H', sbody[20:22])[0]
                        name = sbody[22:22+nlen*2].decode('utf-16le', errors='replace')
                    elif stag == b'segm':
                        for i in range(len(sbody) // 28):
                            comp_flag, soff, susz, scsz = struct.unpack('<IQQQ', sbody[i*28:(i+1)*28])
                            segments.append((comp_flag, soff, susz, scsz))
                if name and segments:
                    clean_name = os.path.basename(name.replace("\\", "/"))
                    stem = os.path.splitext(clean_name)[0].lower()
                    file_map[stem] = (name, segments)
    return file_map

def extract_file(xp3_file_obj, segments, dst_path):
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with open(dst_path, 'wb') as out_f:
        for comp_flag, soff, susz, scsz in segments:
            xp3_file_obj.seek(soff)
            data = xp3_file_obj.read(scsz)
            if comp_flag & 7 == 1:
                data = zlib.decompress(data)
            out_f.write(data)

def main():
    print("[*] 正在扫描剧本中引用的所有语音...")
    script_voices = collect_script_voices()
    print(f"    共需要语音 {len(script_voices)} 句。")

    existing_voices = set(os.path.splitext(f)[0].lower() for f in os.listdir(VOICE_OUT) if not f.startswith('.'))
    needed_voices = script_voices - existing_voices
    print(f"    当前本地已存在 {len(existing_voices)} 句，尚缺 {len(needed_voices)} 句。")

    if not needed_voices:
        print("[+] 所有语音均已就绪，无需重复提取。")
        return

    xp3_files = [
        os.path.join(RAW_DIR, "data.xp3"),
        os.path.join(RAW_DIR, "adult.xp3")
    ]

    total_extracted = 0
    t0 = time.time()

    for xp3_path in xp3_files:
        if not os.path.exists(xp3_path):
            print(f"[!] 找不到文件: {xp3_path}")
            continue
        print(f"\n[*] 正在解析索引: {os.path.basename(xp3_path)}...")
        idx_map = parse_xp3_index(xp3_path)
        print(f"    索引条目数: {len(idx_map)}")

        match_stems = [s for s in needed_voices if s in idx_map]
        print(f"    可从该包提取: {len(match_stems)} 个语音")

        if not match_stems:
            continue

        extracted_this = 0
        with open(xp3_path, 'rb') as xp3_obj:
            for stem in match_stems:
                name, segments = idx_map[stem]
                # 获取原后缀（通常为 .opus）
                ext = os.path.splitext(name)[1].lower() or ".opus"
                dst = os.path.join(VOICE_OUT, stem + ext)
                extract_file(xp3_obj, segments, dst)
                needed_voices.remove(stem)
                extracted_this += 1
                total_extracted += 1
                if extracted_this % 500 == 0 or extracted_this == len(match_stems):
                    print(f"    已提取: {extracted_this}/{len(match_stems)} ...")

    print(f"\n[+] 提取完成！本次共提取 {total_extracted} 个语音文件，耗时 {time.time()-t0:.1f} 秒。")
    print(f"    剩余缺失语音数: {len(needed_voices)}")
    if needed_voices:
        print("    剩余缺失样本:", list(needed_voices)[:10])

if __name__ == '__main__':
    main()
