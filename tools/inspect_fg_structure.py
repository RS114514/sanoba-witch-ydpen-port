#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查各角色目录及 txt 定义文件"""

import os

FG_BASE = "/Volumes/500GB/sanoba_witch_assets/characters/fgimage"

def inspect():
    if not os.path.exists(FG_BASE):
        print("FG_BASE does not exist")
        return
    
    subdirs = sorted([d for d in os.listdir(FG_BASE) if not d.startswith(".") and os.path.isdir(os.path.join(FG_BASE, d))])
    for d in subdirs:
        p = os.path.join(FG_BASE, d)
        files = [f for f in os.listdir(p) if not f.startswith(".")]
        txts = [f for f in files if f.endswith(".txt")]
        tlgs = [f for f in files if f.endswith(".tlg")]
        print(f"[{d}]: {len(files)} total files, {len(txts)} txt files: {txts}, {len(tlgs)} tlgs")

if __name__ == "__main__":
    inspect()
