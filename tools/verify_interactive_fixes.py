#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import time
import os

SERIAL = "9DA2200007506350"
OUT_DIR = "/Volumes/500GB/sanoba-witch-ydpen-port/test_results/interactive_verification"
os.makedirs(OUT_DIR, exist_ok=True)

def adb(cmd):
    full = f"export PATH=\"/opt/homebrew/bin:$PATH\" && adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap(x, y):
    adb(f"shell 'miniapp_cli touch {x} {y} 0 && usleep 80000 && miniapp_cli touch {x} {y} 1'")
    time.sleep(0.8)

def cap(name):
    path = f"{OUT_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture /tmp/{name}.png'")
    adb(f"pull /tmp/{name}.png {path}")
    print(f"Captured: {path}")
    return path

print("=== 1. 查看当前选择支界面（确定绝对定位与文字显示） ===")
cap("01_current_choice_panel")

print("=== 2. 点击右侧【确定选择】按钮（中心绝对坐标 x=650, y=122） ===")
tap(650, 122)
time.sleep(1.2)
cap("02_after_confirm_pushed")

print("=== 3. 呼出快捷菜单（x=756, y=190） ===")
tap(756, 190)
time.sleep(1.0)
cap("03_menu_opened")

print("=== 4. 点击菜单中的【流程图】（x=495, y=140） ===")
tap(495, 140)
time.sleep(1.5)
cap("04_flowchart_opened")

print("=== 5. 在流程图中点击当前选择支节点（x=88, y=60） ===")
tap(88, 60)
time.sleep(1.5)
cap("05_flowchart_reentry_choice_dialog")

print("=== 6. 点击第 2 个选项进行改选（x=280, y=100） ===")
tap(280, 100)
time.sleep(0.8)
cap("06_option2_reselected")

print("=== 7. 再次点击右侧【确定选择】（x=650, y=122） ===")
tap(650, 122)
time.sleep(1.2)
cap("07_after_reselect_confirmed")

print("Verification script finished.")
