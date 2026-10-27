#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_assets.py —— 千恋万花移植版全量资产完整性审计与对账工具
"""

import os
import sys
import re
import json
import glob
import argparse

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(HERE)
DATA_DIR = os.path.join(PROJECT_ROOT, "app", "data")


def scan_script_dependencies():
    """扫描全部剧本中引用的所有资源 ID"""
    dependencies = {
        "bgs": set(),
        "cgs": set(),
        "sds": set(),
        "voices": set(),
        "bgms": set()
    }

    js_files = glob.glob(os.path.join(DATA_DIR, "*.js"))
    for fpath in js_files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. 匹配语音 (ogg / opus)
        voices = re.findall(r'\"([a-zA-Z0-9_]+\.(?:ogg|opus))\"', content)
        for v in voices:
            if v.startswith("bgm"):
                dependencies["bgms"].add(v)
            else:
                dependencies["voices"].add(v)

        # 2. 匹配 CG (ev...)
        cgs = re.findall(r'\"(ev\d+[a-z0-9_]*)\"', content)
        for c in cgs:
            # 基础归一化：如 ev101aa 归一到 ev101a
            dependencies["cgs"].add(c)

        # 3. 匹配 SD (SD...)
        sds = re.findall(r'\"(SD\d+[a-zA-Z0-9_]*)\"', content)
        dependencies["sds"].update([s.upper() for s in sds])

        # 4. 提取背景 (从数组行第 5 列匹配)
        bgs = re.findall(r'\[\s*\d+\s*,\s*\"[^\"]*\"\s*,\s*\"[^\"]*\"\s*,\s*(?:\"[^\"]*\"|null)\s*,\s*\"([^\"]+)\"', content)
        for b in bgs:
            if b and not b.startswith("画面_") and not b.startswith("ef_") and not b == "null":
                dependencies["bgs"].add(b)

    return dependencies


def find_dir(base, candidates):
    for c in candidates:
        p = os.path.join(base, c)
        if os.path.isdir(p):
            return p
    return os.path.join(base, candidates[0])


def verify_asset_directory(assets_root, deps):
    """核对资产目录是否存在全部必需素材"""
    report = {}
    all_passed = True

    # 1. 核对 CG
    cg_dir = find_dir(assets_root, ["cg", "cg_ext", "cg_png"])
    cg_files = set(f[:-4] for f in os.listdir(cg_dir) if f.endswith(".png")) if os.path.exists(cg_dir) else set()
    missing_cgs = []
    for c in sorted(list(deps["cgs"])):
        # 兼容严格匹配或 stem 匹配
        if c not in cg_files and (c[:6] not in cg_files and c[:5] + 'a' not in cg_files):
            missing_cgs.append(c)
    
    found_cg_count = len(deps["cgs"]) - len(missing_cgs)
    report["cg"] = {
        "required": len(deps["cgs"]),
        "found": found_cg_count,
        "missing": missing_cgs,
        "coverage": f"{(found_cg_count / len(deps['cgs']) * 100):.2f}%" if deps["cgs"] else "100%",
        "path": cg_dir
    }
    if missing_cgs: all_passed = False

    # 2. 核对 SD
    sd_dir = find_dir(assets_root, ["sd", "sd_png", "sd_device"])
    sd_files = set(f[:-4].upper() for f in os.listdir(sd_dir) if f.endswith(".png")) if os.path.exists(sd_dir) else set()
    missing_sds = sorted(list(deps["sds"] - sd_files))
    report["sd"] = {
        "required": len(deps["sds"]),
        "found": len(deps["sds"] & sd_files),
        "missing": missing_sds,
        "coverage": f"{(len(deps['sds'] & sd_files) / len(deps['sds']) * 100):.2f}%" if deps["sds"] else "100%",
        "path": sd_dir
    }
    if missing_sds: all_passed = False

    # 3. 核对 BG
    bg_dir = find_dir(assets_root, ["bg", "bg_hd", "bg_stage"])
    bg_files = set(f[:-4] for f in os.listdir(bg_dir) if f.endswith(".png")) if os.path.exists(bg_dir) else set()
    missing_bgs = sorted(list(deps["bgs"] - bg_files))
    report["bg"] = {
        "required": len(deps["bgs"]),
        "found": len(deps["bgs"] & bg_files),
        "missing": missing_bgs,
        "coverage": f"{(len(deps['bgs'] & bg_files) / len(deps['bgs']) * 100):.2f}%" if deps["bgs"] else "100%",
        "path": bg_dir
    }
    if missing_bgs: all_passed = False

    # 4. 核对 Voice
    voice_dir = find_dir(assets_root, ["voice", "voices", "audio/voice"])
    voice_files = set(os.listdir(voice_dir)) if os.path.exists(voice_dir) else set()
    missing_voices = sorted(list(deps["voices"] - voice_files))
    report["voice"] = {
        "required": len(deps["voices"]),
        "found": len(deps["voices"] & voice_files),
        "missing_count": len(missing_voices),
        "sample_missing": missing_voices[:10],
        "coverage": f"{(len(deps['voices'] & voice_files) / len(deps['voices']) * 100):.2f}%" if deps["voices"] else "100%",
        "path": voice_dir
    }
    if missing_voices: all_passed = False

    # 5. 核对 BGM
    bgm_dir = find_dir(assets_root, ["bgm", "audio/bgm"])
    bgm_files = set(os.listdir(bgm_dir)) if os.path.exists(bgm_dir) else set()
    missing_bgms = sorted(list(deps["bgms"] - bgm_files))
    report["bgm"] = {
        "required": len(deps["bgms"]),
        "found": len(deps["bgms"] & bgm_files),
        "missing": missing_bgms,
        "coverage": f"{(len(deps['bgms'] & bgm_files) / len(deps['bgms']) * 100):.2f}%" if deps["bgms"] else "100%",
        "path": bgm_dir
    }
    if missing_bgms: all_passed = False

    return all_passed, report


def main():
    parser = argparse.ArgumentParser(description="Audit completeness of extracted Senren Banka assets")
    parser.add_argument("--assets", default="/Volumes/500GB/qoder_cache/senren_banka", help="Path to assets root")
    args = parser.parse_args()

    print("=================================================================")
    print("   千恋万花移植版全量资产完整性审计 (Zero-Missing Audit)         ")
    print("=================================================================")

    deps = scan_script_dependencies()
    print(f"[*] 剧本全量依赖需求提取完毕：")
    print(f"    - 全屏 CG ID 数量:   {len(deps['cgs'])}")
    print(f"    - Q版 SD ID 数量:    {len(deps['sds'])}")
    print(f"    - 场景背景 ID 数量:  {len(deps['bgs'])}")
    print(f"    - 角色台词语音数量:  {len(deps['voices'])}")
    print(f"    - 背景音乐 BGM 数量: {len(deps['bgms'])}\n")

    passed, report = verify_asset_directory(args.assets, deps)

    print("=== 对账校验结果 ===")
    for cat, info in report.items():
        cov = info["coverage"]
        req = info["required"]
        found = info["found"]
        status_tag = "[PASS]" if found >= req else "[FAIL]"
        print(f"{status_tag} {cat.upper():6}: 需求 {req} | 实际就绪 {found} | 覆盖率 {cov} ({info['path']})")
        if "missing" in info and info["missing"]:
            print(f"       -> 缺失项: {info['missing'][:8]}")
        elif "missing_count" in info and info["missing_count"] > 0:
            print(f"       -> 缺失数: {info['missing_count']} (样例: {info['sample_missing'][:5]})")

    print("\n=================================================================")
    if passed:
        print("[+] 审计全面通过！100% 资产覆盖，无任何缺失，符合高品质交付标准！")
        return 0
    else:
        print("[!] 提示：检测到未就绪素材，请核对上述缺失项并在提取后重新运行本脚本。")
        return 1


if __name__ == '__main__':
    sys.exit(main())
