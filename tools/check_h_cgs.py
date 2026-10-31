import os, json, glob

tmp_base = "/tmp/audit_all_cgs"
check_list = ["ev115a", "ev116a", "ev212a", "ev213a", "ev312a", "ev313a", "ev411a", "ev412a", "ev413a", "ev505a", "ev506a"]

for c in check_list:
    jpath = os.path.join(tmp_base, c, c + ".json")
    if not os.path.exists(jpath):
        print(f"[-] {c} 不存在")
        continue
    with open(jpath) as f:
        meta = json.load(f)
    layers = meta.get("layers", [])
    names = [l["name"] for l in layers]
    print(f"[{c}] 总图层: {len(layers)}, 图层名字前10个: {names[:10]}")
