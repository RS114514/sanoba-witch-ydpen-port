#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import time
import os

SERIAL = "9DA2200007506350"
OUT_DIR = "/Volumes/500GB/sanoba-witch-ydpen-port/test_results/final_verification"
os.makedirs(OUT_DIR, exist_ok=True)

def adb(cmd):
    full = f"export PATH=\"/opt/homebrew/bin:$PATH\" && adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap(x, y):
    adb(f"shell 'miniapp_cli touch {x} {y} 0 && usleep 80000 && miniapp_cli touch {x} {y} 1'")
    time.sleep(1.0)

def cap(name):
    path = f"{OUT_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture /tmp/{name}.png'")
    adb(f"pull /tmp/{name}.png {path}")
    print(f"Captured: {path}")
    return path

print("=== 1. 主标题界面截屏 ===")
cap("01_title_screen")

print("=== 2. 点击主标题【流程图 CHART】(x=77, y=168) ===")
tap(77, 168)
time.sleep(1.5)
cap("02_flowchart_main_view")

print("=== 3. 在流程图中点击第一个选择支节点 (x=180, y=70) ===")
tap(180, 70)
time.sleep(2.0)
cap("03_choice_dialog_popped_up")

print("=== 4. 点击选项 2 进行高亮选中 (x=300, y=98) ===")
tap(300, 98)
time.sleep(1.0)
cap("04_option2_highlighted")

print("=== 5. 点击右侧【确定选择 CONFIRM】(x=650, y=122) ===")
tap(650, 122)
time.sleep(1.5)
cap("05_choice_confirmed_and_advanced")

print("=== 6. 点击快捷菜单 (x=756, y=190) ===")
tap(756, 190)
time.sleep(1.2)
cap("06_menu_modal_open")

print("=== 7. 点击菜单中的【流程图】(x=495, y=140) ===")
tap(495, 140)
time.sleep(1.5)
cap("07_flowchart_second_time")

print("=== 8. 第二次点击同一个选择支节点进行重选 (x=180, y=70) ===")
tap(180, 70)
time.sleep(2.0)
cap("08_choice_reappeared_for_reselection")

print("=== 9. 改选选项 1 (x=300, y=62) ===")
tap(300, 62)
time.sleep(1.0)
cap("09_option1_reselected_highlighted")

print("=== 10. 点击右侧【确定选择】提交改选 ===")
tap(650, 122)
time.sleep(1.5)
cap("10_reselection_confirmed")

print("All steps completed.")
