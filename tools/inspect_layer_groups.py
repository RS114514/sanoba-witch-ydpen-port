import os, glob, json

tmp_base = "/tmp/audit_all_cgs"
sample_cgs = ["ev105a", "ev106a", "ev111a", "ev115a", "ev119a", "ev204a", "ev304a", "ev405a", "ev406a", "ev505a"]

for scg in sample_cgs:
    jpath = os.path.join(tmp_base, scg, scg + ".json")
    if not os.path.exists(jpath): continue
    with open(jpath) as f:
        meta = json.load(f)
    layers = meta.get("layers", [])
    base_l = [l for l in layers if l.get("diff_id", 0) == 0 or (l["width"] >= 1920 and l["height"] >= 1080)]
    base_names = [l["name"] for l in base_l]
    groups = {}
    for l in layers:
        g = l["name"][0] if l["name"] else "?"
        groups[g] = groups.get(g, 0) + 1
    print("[%s] 总图层: %d, 底图候选: %s, 分组: %s" % (scg, len(layers), base_names, groups))
