#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generate_all_stand_sprites.py —— 批量生成魔女的夜宴 5 位女主角的全身立绘（780x440画布，专供立绘鉴赏模式使用）
"""
import os, sys, json, subprocess, shutil, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
OUT_DIR = os.path.join(PROJECT_DIR, "build_assets", "stand")
os.makedirs(OUT_DIR, exist_ok=True)

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = os.environ.get("PATH", "") + ":/opt/homebrew/bin:/usr/local/bin"

FG_ROOT = "/Volumes/500GB/魔女的夜宴/characters/fgimage"
DEVICE_DIR = "/userdisk/gal_data/sanoba_witch/stand"
SERIAL = os.environ.get("PEN_SERIAL", "9DA2200007506350")

CHARACTER_CONFIGS = [
    {
        "name": "宁宁",
        "aliases": ["宁宁", "寧々"],
        "folder": "１－寧々",
        "prefix": "寧々a_0_",
        "sinfo": "寧々a.sinfo",
        "txt0": "寧々a_0.txt",
        "dresses": {
            "制服": ["制服", "前髪"],
            "私服": ["私服", "前髪"],
            "魔女服": ["魔女服", "魔女服用前髪", "魔女服用補正"],
            "部屋着": ["部屋着", "前髪"],
            "裸": ["裸", "前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 700.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "巡",
        "aliases": ["巡", "めぐる"],
        "folder": "２－めぐる",
        "prefix": "めぐるa_0_",
        "sinfo": "めぐるa.sinfo",
        "txt0": "めぐるa_0.txt",
        "dresses": {
            "制服": ["制服", "前髪"],
            "私服": ["私服", "前髪"],
            "部屋着": ["部屋着", "前髪"],
            "コスプレ": ["ハロウィン服", "前髪"],
            "裸": ["裸", "前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 690.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "紬",
        "aliases": ["紬"],
        "folder": "３－紬",
        "prefix": "紬a_0_",
        "sinfo": "紬a.sinfo",
        "txt0": "紬a_0.txt",
        "dresses": {
            "制服": ["制服", "髪かぶせ"],
            "私服": ["私服", "髪かぶせ"],
            "魔女服": ["魔女服ハンマー無し", "髪かぶせ"],
            "コスプレ": ["ハロウィン", "髪かぶせ"],
            "裸": ["裸", "髪かぶせ"],
        },
        "crop": {"cropX": 450.0, "cropY": 750.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "憧子",
        "aliases": ["憧子"],
        "folder": "４－憧子",
        "prefix": "憧子a_0_",
        "sinfo": "憧子a.sinfo",
        "txt0": "憧子a_0.txt",
        "dresses": {
            "制服": ["制服", "前髪"],
            "私服": ["私服", "私服用前髪"],
            "デート服": ["デート服", "前髪"],
            "部屋着": ["部屋着", "前髪"],
            "裸": ["裸", "前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 750.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "和奏",
        "aliases": ["和奏"],
        "folder": "５－和奏",
        "prefix": "和奏a_0_",
        "sinfo": "和奏a.sinfo",
        "txt0": "和奏a_0.txt",
        "dresses": {
            "制服": ["制服", "裸・制服時髪"],
            "私服": ["私服", "私服用前髪"],
            "ウェイトレス": ["ウェイトレス", "ウェイトレス用前髪"],
            "裸": ["裸", "私服用前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 770.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "七绪",
        "aliases": ["七绪", "七緒"],
        "folder": "６－七緒",
        "prefix": "七緒a_0_",
        "sinfo": "七緒a.sinfo",
        "txt0": "七緒a_0.txt",
        "dresses": {
            "私服": ["私服エプロンなし", "髪かぶせ"],
            "マスター": ["私服エプロンあり", "髪かぶせ"],
            "裸": ["裸", "髪かぶせ"],
        },
        "crop": {"cropX": 450.0, "cropY": 820.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": ["05h", "09h"]
    },
    {
        "name": "佳苗",
        "aliases": ["佳苗"],
        "folder": "７－佳苗",
        "prefix": "佳苗a_0_",
        "sinfo": "佳苗a.sinfo",
        "txt0": "佳苗a_0.txt",
        "dresses": {
            "私服": ["私服", "前髪", "眼鏡"],
        },
        "crop": {"cropX": 450.0, "cropY": 810.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": []
    },
    {
        "name": "秀明",
        "aliases": ["秀明"],
        "folder": "８－秀明",
        "prefix": "秀明a_0_",
        "sinfo": "秀明a.sinfo",
        "txt0": "秀明a_0.txt",
        "dresses": {
            "制服": ["制服", "髪かぶせ"],
            "コスプレ": ["ハロウィン", "ハロウィン用アンクル", "髪かぶせ"],
        },
        "crop": {"cropX": 450.0, "cropY": 670.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": ["02h", "04h", "09h", "14h", "15h", "16h", "20h", "21h", "26h", "28h", "31h", "32h", "33h"]
    },
    {
        "name": "太一",
        "aliases": ["太一"],
        "folder": "９－太一",
        "prefix": "太一a_0_",
        "sinfo": "太一a.sinfo",
        "txt0": "太一a_0.txt",
        "dresses": {
            "私服": ["スーツ上着あり", "髪かぶせ"],
            "部屋着": ["スーツ上着なし", "髪かぶせ"],
        },
        "crop": {"cropX": 450.0, "cropY": 620.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": ["03h", "04h", "09h", "20h"]
    },
    {
        "name": "宽太",
        "aliases": ["宽太", "アカギ", "赤木"],
        "folder": "１０－アカギ",
        "prefix": "アカギa_0_",
        "sinfo": "アカギa.sinfo",
        "txt0": "アカギa_0.txt",
        "dresses": {
            "私服": ["私服", "前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 1240.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": ["04n", "08n", "12n", "25n", "26n", "29n", "30n", "31n", "32n"]
    },
    {
        "name": "越路",
        "aliases": ["越路"],
        "folder": "１１－越路",
        "prefix": "越路a_0_",
        "sinfo": "越路a.sinfo",
        "txt0": "越路a_0.txt",
        "dresses": {
            "制服": ["制服", "前髪"],
        },
        "crop": {"cropX": 450.0, "cropY": 920.0, "cropW": 950.0, "cropH": 1720.0},
        "extra_faces": ["05h", "06h", "07h", "08h", "09h", "12h", "13h", "15h", "16h", "17h", "18h", "20h", "23h", "26h", "28h", "29h", "31h"]
    }
]

def load_character_tables(cfg):
    char_folder = os.path.join(FG_ROOT, cfg["folder"])
    sinfo_path = os.path.join(char_folder, cfg["sinfo"])
    txt0_path = os.path.join(char_folder, cfg["txt0"])

    with open(sinfo_path, "rb") as f:
        sinfo_lines = f.read().decode("utf-16le", errors="ignore").splitlines()
    with open(txt0_path, "r", encoding="utf-8", errors="ignore") as f:
        txt0_lines = f.read().splitlines()

    layer_by_name = {}
    for line_idx, l in enumerate(txt0_lines[2:], start=2):
        p = l.split("\t")
        if len(p) >= 10:
            name = p[1]
            try:
                lid = int(float(p[9]))
                w = int(float(p[4]))
                h = int(float(p[5]))
                tlg_file = os.path.join(char_folder, f"{cfg['prefix']}{lid}.tlg")
                if w > 0 and h > 0 and os.path.exists(tlg_file):
                    if name not in layer_by_name:
                        layer_by_name[name] = {
                            "id": lid,
                            "file": tlg_file,
                            "x": int(float(p[2])),
                            "y": int(float(p[3])),
                            "w": w,
                            "h": h,
                            "name": name,
                            "line": line_idx
                        }
            except (ValueError, IndexError):
                pass

    faces_raw = {}
    for l in sinfo_lines:
        p = l.split("\t")
        if len(p) >= 4 and p[0] == "face":
            code = p[1]
            layer_raw_path = p[3]
            base_name = layer_raw_path.split("/")[-1]
            faces_raw.setdefault(code, []).append((layer_raw_path, base_name))

    resolved_faces = {}
    for code, items in faces_raw.items():
        base_num_str = code.rstrip("h").rstrip("m").rstrip("n").rstrip("d").rstrip("r")
        is_standard = False
        if base_num_str.isdigit() and 1 <= int(base_num_str) <= 20:
            if not any(code.endswith(sfx) for sfx in ["m", "n", "d", "r"]):
                is_standard = True
        if code in cfg["extra_faces"]:
            is_standard = True

        if not is_standard:
            continue

        layers = []
        for raw, bname in items:
            if bname in layer_by_name:
                layers.append(layer_by_name[bname])
            elif raw in layer_by_name:
                layers.append(layer_by_name[raw])

        if layers:
            resolved_faces[code] = layers

    return layer_by_name, resolved_faces

def build_specs():
    specs = []
    alias_map = {}

    for cfg in CHARACTER_CONFIGS:
        char_name = cfg["name"]
        aliases = cfg["aliases"]
        layer_by_name, resolved_faces = load_character_tables(cfg)
        crop = cfg["crop"]

        for dress_name, dress_layer_names in cfg["dresses"].items():
            dress_layers = [layer_by_name[l_name] for l_name in dress_layer_names if l_name in layer_by_name]

            for face_code, face_layers in resolved_faces.items():
                all_layers_map = {}
                for l in dress_layers:
                    all_layers_map[l["id"]] = l
                for l in face_layers:
                    all_layers_map[l["id"]] = l

                sorted_layers = sorted(all_layers_map.values(), key=lambda l: l["line"], reverse=True)

                primary_filename = f"{char_name}_{dress_name}_{face_code}.png"
                primary_out = os.path.join(OUT_DIR, primary_filename)

                spec = {
                    "out": primary_out,
                    "cropX": crop["cropX"],
                    "cropY": crop["cropY"],
                    "cropW": crop["cropW"],
                    "cropH": crop["cropH"],
                    "layers": [
                        {
                            "file": l["file"],
                            "x": l["x"],
                            "y": l["y"],
                            "w": l["w"],
                            "h": l["h"]
                        } for l in sorted_layers
                    ]
                }
                specs.append(spec)

                other_aliases = [a for a in aliases if a != char_name]
                if other_aliases:
                    alias_files = []
                    for a in other_aliases:
                        alias_filename = f"{a}_{dress_name}_{face_code}.png"
                        alias_files.append(os.path.join(OUT_DIR, alias_filename))
                    alias_map[primary_out] = alias_files

    return specs, alias_map

def main():
    parser = argparse.ArgumentParser(description="魔女的夜宴全角色全身立绘合成与导出（专供立绘鉴赏模式）")
    parser.add_argument("--push", action="store_true", default=True, help="是否使用 adb 推送到设备")
    parser.add_argument("--no-push", dest="push", action="store_false", help="仅本地生成，不推送到设备")
    args = parser.parse_args()

    print("=== 开始构建角色全身立绘规格表 ===")
    specs, alias_map = build_specs()
    print(f"总计规划生成全身主立绘: {len(specs)} 张")

    spec_file = "/tmp/sanoba_stand_specs.json"
    with open(spec_file, "w", encoding="utf-8") as f:
        json.dump(specs, f)

    bin_path = os.path.join(HERE, "composite_bin")
    if not os.path.exists(bin_path):
        senren_bin = os.path.join(PROJECT_DIR, "..", "Ydpen", "senren-banka-ydpen-port", "tools", "composite_bin")
        if os.path.exists(senren_bin):
            shutil.copyfile(senren_bin, bin_path)
            os.chmod(bin_path, 0o755)

    print("调用 Swift 多核合成引擎执行全身画布输出...")
    ret = subprocess.run([bin_path, spec_file], capture_output=True, text=True)
    if ret.returncode != 0:
        print("Swift 合成引擎执行出错:", ret.stderr)
        sys.exit(1)
    print(ret.stdout.strip())

    alias_count = 0
    for primary_out, alias_paths in alias_map.items():
        if os.path.exists(primary_out):
            for dst in alias_paths:
                shutil.copyfile(primary_out, dst)
                alias_count += 1
    print(f"完成别名文件同步: {alias_count} 张（宁宁/巡中日双向名称映射）")

    total_local = len([f for f in os.listdir(OUT_DIR) if f.endswith(".png")])
    print(f"本地全身立绘输出完成: {OUT_DIR}，共计 {total_local} 张 PNG 文件")

    if args.push:
        print(f"\n=== 开始通过 ADB 推送全身立绘至词典笔设备 ({SERIAL}) ===")
        subprocess.run(["adb", "-s", SERIAL, "shell", f"mkdir -p {DEVICE_DIR} && chmod 777 {DEVICE_DIR}"], check=True)
        print(f"批量推送本地 {OUT_DIR}/ 至设备 {DEVICE_DIR}/ ...")
        batch_push = subprocess.run(["adb", "-s", SERIAL, "push", OUT_DIR + "/.", DEVICE_DIR + "/"], capture_output=True, text=True)
        if batch_push.returncode != 0:
            print("ADB 推送失败:", batch_push.stderr)
            sys.exit(1)
        print("ADB 批量推送完成！")

        dev_check = subprocess.run(["adb", "-s", SERIAL, "shell", f"ls -1 {DEVICE_DIR} | wc -l"], capture_output=True, text=True)
        dev_count = dev_check.stdout.strip()
        print(f"设备端 {DEVICE_DIR} 当前全身立绘文件总数: {dev_count}")

if __name__ == "__main__":
    main()
