import os, glob, re

for sf in glob.glob("/Volumes/500GB/sanoba-witch-ydpen-port/app/data/scn_*.js"):
    with open(sf, "r", encoding="utf-8") as f:
        text = f.read()
    evs = set(re.findall(r'["\'](ev[0-9]+[a-z]*)["\']', text))
    print(os.path.basename(sf), "contains EVs:", sorted(list(evs)))
