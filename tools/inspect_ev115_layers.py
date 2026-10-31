import os, json

with open("/tmp/audit_all_cgs/ev115a/ev115a.json") as f:
    meta = json.load(f)
with open("/tmp/audit_all_cgs/ev115a/ev115a.resx.json") as f:
    resx = json.load(f)["Resources"]

print(f"ev115a layers total: {len(meta['layers'])}")
# 找出 A 组、B 组、C 组、D 组、E 组对应的图层
for prefix in ["A", "B", "C", "D", "E"]:
    group_layers = [l for l in meta["layers"] if l["name"].startswith(prefix)]
    print(f"Group {prefix} count: {len(group_layers)}")
    if group_layers:
        first = group_layers[0]
        lid = first["layer_id"]
        res_id = meta.get(f"{lid}.tlg", "").replace("#resource#", "")
        print(f"  First: name={first['name']}, lid={lid}, res={res_id} -> {resx.get(res_id)}")
