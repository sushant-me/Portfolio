#!/usr/bin/env python3
"""Generate a social preview card per post.

Why this exists
---------------
Every post advertised the same `/og.png`. A link to any of the writing unfurled
with a generic site image, so eight different posts looked identical in a timeline
and none of them told a reader what it was about. The title is the single most
useful thing on a card, and it was missing.

Why it is a script and not a route
----------------------------------
Next's `ImageResponse` generates these at request time, which needs a server
runtime — and this site is `output: 'export'`, a static bundle. So the cards are
rendered at build time into `public/og/` and referenced as static files. That also
makes them cacheable and inspectable, which a runtime route would not.

Running it

    uv run --with pillow python3 scripts/make-og-images.py

Pillow is not a project dependency on purpose: the site builds without it, and this
is a content step run when posts change. The generated PNGs are committed, so a
build never depends on this having run.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "writing"
OUT = ROOT / "public" / "og"

W, H = 1200, 630
BG = (11, 15, 20)
FG = (232, 238, 245)
DIM = (140, 155, 172)
ACCENT = (94, 234, 212)
MARGIN = 80

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_REGULAR = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def load_font(paths: list[str], size: int) -> ImageFont.FreeTypeFont:
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    # Last resort: ask fontconfig, then fall back to the bundled default so the
    # script reports a result rather than dying on a missing file.
    try:
        found = subprocess.run(["fc-match", "-f", "%{file}", "sans:bold"],
                               capture_output=True, text=True, timeout=10).stdout.strip()
        if found and Path(found).exists():
            return ImageFont.truetype(found, size)
    except (OSError, subprocess.SubprocessError):
        pass
    return ImageFont.load_default(size)


def wrap(text: str, font: ImageFont.FreeTypeFont, draw: ImageDraw.ImageDraw,
         max_width: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def frontmatter(raw: str) -> dict[str, str]:
    m = re.match(r"^---\n(.*?)\n---\n?", raw, re.S)
    if not m:
        return {}
    meta: dict[str, str] = {}
    for line in m.group(1).split("\n"):
        i = line.find(":")
        if i != -1:
            meta[line[:i].strip()] = line[i + 1:].strip()
    return meta


def card(title: str) -> Image.Image:
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)

    # A thin accent rule so the card reads as branded rather than as a screenshot.
    d.rectangle([0, 0, W, 6], fill=ACCENT)

    title_font = load_font(FONT_CANDIDATES, 58)
    lines = wrap(title, title_font, d, W - 2 * MARGIN)[:5]

    y = 150
    for line in lines:
        d.text((MARGIN, y), line, font=title_font, fill=FG)
        y += 74

    foot_font = load_font(FONT_REGULAR, 30)
    d.text((MARGIN, H - MARGIN - 34), "Sushant Poudel", font=foot_font, fill=ACCENT)
    d.text((MARGIN, H - MARGIN), "sushantpoudel2028.com.np", font=foot_font, fill=DIM)
    return im


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    posts = sorted(POSTS.glob("*.md"))
    if not posts:
        print("no posts to render", file=sys.stderr)
        return 1

    written = 0
    for path in posts:
        meta = frontmatter(path.read_text(encoding="utf-8"))
        title = meta.get("title", "").strip()
        if not title:
            # check-posts.py already fails the build for this; do not invent one.
            print(f"skipping {path.name}: no title", file=sys.stderr)
            continue
        target = OUT / f"{path.stem}.png"
        card(title).save(target, "PNG", optimize=True)
        written += 1
        print(f"  {target.relative_to(ROOT)}  ({target.stat().st_size // 1024} KB)")

    print(f"{written} card(s) written to {OUT.relative_to(ROOT)}")
    return 0 if written else 1


if __name__ == "__main__":
    sys.exit(main())
