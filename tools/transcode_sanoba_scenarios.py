#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""transcode_sanoba_scenarios.py —— 《魔女的夜宴》全量 62 剧本转码与引擎数据契约生成工具

将 500GB 硬盘中反编译的 62 个全量剧本转码为 RibbonEngine 规范的 10 列台词契约：
- app/data/story_data.js
- app/data/flowchart_data.js
- app/data/gallery_data.js
"""

import os
import sys
import json
import re
import glob

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "app", "data")
SCN_JSON_DIR = os.path.join(PROJECT_DIR, "scenario_json")
ASSETS_DIR = "/Volumes/500GB/sanoba_witch_assets"

os.makedirs(DATA_DIR, exist_ok=True)

SPEAKER_MAP = {
    '柊史': '柊史',
    '保科柊史': '柊史',
    '寧々': '宁宁',
    '绫地宁宁': '宁宁',
    '綾地寧々': '宁宁',
    'めぐる': '巡',
    '因幡めぐる': '巡',
    '因幡巡': '巡',
    '紬': '紬',
    '椎名紬': '紬',
    '憧子': '憧子',
    '戸隠憧子': '憧子',
    '户隐憧子': '憧子',
    '和奏': '和奏',
    '仮屋和奏': '和奏',
    '假屋和奏': '和奏',
    '秀明': '秀明',
    '保科秀明': '秀明',
    '太一': '太一',
    '久保太一': '太一',
    'アカギ': '宽太',
    '赤木寛太': '宽太',
    '赤木宽太': '宽太',
    '越路': '越路',
    '越路美穂': '越路',
    '越路美穗': '越路',
    '七緒': '七绪',
    '佳苗': '佳苗',
    '女子クラスメイト': '女同学',
    '男子クラスメイト': '男同学',
    '女子生徒': '女学生',
    '男子生徒': '男学生',
    '女生': '女同学',
    '男生': '男同学',
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

def clean_text(txt):
    if not txt:
        return ""
    txt = txt.replace("\r\n", "\n").replace("\r", "\n")
    # 清理多余控制字符
    txt = re.sub(r"\\n", "\n", txt)
    txt = re.sub(r"\\k\[\d+\]", "", txt)
    return txt.strip()

def categorize_files(file_list):
    """将 62 个剧本分类到路线"""
    groups = {
        "main": [],
        "nene": [],
        "meguru": [],
        "tsumugi": [],
        "touko": [],
        "wakana": [],
        "after_nene": [],
        "after_meguru": [],
        "after_touko": []
    }
    
    for fname in sorted(file_list):
        if not fname.endswith(".ks.json") or fname.startswith("."):
            continue
        base = os.path.basename(fname)
        m = re.match(r"^(\d+)", base)
        num_str = m.group(1) if m else ""
        num = int(num_str) if num_str.isdigit() else 999

        if num < 20:
            groups["main"].append(fname)
        elif num == 20:
            if "寧々" in base:
                groups["nene"].append(fname)
            elif "憧子" in base:
                groups["touko"].append(fname)
            else:
                groups["main"].append(fname)
        elif 100 <= num <= 116:
            groups["nene"].append(fname)
        elif num == 117:
            groups["after_nene"].append(fname)
        elif 200 <= num <= 218:
            groups["meguru"].append(fname)
        elif num == 219:
            groups["after_meguru"].append(fname)
        elif 300 <= num <= 399:
            groups["tsumugi"].append(fname)
        elif 400 <= num <= 411:
            groups["touko"].append(fname)
        elif num == 412:
            groups["after_touko"].append(fname)
        elif 500 <= num <= 599:
            groups["wakana"].append(fname)
        else:
            groups["main"].append(fname)

    return groups

def parse_scenario_file(filepath, start_line_id, route_key):
    """解析单个剧本 JSON，返回台词数组、选择支数组、章节字典"""
    with open(filepath, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    lines_out = []
    choices_out = []
    chapters_out = {}
    
    line_id = start_line_id
    current_bg = None
    current_bgm = None

    scenes = data.get("scenes", [])
    for sc in scenes:
        title_list = sc.get("title", [])
        chapter_title = "共通"
        if isinstance(title_list, list) and len(title_list) > 1 and title_list[1]:
            chapter_title = str(title_list[1]).strip()
        elif sc.get("label"):
            chapter_title = str(sc.get("label")).lstrip("*")

        # 检查是否是章节入口
        if chapter_title not in chapters_out:
            chapters_out[chapter_title] = line_id

        # 检查选择支
        selects = sc.get("selects")
        if selects and isinstance(selects, list) and len(selects) > 0:
            choice_opts = []
            for s_idx, sel in enumerate(selects):
                opt_text = sel.get("text", f"选项 {s_idx + 1}")
                lang_info = sel.get("language")
                if isinstance(lang_info, list) and len(lang_info) > 1:
                    cn_obj = lang_info[1]
                    if isinstance(cn_obj, dict) and cn_obj.get("text"):
                        opt_text = cn_obj.get("text")
                choice_opts.append({
                    "index": s_idx + 1,
                    "text": opt_text,
                    "targetNode": sel.get("target", ""),
                    "exp": sel.get("exp", "")
                })
            choices_out.append({
                "id": sc.get("label", f"choice_{line_id}"),
                "route": route_key,
                "targetLine": line_id,
                "options": choice_opts
            })

        texts = sc.get("texts") or []
        for t in texts:
            sp_raw = t[0]
            entries = t[1] or []
            voice_entries = t[2] or []
            env = t[4] if len(t) > 4 and isinstance(t[4], dict) else {}

            sp_cn = None
            text_cn = ""
            if len(entries) > 1 and isinstance(entries[1], list) and len(entries[1]) > 1:
                sp_cn = entries[1][0]
                text_cn = entries[1][1]
            elif len(entries) > 0 and isinstance(entries[0], list) and len(entries[0]) > 1:
                sp_cn = entries[0][0]
                text_cn = entries[0][1]

            speaker = clean_speaker(sp_raw, sp_cn)
            text_clean = clean_text(text_cn)
            if not text_clean:
                continue

            voice = None
            if voice_entries and isinstance(voice_entries, list) and len(voice_entries) > 0:
                v_obj = voice_entries[0]
                if isinstance(v_obj, dict):
                    voice = v_obj.get("voice")

            char_obj = None
            sd_obj = None
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
                elif tag == "ev" and info.get("showmode") != 0:
                    ev_file = info.get("redraw", {}).get("imageFile", {}).get("file")
                    if ev_file:
                        if "sd" in ev_file:
                            sd_obj = ev_file
                        else:
                            current_bg = ev_file

            line_entry = [
                line_id,
                speaker,
                text_clean,
                voice,
                current_bg,
                current_bgm,
                char_obj,
                chapter_title,
                sd_obj,
                None # fx
            ]
            lines_out.append(line_entry)
            line_id += 1

    return lines_out, choices_out, chapters_out, line_id

def transcode_all():
    print("[*] Loading scenario files from:", SCN_JSON_DIR)
    all_files = [os.path.join(SCN_JSON_DIR, f) for f in os.listdir(SCN_JSON_DIR) if f.endswith(".ks.json") and not f.startswith(".")]
    groups = categorize_files(all_files)

    for k, v in groups.items():
        print(f"    - {k}: {len(v)} files")

    story_obj = {
        "main": [],
        "routes": {
            "nene": [],
            "meguru": [],
            "tsumugi": [],
            "touko": [],
            "wakana": []
        },
        "after": {
            "nene": [],
            "meguru": [],
            "touko": []
        },
        "afterMeta": [
            {
                "key": "nene",
                "name": "绫地 宁宁",
                "chapter": "AFTER NENE",
                "title": "魔女的秘密心事",
                "voice": "nen117_001",
                "cover": "ev101a"
            },
            {
                "key": "meguru",
                "name": "因幡 巡",
                "chapter": "AFTER MEGURU",
                "title": "两人的游戏时光",
                "voice": "meg219_001",
                "cover": "ev201a"
            },
            {
                "key": "touko",
                "name": "户隐 憧子",
                "chapter": "AFTER TOUKO",
                "title": "学姐的专属告白",
                "voice": "tou412_001",
                "cover": "ev401a"
            }
        ],
        "choices": [],
        "fx": {},
        "meta": {
            "gameId": "sanoba_witch",
            "titleBgm": "bgm01"
        }
    }

    flowchart_nodes = []
    flowchart_chain = {}
    chapter_starts = {}

    # 1. 转换共通线
    main_line_id = 0
    for f in groups["main"]:
        lines, choices, chapters, main_line_id = parse_scenario_file(f, main_line_id, "main")
        story_obj["main"].extend(lines)
        story_obj["choices"].extend(choices)
        chapter_starts.update(chapters)

    # 2. 转换各个人线
    route_keys = ["nene", "meguru", "tsumugi", "touko", "wakana"]
    for rk in route_keys:
        r_line_id = 0
        for f in groups[rk]:
            lines, choices, chapters, r_line_id = parse_scenario_file(f, r_line_id, rk)
            story_obj["routes"][rk].extend(lines)
            story_obj["choices"].extend(choices)
            for c_title, l_num in chapters.items():
                chapter_starts[f"{rk}_{c_title}"] = l_num

    # 3. 转换后日谈
    after_mapping = [
        ("after_nene", "nene"),
        ("after_meguru", "meguru"),
        ("after_touko", "touko")
    ]
    for src_grp, target_key in after_mapping:
        a_line_id = 0
        for f in groups[src_grp]:
            lines, choices, chapters, a_line_id = parse_scenario_file(f, a_line_id, f"after_{target_key}")
            story_obj["after"][target_key].extend(lines)

    # 4. 生成流程图节点
    # 共通线初始节点
    flowchart_nodes.append({
        "id": "node_prologue",
        "type": "chapter",
        "route": "main",
        "chapter": "共通序章",
        "title": "不可思议的契机",
        "targetLine": 0,
        "next": "node_choice_005"
    })

    # 为每个收集到的选择支生成节点
    prev_node_id = "node_prologue"
    for idx, ch in enumerate(story_obj["choices"][:12]):
        c_node_id = f"node_choice_{idx+1}"
        flowchart_nodes.append({
            "id": c_node_id,
            "type": "select",
            "route": ch.get("route", "main"),
            "chapter": f"选择支 {idx+1}",
            "title": ch["options"][0]["text"] if ch["options"] else "决断",
            "targetLine": ch.get("targetLine", 0),
            "next": f"node_branch_{idx+1}"
        })
        flowchart_chain[prev_node_id] = c_node_id
        prev_node_id = c_node_id

    # 5. 生成个人线终点节点
    for rk, rname in [("nene", "宁宁线 真实"), ("meguru", "巡线 依偎"), ("tsumugi", "紬线 心意"), ("touko", "憧子线 誓言"), ("wakana", "和奏线 陪伴")]:
        end_node_id = f"node_end_{rk}"
        flowchart_nodes.append({
            "id": end_node_id,
            "type": "chapter",
            "route": rk,
            "chapter": "终章",
            "title": rname,
            "targetLine": len(story_obj["routes"][rk]) - 1 if story_obj["routes"][rk] else 0,
            "next": None
        })

    flowchart_obj = {
        "routes": ["main", "nene", "meguru", "tsumugi", "touko", "wakana"],
        "routeScenario": {
            "main": "main",
            "nene": "nene",
            "meguru": "meguru",
            "tsumugi": "tsumugi",
            "touko": "touko",
            "wakana": "wakana"
        },
        "chapterStart": chapter_starts,
        "routeArt": {
            "main": "空_青空",
            "nene": "ev101a",
            "meguru": "ev201a",
            "tsumugi": "ev301a",
            "touko": "ev401a",
            "wakana": "喫茶店_店内d"
        },
        "nodes": flowchart_nodes,
        "choices": story_obj["choices"],
        "chain": flowchart_chain
    }

    # 6. 生成画廊鉴赏数据 gallery_data.js
    # 扫描已有的 CG 与 BGM
    cg_files = []
    cg_dir = os.path.join(ASSETS_DIR, "cg", "evimage")
    if os.path.exists(cg_dir):
        for f in sorted(os.listdir(cg_dir)):
            if f.endswith((".png", ".webp", ".tlg", ".pimg")) and not f.startswith("."):
                stem = os.path.splitext(f)[0]
                cg_files.append(stem)

    bgm_files = []
    bgm_dir = os.path.join(ASSETS_DIR, "audio", "bgm", "bgm")
    if os.path.exists(bgm_dir):
        for f in sorted(os.listdir(bgm_dir)):
            if f.endswith((".opus", ".ogg", ".mp3", ".wav")) and not f.startswith("."):
                stem = os.path.splitext(f)[0]
                bgm_files.append(stem)

    cg_list = []
    for idx, c in enumerate(cg_files[:80]):
        group = "main"
        if "1" in c:
            group = "nene"
        elif "2" in c:
            group = "meguru"
        elif "3" in c:
            group = "tsumugi"
        elif "4" in c:
            group = "touko"
        elif "5" in c:
            group = "wakana"
        cg_list.append({
            "id": f"cg_{idx+1}",
            "code": f"CG{idx+1:02d}",
            "group": group,
            "role": group,
            "file": c,
            "unlocked": True
        })

    bgm_list = []
    for idx, b in enumerate(bgm_files[:35]):
        bgm_list.append({
            "id": b,
            "code": f"BGM{idx+1:02d}",
            "title": f"魔女曲目 {idx+1:02d} ({b})",
            "file": b
        })

    gallery_obj = {
        "cgGroups": [
            { "key": "main", "title": "共通记忆" },
            { "key": "nene", "title": "绫地 宁宁" },
            { "key": "meguru", "title": "因幡 巡" },
            { "key": "tsumugi", "title": "椎名 紬" },
            { "key": "touko", "title": "户隐 憧子" },
            { "key": "wakana", "title": "假屋 和奏" }
        ],
        "cg": cg_list,
        "sceneGroups": [
            { "key": "nene", "title": "宁宁线 回忆" },
            { "key": "meguru", "title": "巡线 回忆" },
            { "key": "tsumugi", "title": "紬线 回忆" },
            { "key": "touko", "title": "憧子线 回忆" },
            { "key": "wakana", "title": "和奏线 回忆" }
        ],
        "scenes": [
            {
                "id": "scene_nene_01",
                "title": "神社相遇",
                "group": "nene",
                "route": "nene",
                "cover": "ev101a",
                "variants": ["ev101a"]
            },
            {
                "id": "scene_nene_02",
                "title": "月下魔女的誓言",
                "group": "nene",
                "route": "nene",
                "cover": "ev102a",
                "variants": ["ev102a"]
            },
            {
                "id": "scene_meguru_01",
                "title": "秘密合影",
                "group": "meguru",
                "route": "meguru",
                "cover": "ev201a",
                "variants": ["ev201a"]
            },
            {
                "id": "scene_tsumugi_01",
                "title": "女仆的心意",
                "group": "tsumugi",
                "route": "tsumugi",
                "cover": "ev301a",
                "variants": ["ev301a"]
            },
            {
                "id": "scene_touko_01",
                "title": "憧憬的学姐",
                "group": "touko",
                "route": "touko",
                "cover": "ev401a",
                "variants": ["ev401a"]
            }
        ],
        "standChars": [
            { "key": "nene", "name": "绫地宁宁", "char": "宁宁", "dresses": ["制服", "私服", "魔女服", "裸"], "faces": 40 },
            { "key": "meguru", "name": "因幡巡", "char": "巡", "dresses": ["制服", "私服", "裸"], "faces": 35 },
            { "key": "tsumugi", "name": "椎名紬", "char": "紬", "dresses": ["制服", "女仆装", "裸"], "faces": 30 },
            { "key": "touko", "name": "户隐憧子", "char": "憧子", "dresses": ["制服", "私服", "裸"], "faces": 30 },
            { "key": "wakana", "name": "假屋和奏", "char": "和奏", "dresses": ["制服", "私服", "女仆装"], "faces": 25 }
        ],
        "bgm": bgm_list
    }

    # 7. 写入各数据文件
    story_path = os.path.join(DATA_DIR, "story_data.js")
    flowchart_path = os.path.join(DATA_DIR, "flowchart_data.js")
    gallery_path = os.path.join(DATA_DIR, "gallery_data.js")

    print("[*] Writing story_data.js...")
    with open(story_path, "w", encoding="utf-8") as fp:
        fp.write("// story_data.js —— 《魔女的夜宴》全量官方中文剧情数据\n")
        fp.write("export var STORY = ")
        json.dump(story_obj, fp, ensure_ascii=False)
        fp.write(";\n")

    print("[*] Writing flowchart_data.js...")
    with open(flowchart_path, "w", encoding="utf-8") as fp:
        fp.write("// flowchart_data.js —— 《魔女的夜宴》流程图拓扑与选择支\n")
        fp.write("export var FLOWCHART = ")
        json.dump(flowchart_obj, fp, ensure_ascii=False)
        fp.write(";\n")

    print("[*] Writing gallery_data.js...")
    with open(gallery_path, "w", encoding="utf-8") as fp:
        fp.write("// gallery_data.js —— 《魔女的夜宴》4-Tab 鉴赏数据（CG/回忆/立绘/音乐盒）\n")
        fp.write("export var GALLERY = ")
        json.dump(gallery_obj, fp, ensure_ascii=False)
        fp.write(";\n")

    print("[+] Successfully transcoded all scenarios:")
    print(f"    - Main lines: {len(story_obj['main'])}")
    for rk in route_keys:
        print(f"    - Route '{rk}': {len(story_obj['routes'][rk])} lines")
    for ak in ["nene", "meguru", "touko"]:
        print(f"    - After '{ak}': {len(story_obj['after'][ak])} lines")
    print(f"    - Choices: {len(story_obj['choices'])}")
    print(f"    - Flowchart nodes: {len(flowchart_nodes)}")
    print(f"    - Gallery CG items: {len(cg_list)}")
    print(f"    - Gallery BGM tracks: {len(bgm_list)}")

if __name__ == "__main__":
    transcode_all()
