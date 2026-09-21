#!/usr/bin/env python3
"""Generate display-size derivatives of the site's images.

The originals in public/images are full-resolution camera files — five gallery
photos are 16-20 MB each and the avatar alone is 7 MB, for ~112 MB of images on
a single page. The grid never renders them wider than ~600 px, so serving the
originals costs visitors a five-minute download and makes the browser composite
20-megapixel textures.

This writes public/images/optimized/<same-name> (long edge <= 1600 px, JPEG q82,
progressive) plus two small variants of the profile photo for the avatar and the
favicon. Originals are left untouched and are still what the lightbox opens.

    python3 scripts/optimize-images.py
"""
from __future__ import annotations

import glob
import os
import sys

from PIL import Image, ImageOps

SRC = "public/images"
OUT = os.path.join(SRC, "optimized")
MAX_EDGE = 1600
QUALITY = 82

# Long edge for the two small derivatives, keyed by output suffix.
PROFILE = "profile pciture.jpg"
VARIANTS = {"avatar-400": 400, "icon-192": 192}


def save(im: Image.Image, path: str, quality: int = QUALITY) -> int:
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    return os.path.getsize(path)


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    sources = sorted(
        f
        for f in glob.glob(os.path.join(SRC, "*"))
        if os.path.isfile(f)
        and f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    )
    if not sources:
        print("no source images found in", SRC, file=sys.stderr)
        return 1

    rows: list[tuple[str, int, int, tuple[int, int], tuple[int, int]]] = []
    for src in sources:
        name = os.path.basename(src)
        out = os.path.join(OUT, name)
        before = os.path.getsize(src)
        with Image.open(src) as im:
            # EXIF rotation must be baked in before the metadata is dropped, or
            # portrait photos come out sideways.
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            size_before = im.size
            im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
            after = save(im, out)
            size_after = im.size
        rows.append((name, before, after, size_before, size_after))

        if name == PROFILE:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                for suffix, edge in VARIANTS.items():
                    small = im.copy()
                    small.thumbnail((edge, edge), Image.LANCZOS)
                    save(small, os.path.join(OUT, f"{suffix}.jpg"), 86)

    total_before = sum(r[1] for r in rows)
    total_after = sum(r[2] for r in rows)
    print(f"{'FILE':<44}{'BEFORE':>10}{'AFTER':>10}   DIMENSIONS")
    for name, before, after, sb, sa in rows:
        print(
            f"{name:<44}{before / 1048576:>8.1f}MB{after / 1024:>8.0f}KB"
            f"   {sb[0]}x{sb[1]} -> {sa[0]}x{sa[1]}"
        )
    print(
        f"\ntotal {total_before / 1048576:.1f} MB -> {total_after / 1048576:.2f} MB "
        f"({total_before / max(total_after, 1):.0f}x smaller)"
    )
    for suffix in VARIANTS:
        p = os.path.join(OUT, f"{suffix}.jpg")
        if os.path.exists(p):
            print(f"  {suffix}.jpg  {os.path.getsize(p) / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
