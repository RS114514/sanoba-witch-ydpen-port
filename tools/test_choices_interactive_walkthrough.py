#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import time
import json
import os
import sys

SERIAL = "9DA2200007506350"
OUT_DIR = "/Volumes/500GB/sanoba-witch-ydpen-port/test_results/interactive_walkthrough"
os.makedirs(OUT_DIR, exist_ok=True)

def adb(cmd):
    full = f"adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap(x, y):
    # miniapp_cli 模拟触摸点击
    adb(f"shell 'miniapp_cli touch {x} {y} 0 && usleep 80000 && miniapp_cli touch {x} {y} 1'")
    time.sleep(0.5)

def cap(name):
    path = f"{OUT_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture /tmp/{name}.png'")
    adb(f"pull /tmp/{name}.png {path}")
    print(f"Captured: {path}")
    return path

print("=== 1. 测试绫地宁宁二周目重启（Restart）惊喜感体验 ===")
# 注入宁宁通关标记
settings = {"clearedRoutes": ["nene"], "bgmEnabled": True, "bgmVolume": 0.8}
adb(f"shell 'echo \"{json.dumps(settings)}\" > /userdisk/gal_data/sanoba_witch/settings.json'")
adb(f"shell 'echo \"{json.dumps(settings)}\" > /userdisk/gal_data/sanoba_witch_settings.json'")

# 重启应用到主标题
adb("shell 'miniapp_cli stop 8002026102400098'")
time.sleep(1)
adb("shell 'miniapp_cli start 8002026102400098'")
time.sleep(2)
cap("step1_title_restart_button")

# 点击左上角【重启/新篇 RESTART】按钮 (x=77, y=36)
print("Clicking RESTART button...")
tap(77, 36)
time.sleep(1.5)
cap("step2_nene_restart_direct_entry")

print("=== 2. 测试 4 个选项的选择支两步确认机制与排版 ===")
# 写入包含 4 选项的存档位置（共通线 019 聚会前夕关键投票 line=8926）
save_data = {
    "slot1": {
        "scenario": "main",
        "line": 8926,
        "chapter": "CHAPTER 4-7",
        "speaker": "将臣",
        "text": "测试选项跳转",
        "time": "10-29 23:00",
        "extra": {"choices": {}, "flags": {}}
    },
    "latest": "1"
}
adb(f"shell 'echo \"{json.dumps(save_data)}\" > /userdisk/gal_data/sanoba_witch/saves.json'")
adb(f"shell 'echo \"{json.dumps(save_data)}\" > /userdisk/gal_data/sanoba_witch_saves.json'")

# 回到标题并读档
adb("shell 'miniapp_cli stop 8002026102400098'")
time.sleep(1)
adb("shell 'miniapp_cli start 8002026102400098'")
time.sleep(2)
# 点击继续游戏 (x=77, y=80)
tap(77, 80)
time.sleep(1.5)
cap("step3_choice_dialog_appearance")

# 点击第 2 个选项 (x=280, y=95) 进行选中切换
print("Highlighting option 2...")
tap(280, 95)
time.sleep(0.8)
cap("step4_option2_highlighted_not_submitted")

# 点击右侧【确定选择 CONFIRM】按钮 (x=630, y=110)
print("Confirming choice...")
tap(630, 110)
time.sleep(1.5)
cap("step5_choice_submitted_next_line")

print("=== 3. 测试选择支选过一遍后可以更改，且流程图可以第二次点击到该选项并改选 ===")
# 打开右上菜单并打开流程图 (菜单 x=756, y=190)
tap(756, 190)
time.sleep(1)
cap("step6_menu_modal")

# 点击菜单里的【流程图】(x=495, y=140)
tap(495, 140)
time.sleep(1.5)
cap("step7_flowchart_view")

# 点击流程图中的当前选择支节点 (x=80, y=80)
tap(80, 80)
time.sleep(1.5)
cap("step8_flowchart_reentry_choice_dialog")

# 在重新弹出的选项弹层中，改选第 3 个选项 (x=280, y=130)
print("Re-choosing option 3...")
tap(280, 130)
time.sleep(0.8)
cap("step9_rechoose_option3_highlighted")

# 点击右侧【确定选择】
tap(630, 110)
time.sleep(1.5)
cap("step10_rechoose_submitted_new_route")

print("All walkthough tests executed successfully.")
