#!/usr/bin/env python3
"""Prepare exported carousel slides for Instagram upload.

Paper exports 3:4 PNGs. Instagram's carousel uploader crops those, and PNG plus
a full-frame grain layer produces files the web uploader rejects. This pads each
slide to a ratio Instagram accepts uncropped and encodes it as JPEG.

    python3 export-for-ig.py ~/Desktop/slides
    python3 export-for-ig.py ~/Desktop/slides --ratio 3:4 --quality 95

Output lands in <indir>/ig/ as 01.jpg, 02.jpg, ... in sorted filename order,
which is the order Instagram will use.
"""

import argparse
import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("needs Pillow:  pip install Pillow")

EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def edge_colour(im, ring=8):
    """Median colour of the image's outer border.

    The deck's artboard is #0C0C0C in Paper, but the grain layer sits over the
    whole composition and lifts it, and on the bright tool slides JPEG ringing
    at the card edge lifts it further and shifts it blue. Padding with a flat
    #0C0C0C therefore leaves a faint vertical seam, about 9 levels on those
    slides. Sampling the real border makes the seam zero by construction.
    """
    px = im.load()
    w, h = im.size
    samples = []
    for x in range(0, w, 3):
        for y in list(range(ring)) + list(range(h - ring, h)):
            samples.append(px[x, y])
    for y in range(0, h, 3):
        for x in list(range(ring)) + list(range(w - ring, w)):
            samples.append(px[x, y])
    return tuple(sorted(c[i] for c in samples)[len(samples) // 2] for i in range(3))


def pad(im, ratio_w, ratio_h, width):
    """Fit im inside a ratio_w:ratio_h frame on its own border colour, then
    scale to `width`. Padding rather than cropping, so nothing is ever cut."""
    target_w = width
    target_h = round(width * ratio_h / ratio_w)
    scale = min(target_w / im.width, target_h / im.height)
    new = (round(im.width * scale), round(im.height * scale))
    canvas = Image.new("RGB", (target_w, target_h), edge_colour(im))
    canvas.paste(
        im.resize(new, Image.LANCZOS),
        ((target_w - new[0]) // 2, (target_h - new[1]) // 2),
    )
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("indir", type=pathlib.Path)
    ap.add_argument("--ratio", default="4:5", help="4:5 (default) or 3:4 or 1:1")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument(
        "--quality",
        type=int,
        default=92,
        help="JPEG quality. 92 is the floor before grain starts to block up.",
    )
    a = ap.parse_args()

    rw, rh = (int(v) for v in a.ratio.split(":"))
    src = sorted(p for p in a.indir.iterdir() if p.suffix.lower() in EXTS)
    if not src:
        sys.exit(f"no images in {a.indir}")

    out = a.indir / "ig"
    out.mkdir(exist_ok=True)

    total = 0
    for i, p in enumerate(src, 1):
        im = Image.open(p).convert("RGB")
        dst = out / f"{i:02d}.jpg"
        # subsampling=0 keeps 4:4:4 chroma. The default 4:2:0 smears saturated
        # red type against a near-black field, which is most of this deck.
        pad(im, rw, rh, a.width).save(
            dst, "JPEG", quality=a.quality, subsampling=0, optimize=True
        )
        n = dst.stat().st_size
        total += n
        print(f"  {p.name:28} {im.width}x{im.height}  ->  {dst.name}  {n / 1e6:.2f}MB")

    print(f"\n{len(src)} slides, {total / 1e6:.2f}MB total, in {out}")
    if total / len(src) > 4e6:
        print("warning: over 4MB per slide, drop --quality or --width")


if __name__ == "__main__":
    main()
