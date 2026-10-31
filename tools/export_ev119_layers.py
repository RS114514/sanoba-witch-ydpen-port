import json, subprocess, os

with open("/tmp/audit_all_cgs/ev119a/ev119a.json") as f:
    meta = json.load(f)
with open("/tmp/audit_all_cgs/ev119a/ev119a.resx.json") as f:
    resx = json.load(f)["Resources"]

out_dir = "/tmp/ev119_layers_png"
os.makedirs(out_dir, exist_ok=True)

for l in meta["layers"]:
    lid = l["layer_id"]
    tlg_key = f"{lid}.tlg"
    res_id = meta.get(tlg_key, "").replace("#resource#", "")
    bin_rel = resx.get(res_id, "")
    bin_path = os.path.join("/tmp/audit_all_cgs/ev119a", bin_rel)
    out_png = os.path.join(out_dir, f"{l['name']}.png")
    if os.path.exists(bin_path):
        subprocess.run(["ffmpeg", "-y", "-i", bin_path, out_png], capture_output=True)
        if os.path.exists(out_png):
            print(f"Exported {l['name']}.png: size={os.path.getsize(out_png)}")
