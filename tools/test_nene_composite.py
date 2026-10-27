#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试宁宁立绘合成脚本"""

import os
import sys
import subprocess
from PIL import Image

NENE_DIR = "/Volumes/500GB/sanoba_witch_assets/characters/fgimage/１－寧々"
TXT0_PATH = os.path.join(NENE_DIR, "寧々a_0.txt")
OUT_TEST = "/Volumes/500GB/sanoba-witch-ydpen-port/build_assets/fg/test_nene.png"

os.makedirs(os.path.dirname(OUT_TEST), exist_ok=True)

def test_composite():
    layers = []
    canvas_w, canvas_h = 1875, 2656
    with open(TXT0_PATH, "r", encoding="utf-8") as f:
        header1 = f.readline()
        header2 = f.readline().strip().split()
        if len(header2) >= 2:
            canvas_w, canvas_h = int(header2[0]), int(header2[1])
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) >= 10:
                name = parts[1]
                left = float(parts[2])
                top = float(parts[3])
                w = int(parts[4])
                h = int(parts[5])
                opacity = int(parts[7])
                visible = int(parts[8])
                layer_id = parts[9]
                layers.append({
                    "name": name,
                    "left": left,
                    "top": top,
                    "w": w,
                    "h": h,
                    "opacity": opacity,
                    "visible": visible,
                    "layer_id": layer_id
                })

    print(f"Loaded {len(layers)} layers, canvas size: {canvas_w}x{canvas_h}")

    # 寻找素体图层 (身体/制服)
    body_layers = [l for l in layers if "制服" in l["name"] or "素体" in l["name"] or "ベース" in l["name"]]
    print(f"Found {len(body_layers)} candidate body layers.")
    for b in body_layers[:5]:
        print("  ", b)

if __name__ == "__main__":
    test_composite()
