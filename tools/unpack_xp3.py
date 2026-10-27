#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
unpack_xp3.py —— 纯 Python 实现的无加密 XP3 解包与资源自动归类工具
适用于原版《千恋＊万花》或解密后的 data.xp3 / adult.xp3
"""

import os
import sys
import struct
import zlib
import argparse


CATEGORIES = {
    "scenario": ["sysscn", ".scn", ".ks", ".txt", ".func"],
    "ui": ["uipsd", "image/sys", "thum", "uipsdinfo.tjs"],
    "bg": ["image/bg", "bgimage", "background"],
    "cg": ["evimage", "cg", "savethum"],
    "characters": ["fgimage", "stand", "face", "tachie"],
    "audio/voice": ["voice"],
    "audio/bgm": ["bgm", ".opus"],
    "audio/se": ["sound", "se"],
    "system": ["system", ".tjs", ".ini", ".asd", ".sli"],
}


def determine_category(name):
    low = name.lower().replace("\\", "/")
    if low.startswith("voice/"):
        return "audio/voice"
    if low.startswith("bgm/") or (low.endswith(".opus") and "bgm" in low):
        return "audio/bgm"
    if low.startswith("sound/") or low.startswith("se/"):
        return "audio/se"
    if low.startswith("uipsd/") or "image/sys" in low or low.startswith("thum/"):
        return "ui"
    if low.startswith("fgimage/"):
        return "characters"
    if low.startswith("evimage/") or "savethum_" in low:
        return "cg"
    if "bgimage/" in low or "/bg/" in low:
        return "bg"
    if low.endswith(".scn") or low.endswith(".ks") or low.startswith("sysscn/"):
        return "scenario"
    if low.startswith("system/") or low.endswith(".tjs") or low.endswith(".ini"):
        return "system"
    return "other"


def unpack_xp3(xp3_path, base_out):
    bname = os.path.basename(xp3_path)
    if not os.path.exists(xp3_path):
        print(f"[!] File not found: {xp3_path}")
        return False

    print(f"[*] Starting extraction for {bname} -> {base_out}...")
    try:
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
            htype = b[0]
            psize, usize = struct.unpack('<QQ', b[1:17])
            decomp = zlib.decompress(f.read(psize))
            pos = 0
            count = 0
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
                    if name:
                        rel_path = name.replace("\\", "/")
                        cat = determine_category(rel_path)
                        target_path = os.path.join(base_out, cat, rel_path)
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        with open(target_path, 'wb') as out_f:
                            for comp_flag, soff, susz, scsz in segments:
                                f.seek(soff)
                                chunk = f.read(scsz)
                                if comp_flag:
                                    out_f.write(zlib.decompress(chunk))
                                else:
                                    out_f.write(chunk)
                        count += 1
                        if count % 2000 == 0:
                            print(f"    [{bname}] Extracted {count} files...")
            print(f"[+] Finished {bname}: Total {count} files extracted.")
            return True
    except Exception as e:
        print(f"[X] Failed to unpack {bname}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Unpack non-encrypted XP3 archives for Senren Banka")
    parser.add_argument("xp3_files", nargs="+", help="Path to .xp3 archive(s)")
    parser.add_argument("-o", "--output", default="./extracted_assets", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    for xp3 in args.xp3_files:
        unpack_xp3(xp3, args.output)


if __name__ == '__main__':
    main()
