import os, glob, json, subprocess

tmp_base = "/tmp/audit_all_cgs"
out_dir = "/Volumes/500GB/sanoba-witch-ydpen-port/build_assets/cg"
os.makedirs(out_dir, exist_ok=True)

cgs = sorted([d for d in os.listdir(tmp_base) if d.startswith("ev")])

print(f"开始批量生成高精度多阶段 CG（区分未射出/射出后）...")

count_dual = 0
count_single = 0

for c in cgs:
    stem_prefix = c[:-1] if c.endswith("a") else c # 如 ev115
    jpath = os.path.join(tmp_base, c, c + ".json")
    rpath = os.path.join(tmp_base, c, c + ".resx.json")
    if not os.path.exists(jpath) or not os.path.exists(rpath): continue
    
    with open(jpath) as f:
        meta = json.load(f)
    with open(rpath) as f:
        resx = json.load(f)["Resources"]

    base_layers = [l for l in meta["layers"] if l["width"] >= 1920 and l["height"] >= 1080 and l.get("diff_id", 0) == 0]
    base_layers.sort(key=lambda l: l["layer_id"])

    if len(base_layers) >= 2:
        # 多阶段 CG: 初始态 (A) 与高潮态 (B)
        l_first = base_layers[0]
        l_last = base_layers[-1]

        r_first = meta.get(f"{l_first['layer_id']}.tlg", "").replace("#resource#", "")
        r_last = meta.get(f"{l_last['layer_id']}.tlg", "").replace("#resource#", "")

        bin_first = os.path.join(tmp_base, c, resx.get(r_first, ""))
        bin_last = os.path.join(tmp_base, c, resx.get(r_last, ""))

        out_a = os.path.join(out_dir, f"{stem_prefix}a.png")
        out_b = os.path.join(out_dir, f"{stem_prefix}b.png")

        if os.path.exists(bin_first):
            subprocess.run(["ffmpeg", "-y", "-i", bin_first, "-vf", "scale=944:532", out_a], capture_output=True)
        if os.path.exists(bin_last):
            subprocess.run(["ffmpeg", "-y", "-i", bin_last, "-vf", "scale=944:532", out_b], capture_output=True)

        count_dual += 1
        print(f"[双阶段] {c}: 初始态(未射出) -> {os.path.basename(out_a)} | 高潮态(射出后) -> {os.path.basename(out_b)}")
    elif len(base_layers) == 1:
        # 单一底图 CG
        l_single = base_layers[0]
        r_single = meta.get(f"{l_single['layer_id']}.tlg", "").replace("#resource#", "")
        bin_single = os.path.join(tmp_base, c, resx.get(r_single, ""))
        out_a = os.path.join(out_dir, f"{stem_prefix}a.png")
        if os.path.exists(bin_single):
            subprocess.run(["ffmpeg", "-y", "-i", bin_single, "-vf", "scale=944:532", out_a], capture_output=True)
        count_single += 1

print(f"\n全部处理完成！双阶段CG: {count_dual} 个, 单阶段CG: {count_single} 个")
