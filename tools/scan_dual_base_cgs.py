import os, glob, json, subprocess

tmp_base = "/tmp/audit_all_cgs"
cgs = sorted([d for d in os.listdir(tmp_base) if d.startswith("ev")])

dual_base_cgs = []

for c in cgs:
    jpath = os.path.join(tmp_base, c, c + ".json")
    rpath = os.path.join(tmp_base, c, c + ".resx.json")
    if not os.path.exists(jpath) or not os.path.exists(rpath): continue
    with open(jpath) as f:
        meta = json.load(f)
    with open(rpath) as f:
        resx = json.load(f)["Resources"]
    
    # 查找所有宽度>=1920，高度>=1080 且 diff_id==0 的图层
    base_layers = [l for l in meta["layers"] if l["width"] >= 1920 and l["height"] >= 1080 and l.get("diff_id", 0) == 0]
    base_layers.sort(key=lambda l: l["layer_id"])
    if len(base_layers) >= 2:
        l_first = base_layers[0]
        l_last = base_layers[-1]
        dual_base_cgs.append((c, len(base_layers), l_first["name"], l_last["name"]))

print(f"检测到拥有多个阶段底图的 CG 共 {len(dual_base_cgs)} 个:")
for c, cnt, n1, n2 in dual_base_cgs:
    print(f"  {c:8s} | 底图数: {cnt:2d} | 初始态: {n1:4s} -> 高潮态: {n2:4s}")
