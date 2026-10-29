#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 《魔女的夜宴》Falcon / QuickJS miniapp 构建脚本

流程：
1) 校验 app/data 下由用户生成的数据模块是否存在；缺失时给出可读提示
2) 把 pages/*/*.css 转成 Styles.js，并校验 height <= 220px / width <= 800px
3) 源码扁平化与依赖改写
4) 通过词典笔上的 jsfmc 编译成 .js.bin
5) 随附 native/prebuilt/libjsapi_gal.so 打包 .amr
6) 可选 --install 安装到设备
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(HERE, "app")
DATA_DIR = os.path.join(APP_DIR, "data")
PACKER = os.path.join(HERE, "tools", "pack_amr.py")
NATIVE_SO = os.path.join(HERE, "native", "prebuilt", "libjsapi_gal.so")

DEFAULT_APPID = "8002026102400098"
DEFAULT_NAME = "魔女的夜宴"
DEFAULT_VERSION = "1.0.0"
PEN_LIB = os.environ.get("PEN_LIB", "/oem/YoudaoDictPen/output/libs:/usr/lib:/lib")
DEFAULT_JSFMC = os.environ.get("PEN_JSFMC", "/userdisk/skip_re/tools/jsfmc")
MAX_H, MAX_W = 220, 800
SERIAL = None

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = os.environ.get("PATH", "") + ":/opt/homebrew/bin:/usr/local/bin"

STYLE_PAGES = ("title", "game", "gallery", "flowchart", "afterstory")

MODULES = [
    ("media.js", ["Media.js"]),
    ("common.js", ["Common.js"]),
    ("storage.js", ["Storage.js"]),
    ("data/story_data.js", ["StoryData.js"]),
    ("data/flowchart_data.js", ["FlowchartData.js"]),
    ("data/choices_all.js", ["ChoicesAll.js"]),
    ("data/fx_events.js", ["FxEvents.js"]),
    ("data/gallery_cgs.js", ["GalleryCgs.js"]),
    ("data/gallery_scenes.js", ["GalleryScenes.js"]),
    ("data/gallery_data.js", ["GalleryData.js"]),
    ("data/chapter_all.js", ["ChapterAll.js"]),
    ("data/scn_nene.js", ["ScnNene.js"]),
    ("data/scn_nene_restart.js", ["ScnNeneRestart.js"]),
    ("data/scn_meguru.js", ["ScnMeguru.js"]),
    ("data/scn_tsumugi.js", ["ScnTsumugi.js"]),
    ("data/scn_touko.js", ["ScnTouko.js"]),
    ("data/scn_wakana.js", ["ScnWakana.js"]),
    ("data/after_nene.js", ["AfterNene.js"]),
    ("data/after_meguru.js", ["AfterMeguru.js"]),
    ("data/after_tsumugi.js", ["AfterTsumugi.js"]),
    ("data/after_touko.js", ["AfterTouko.js"]),
    ("data/after_wakana.js", ["AfterWakana.js"]),
    ("pages/title/title.js", ["TitleView.js"]),
    ("pages/game/game.js", ["GameView.js"]),
    ("pages/gallery/gallery.js", ["GalleryView.js"]),
    ("pages/flowchart/flowchart.js", ["FlowchartView.js"]),
    ("pages/afterstory/afterstory.js", ["AfterstoryView.js"]),
    ("root.js", ["Component.js"]),
    ("base-page.js", ["BasePage.js"]),
    ("page-entry.js", ["index.js", "shell.js"]),
    ("app.js", ["app.js"]),
]

IMPORT_MAP = {
    "../../media.js": "./Media.js",
    "./media.js": "./Media.js",
    "../../common.js": "./Common.js",
    "./common.js": "./Common.js",
    "../../storage.js": "./Storage.js",
    "./storage.js": "./Storage.js",
    "../../data/story_data.js": "./StoryData.js",
    "./data/story_data.js": "./StoryData.js",
    "../../data/flowchart_data.js": "./FlowchartData.js",
    "./data/flowchart_data.js": "./FlowchartData.js",
    "../../data/choices_all.js": "./ChoicesAll.js",
    "./data/choices_all.js": "./ChoicesAll.js",
    "../../data/fx_events.js": "./FxEvents.js",
    "./data/fx_events.js": "./FxEvents.js",
    "../../data/gallery_cgs.js": "./GalleryCgs.js",
    "./data/gallery_cgs.js": "./GalleryCgs.js",
    "../../data/gallery_scenes.js": "./GalleryScenes.js",
    "./data/gallery_scenes.js": "./GalleryScenes.js",
    "../../data/gallery_data.js": "./GalleryData.js",
    "./data/gallery_data.js": "./GalleryData.js",
    "../../data/chapter_all.js": "./ChapterAll.js",
    "./data/chapter_all.js": "./ChapterAll.js",
    "../../data/scn_nene.js": "./ScnNene.js",
    "./data/scn_nene.js": "./ScnNene.js",
    "../../data/scn_nene_restart.js": "./ScnNeneRestart.js",
    "./data/scn_nene_restart.js": "./ScnNeneRestart.js",
    "../../data/scn_meguru.js": "./ScnMeguru.js",
    "./data/scn_meguru.js": "./ScnMeguru.js",
    "../../data/scn_tsumugi.js": "./ScnTsumugi.js",
    "./data/scn_tsumugi.js": "./ScnTsumugi.js",
    "../../data/scn_touko.js": "./ScnTouko.js",
    "./data/scn_touko.js": "./ScnTouko.js",
    "../../data/scn_wakana.js": "./ScnWakana.js",
    "./data/scn_wakana.js": "./ScnWakana.js",
    "../../data/after_nene.js": "./AfterNene.js",
    "./data/after_nene.js": "./AfterNene.js",
    "../../data/after_meguru.js": "./AfterMeguru.js",
    "./data/after_meguru.js": "./AfterMeguru.js",
    "../../data/after_tsumugi.js": "./AfterTsumugi.js",
    "./data/after_tsumugi.js": "./AfterTsumugi.js",
    "../../data/after_touko.js": "./AfterTouko.js",
    "./data/after_touko.js": "./AfterTouko.js",
    "../../data/after_wakana.js": "./AfterWakana.js",
    "./data/after_wakana.js": "./AfterWakana.js",
    "./pages/title/title.js": "./TitleView.js",
    "./pages/game/game.js": "./GameView.js",
    "./pages/gallery/gallery.js": "./GalleryView.js",
    "./pages/flowchart/flowchart.js": "./FlowchartView.js",
    "./pages/afterstory/afterstory.js": "./AfterstoryView.js",
}

REQUIRED_DATA = (
    ("data/story_data.js", "export var STORY"),
    ("data/flowchart_data.js", "export var FLOWCHART"),
    ("data/gallery_data.js", "export var GALLERY"),
    ("data/chapter_all.js", "export var chapter_all"),
)


def die(message, code=1):
    print("[x] " + message)
    sys.exit(code)


def run(cmd, **kw):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore", **kw)
        return p.returncode, (p.stdout or "") + (p.stderr or "")
    except FileNotFoundError:
        return 127, "command not found: %s" % " ".join(cmd)


def adb(*args, timeout=180):
    cmd = ["adb"]
    if SERIAL:
        cmd += ["-s", SERIAL]
    cmd += list(args)
    return run(cmd, timeout=timeout)[1]


def list_adb_devices():
    ret, out = run(["adb", "devices"])
    if ret != 0:
        die("adb 不可用：\n%s" % out.strip())
    devices = []
    for line in out.splitlines()[1:]:
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "device":
            devices.append(parts[0])
    return devices


def resolve_serial(explicit=None):
    if explicit:
        return explicit
    env = os.environ.get("PEN_SERIAL")
    if env:
        return env
    devices = list_adb_devices()
    if len(devices) == 1:
        return devices[0]
    if not devices:
        die("没有检测到 adb 设备。请连接词典笔，或设置 PEN_SERIAL / --serial。")
    die("检测到多台 adb 设备：%s\n请用 PEN_SERIAL 或 --serial 指定一台。" % ", ".join(devices))


def check_inputs(icon_path, native_so):
    if not os.path.isdir(APP_DIR):
        die("app/ 目录不存在: %s" % APP_DIR)
    if not os.path.isfile(PACKER):
        die("缺少打包器: %s" % PACKER)
    if not os.path.isfile(icon_path):
        die("缺少应用图标: %s\n请放一张 128x128 ~ 256x256 PNG 图标。" % icon_path)
    if not os.path.isfile(native_so):
        die("缺少原生动态库: %s\n音频与混音依赖该动态库。" % native_so)

    for rel, marker in REQUIRED_DATA:
        p = os.path.join(APP_DIR, rel)
        if not os.path.isfile(p):
            die("缺少必要的数据文件: app/%s\n请先使用 tools/ 下的转码脚本生成剧本与数据。" % rel)
        head = open(p, "r", encoding="utf-8", errors="ignore").read(4096)
        if marker not in head:
            die("数据文件 app/%s 格式不符合预期（未找到 %r）" % (rel, marker))


def px(v):
    m = re.fullmatch(r"(-?\d+(?:\.\d+)?)px", v.strip())
    return float(m.group(1)) if m else None


def css_to_obj(path):
    with open(path, encoding="utf-8") as f:
        txt = re.sub(r"/\*.*?\*/", "", f.read(), flags=re.S)
    rules = {}
    cursor = 0
    pattern = re.compile(r"\s*((?:\.[\w-]+\s*,\s*)*\.[\w-]+)\s*\{([^{}]*)\}")
    while txt[cursor:].strip():
        match = pattern.match(txt, cursor)
        if not match:
            raise ValueError("%s: 无效 CSS 规则或括号，位置 %d" % (path, cursor))
        sel_group, body = match.groups()
        obj = {}
        for decl in body.split(";"):
            if not decl.strip():
                continue
            if ":" not in decl:
                raise ValueError("%s: 无效 CSS 声明 %r" % (path, decl))
            k, v = [part.strip() for part in decl.split(":", 1)]
            if k in ("border", "border-top", "border-right", "border-bottom", "border-left", "padding", "margin", "background", "font", "flex"):
                raise ValueError("%s: Falcon 不支持复合属性 %s，请拆分声明" % (path, k))
            if not k or not v:
                raise ValueError("%s: 空 CSS 属性或值" % path)
            k = re.sub(r"-([a-z])", lambda m: m.group(1).upper(), k)
            obj[k] = v
        for selector in sel_group.split(","):
            rules.setdefault(selector.strip()[1:], {}).update(obj)
        cursor = match.end()
    return rules


def build_styles(stage=None):
    print("[1/4] 编译与校验样式表 (pages/*/*.css -> Styles.js)")
    merged = {}
    for p in STYLE_PAGES:
        css = os.path.join(APP_DIR, "pages", p, "%s.css" % p)
        if not os.path.exists(css):
            continue
        rules = css_to_obj(css)
        for name, r in rules.items():
            h, w = px(r.get("height", "")), px(r.get("width", ""))
            if h is not None and h > MAX_H:
                die("CSS 校验失败：%s.%s height=%s 超出词典笔视口高度 %d" % (p, name, r["height"], MAX_H))
            if w is not None and w > MAX_W:
                die("CSS 校验失败：%s.%s width=%s 超出词典笔视口宽度 %d" % (p, name, r["width"], MAX_W))
        merged.update(rules)
    src = "// 由 build.py 从 CSS 生成，勿手改\nvar ST = %s;\nexport default ST;\nexport var STYLES = ST;\n" % json.dumps(merged, ensure_ascii=False, indent=1)
    if stage is not None:
        with open(os.path.join(stage, "Styles.js"), "w", encoding="utf-8", newline="\n") as f:
            f.write(src)
    print("      已合并 %d 个样式类，静态宽高声明全部 <= 800x220（仍需真机布局验收）" % len(merged))


def flatten(src):
    for a, b in IMPORT_MAP.items():
        src = src.replace("'%s'" % a, "'%s'" % b).replace('"%s"' % a, '"%s"' % b)
    return src.replace("\r\n", "\n")


def compile_all(stage, bins, jsfmc):
    print("[2/4] 用笔上 jsfmc 编译 .js.bin")
    adb("shell", "mkdir -p /userdisk/skip_re/tools /tmp/gal_b")
    mods = [("Styles.js", os.path.join(stage, "Styles.js"))]
    for srcrel, names in MODULES:
        path = os.path.join(APP_DIR, srcrel)
        if not os.path.isfile(path):
            die("缺少源文件: %s" % path)
        s = flatten(open(path, encoding="utf-8").read())
        for n in names:
            p = os.path.join(stage, "src_" + n)
            open(p, "w", encoding="utf-8", newline="\n").write(s)
            mods.append((n, p))
    for mod, local in mods:
        stem = mod[:-3]
        adb("push", local, "/tmp/gal_b/%s.js" % stem)
        out = adb("shell", "export LD_LIBRARY_PATH=%s; %s -o /tmp/gal_b/%s.bin -n %s /tmp/gal_b/%s.js" % (
            PEN_LIB, jsfmc, stem, mod, stem))
        line = [l for l in out.splitlines() if "源码)" in l]
        if not line:
            die("编译 %s 失败:\n%s" % (mod, out.strip()[:800]))
        dst = os.path.join(bins, mod + ".bin")
        adb("pull", "/tmp/gal_b/%s.bin" % stem, dst)
        print("      %-18s %s" % (mod, line[0].strip()))

    for n in ("index.js.bin", "shell.js.bin"):
        for sub in STYLE_PAGES:
            os.makedirs(os.path.join(bins, "pages", sub), exist_ok=True)
            shutil.copy(os.path.join(bins, n), os.path.join(bins, "pages", sub, n))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true", help="打包后安装并启动")
    ap.add_argument("--check", action="store_true", help="只校验数据/CSS/依赖，不连接设备")
    ap.add_argument("--serial", default=None, help="adb 设备序列号；也可用 PEN_SERIAL")
    ap.add_argument("--jsfmc", default=DEFAULT_JSFMC, help="设备上的 jsfmc 路径")
    ap.add_argument("--appid", default=DEFAULT_APPID)
    ap.add_argument("--name", default=DEFAULT_NAME)
    ap.add_argument("--version", default=DEFAULT_VERSION)
    ap.add_argument("--icon", default=os.path.join(APP_DIR, "app_icon.png"))
    ap.add_argument("--native", default=NATIVE_SO)
    args = ap.parse_args()

    icon_path = os.path.abspath(args.icon)
    native_so = os.path.abspath(args.native)
    check_inputs(icon_path, native_so)
    for relative, _ in MODULES:
        if not os.path.isfile(os.path.join(APP_DIR, relative)):
            die("缺少源文件: app/%s" % relative)

    if args.check:
        build_styles()
        print("[ok] 数据模块、CSS、图标、原生插件、打包器均就绪。")
        print("     --check 不修改构建目录、不连接设备；实际构建需要 adb 与设备上的 jsfmc。")
        return

    build = os.path.join(HERE, "build")
    stage, bins = os.path.join(build, "stage"), os.path.join(build, "bins")
    for d in (stage, bins):
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d, exist_ok=True)

    build_styles(stage)

    global SERIAL
    SERIAL = resolve_serial(args.serial)
    compile_all(stage, bins, args.jsfmc)

    print("[3/4] 组装 .amr 目录")
    amr_dir = os.path.join(build, "amr")
    shutil.rmtree(amr_dir, ignore_errors=True)
    shutil.copytree(bins, amr_dir)

    for f in ("manifest.json", "app.json", "app_icon.png"):
        src = os.path.join(APP_DIR, f)
        if os.path.exists(src):
            shutil.copy(src, amr_dir)

    for page in STYLE_PAGES:
        src_json = os.path.join(APP_DIR, "pages", page, "%s.json" % page)
        dst_dir = os.path.join(amr_dir, "pages", page)
        os.makedirs(dst_dir, exist_ok=True)
        if os.path.exists(src_json):
            shutil.copy(src_json, dst_dir)

    for sub in ("arm64", "arm64-orange"):
        d = os.path.join(amr_dir, "libs", sub)
        os.makedirs(d, exist_ok=True)
        shutil.copy(native_so, d)

    print("[4/4] 打包 .amr")
    dist = os.path.join(HERE, "dist")
    os.makedirs(dist, exist_ok=True)
    amr_path = os.path.join(dist, "sanoba_witch-%s.amr" % args.version)

    ret, out = run([
        sys.executable, PACKER,
        "--src", bins,
        "--out", amr_path,
        "--appid", args.appid,
        "--name", args.name,
        "--version", args.version,
        "--icon", icon_path,
        "--lib", "arm64=" + native_so,
        "--lib", "arm64-orange=" + native_so,
    ])
    if ret != 0:
        die("pack_amr.py 失败:\n%s" % out)
    sz = os.path.getsize(amr_path)
    print("      已生成 %s (%.1f KB)" % (amr_path, sz / 1024))
    print("      注意：.amr 只含代码/图标/原生插件，不含游戏资源。")

    if args.install:
        print("[+] 安装到词典笔 (appid=%s)" % args.appid)
        adb("push", amr_path, "/tmp/sanoba_witch.amr")
        adb("push", amr_path, "/userdisk/skip_re/amr/sanoba_witch-%s.amr" % args.version)
        adb("shell", "miniapp_cli uninstall %s >/dev/null 2>&1" % args.appid)
        time.sleep(1)
        res_inst = adb("shell", "miniapp_cli install /tmp/sanoba_witch.amr")
        print("      " + res_inst.strip())
        time.sleep(1)
        print("[+] 启动《魔女的夜宴》...")
        out_start = adb("shell", "miniapp_cli start %s" % args.appid)
        print("      " + out_start.strip())


if __name__ == "__main__":
    main()
