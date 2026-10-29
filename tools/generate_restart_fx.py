#!/usr/bin/env python3
"""Generate the 800x220 star-sigil frames used by title *restart_open.

Falcon cannot rotate image widgets, ignores src/opacity updates on mounted
images, and drops images taller than the 220px viewport. The original
720x720 effect art is therefore pre-composited here into full-screen frames;
title.js swaps between a few of them by forcing a remount.

Usage:
  python3 tools/generate_restart_fx.py --src-dir "/path/to/ui/image/sys" \
      --out build_assets/sys
"""
import argparse
import math
import os
import subprocess
import tempfile

import numpy as np

W, H, SS = 800, 220, 720


def decode(path):
    out = subprocess.run([
        'ffmpeg', '-nostdin', '-v', 'error', '-i', path,
        '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'
    ], check=True, stdout=subprocess.PIPE)
    arr = np.frombuffer(out.stdout, dtype=np.uint8)
    if arr.size != SS * SS * 4:
        raise SystemExit('unexpected image size for %s: %d bytes' % (path, arr.size))
    return arr.reshape(SS, SS, 4).astype(np.float32)


def render(src, scale, angle_deg, cx, cy, alpha):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = xx + 0.5 - cx
    dy = yy + 0.5 - cy
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    sx = (ca * dx + sa * dy) / scale + SS / 2.0
    sy = (-sa * dx + ca * dy) / scale + SS / 2.0
    inside = (sx >= 0) & (sx < SS - 1) & (sy >= 0) & (sy < SS - 1)
    x0 = np.clip(np.floor(sx).astype(np.int32), 0, SS - 1)
    y0 = np.clip(np.floor(sy).astype(np.int32), 0, SS - 1)
    x1 = np.clip(x0 + 1, 0, SS - 1)
    y1 = np.clip(y0 + 1, 0, SS - 1)
    fx = sx - np.floor(sx)
    fy = sy - np.floor(sy)
    rgba = (src[y0, x0] * ((1 - fx) * (1 - fy))[..., None] +
            src[y0, x1] * (fx * (1 - fy))[..., None] +
            src[y1, x0] * ((1 - fx) * fy)[..., None] +
            src[y1, x1] * (fx * fy)[..., None])
    rgba[..., 3] *= alpha
    rgba[~inside] = 0
    return np.clip(rgba, 0, 255).astype(np.uint8)


def build(src_dir, out_dir):
    eff1 = decode(os.path.join(src_dir, 'title_restart_eff1.png'))
    eff2 = decode(os.path.join(src_dir, 'title_restart_eff2.png'))
    os.makedirs(out_dir, exist_ok=True)
    frames = []

    # 1000ms shrink/spin: 14 frames.
    for i in range(14):
        p = i / 13.0
        e = p ** 1.6
        frames.append(render(
            eff1, 2.7 * ((0.14 / 2.7) ** e), -344.0 * (p ** 1.25),
            360.0 - 400.0 * e, 110.0,
            1.0 if i >= 2 else (0.55 if i == 1 else 0.15)))
    # 500ms burst back out: 10 frames.
    for i in range(10):
        p = i / 9.0
        e = p ** 1.5
        frames.append(render(
            eff2, 0.14 * ((2.2 / 0.14) ** e), -344.0,
            -40.0 + 460.0 * e, 110.0,
            0.95 * (1.0 - 0.9 * e)))

    raw = b''.join(f.tobytes() for f in frames)
    with tempfile.NamedTemporaryFile(suffix='.rgba', delete=False) as tmp:
        tmp.write(raw)
        raw_path = tmp.name
    try:
        subprocess.run([
            'ffmpeg', '-nostdin', '-v', 'error', '-y',
            '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '%dx%d' % (W, H),
            '-r', '16', '-i', raw_path, os.path.join(out_dir, 'title_restart_fx_%02d.png')
        ], check=True)
    finally:
        os.unlink(raw_path)
    print('wrote %d frames to %s' % (len(frames), out_dir))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src-dir', required=True,
                    help='directory containing title_restart_eff1/2.png')
    ap.add_argument('--out', default=os.path.join('build_assets', 'sys'))
    args = ap.parse_args()
    build(args.src_dir, args.out)


if __name__ == '__main__':
    main()
