import os, json

with open("/tmp/audit_all_cgs/ev119a/ev119a.json") as f:
    meta = json.load(f)

for l in meta["layers"]:
    print("Layer name=%s, layer_id=%d, diff_id=%d, left=%d, top=%d, width=%d, height=%d, opacity=%d, visible=%d" % (
        l["name"], l["layer_id"], l.get("diff_id", 0), l["left"], l["top"], l["width"], l["height"], l["opacity"], l["visible"]
    ))
