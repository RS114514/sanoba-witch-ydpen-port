import os, json, subprocess

DECOMP_DIR = "/tmp/audit_all_cgs/ev115a"
with open(os.path.join(DECOMP_DIR, "ev115a.json")) as f:
    meta = json.load(f)
with open(os.path.join(DECOMP_DIR, "ev115a.resx.json")) as f:
    resx = json.load(f)["Resources"]

# 找出所有的全屏 base layer (width=1920, height=1080)
base_layers = [l for l in meta["layers"] if l["width"] >= 1920 and l["height"] >= 1080 and l.get("diff_id", 0) == 0]
# 按 layer_id 排序
base_layers.sort(key=lambda l: l["layer_id"])

print("Base layers in ev115a:")
for l in base_layers:
    lid = l["layer_id"]
    r = meta.get(f"{lid}.tlg", "").replace("#resource#", "")
    bin_rel = resx.get(r)
    print(f"  Layer {l['name']} (id={lid}): bin={bin_rel}")

# 第一个是未射出 base (BG)，第二个是射出后 base (EG)
l_clean = base_layers[0] # 未射出
l_climax = base_layers[-1] # 射出后

r_clean = meta.get(f"{l_clean['layer_id']}.tlg", "").replace("#resource#", "")
bin_clean = os.path.join(DECOMP_DIR, resx.get(r_clean))

r_climax = meta.get(f"{l_climax['layer_id']}.tlg", "").replace("#resource#", "")
bin_climax = os.path.join(DECOMP_DIR, resx.get(r_climax))

# 导出 clean (944x532)
subprocess.run(["ffmpeg", "-y", "-i", bin_clean, "-vf", "scale=944:532", "/tmp/ev115_clean_944.png"], check=True)
# 导出 climax (944x532)
subprocess.run(["ffmpeg", "-y", "-i", bin_climax, "-vf", "scale=944:532", "/tmp/ev115_climax_944.png"], check=True)

print("成功生成: /tmp/ev115_clean_944.png 与 /tmp/ev115_climax_944.png")
