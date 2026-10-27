#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证从《魔女的夜宴》JSON 剧本中提取台词契约的样板测试脚本"""

import os
import json

SCN_PATH = "/Volumes/500GB/sanoba-witch-ydpen-port/scenario_json/001.共通－オナニーマスター.ks.json"

SPEAKER_MAP = {
    '柊史': '柊史',
    '寧々': '宁宁',
    'めぐる': '巡',
    '紬': '紬',
    '憧子': '憧子',
    '和奏': '和奏',
    '秀明': '秀明',
    '太一': '太一',
    'アカギ': '宽太',
    '越路': '越路',
    '七緒': '七绪',
    '佳苗': '佳苗',
    '女子クラスメイト': '女同学',
    '男子クラスメイト': '男同学',
    '女子生徒': '女学生',
    '男子生徒': '男学生',
    '先生': '老师'
}

def clean_speaker(sp_raw, sp_cn):
    if sp_cn:
        sp_cn = sp_cn.strip()
        return SPEAKER_MAP.get(sp_cn, sp_cn)
    if sp_raw:
        sp_raw = sp_raw.strip()
        return SPEAKER_MAP.get(sp_raw, sp_raw)
    return ""

def test_extract():
    with open(SCN_PATH, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    current_bg = None
    current_bgm = None
    lines_out = []
    line_id = 0

    for sc_idx, sc in enumerate(data.get("scenes", [])):
        title_list = sc.get("title", [])
        chapter_title = title_list[1] if isinstance(title_list, list) and len(title_list) > 1 else "共通"
        
        texts = sc.get("texts") or []
        for t in texts:
            sp_raw = t[0]
            entries = t[1] or []
            voice_entries = t[2] or []
            env = t[4] if len(t) > 4 and isinstance(t[4], dict) else {}

            # 简中对白与说话人
            sp_cn = None
            text_cn = ""
            if len(entries) > 1 and isinstance(entries[1], list) and len(entries[1]) > 1:
                sp_cn = entries[1][0]
                text_cn = entries[1][1]
            elif len(entries) > 0 and isinstance(entries[0], list) and len(entries[0]) > 1:
                sp_cn = entries[0][0]
                text_cn = entries[0][1]

            speaker = clean_speaker(sp_raw, sp_cn)

            # 语音
            voice = None
            if voice_entries and isinstance(voice_entries, list) and len(voice_entries) > 0:
                v_obj = voice_entries[0]
                if isinstance(v_obj, dict):
                    voice = v_obj.get("voice")

            # 环境状态 (BG, BGM, Character)
            char_obj = None
            for d in env.get("data", []):
                if not isinstance(d, list) or len(d) < 3 or not isinstance(d[2], dict):
                    continue
                tag = d[0]
                info = d[2]
                if tag == "stage" or d[1] == "stage":
                    rf = info.get("redraw", {}).get("imageFile", {})
                    if rf.get("file"):
                        current_bg = rf.get("file")
                elif tag == "bgm" or d[1] == "bgm":
                    bf = info.get("replay", {}).get("filename")
                    if bf:
                        current_bgm = bf
                elif info.get("class") == "character" and info.get("showmode") != 0:
                    r = info.get("redraw", {})
                    img = r.get("imageFile", {})
                    c_name = info.get("name")
                    opts = img.get("options") or {}
                    char_obj = {
                        "char": SPEAKER_MAP.get(c_name, c_name),
                        "dress": opts.get("dress", ""),
                        "face": opts.get("face", ""),
                        "pose": opts.get("pose", "")
                    }

            line_entry = [
                line_id,
                speaker,
                text_cn,
                voice,
                current_bg,
                current_bgm,
                char_obj,
                chapter_title,
                None, # sd
                None  # fx
            ]
            lines_out.append(line_entry)
            line_id += 1

    print(f"Extracted {len(lines_out)} dialogue contract lines.")
    for i in range(min(8, len(lines_out))):
        print(f"Line {i}: {json.dumps(lines_out[i], ensure_ascii=False)}")

if __name__ == "__main__":
    test_extract()
