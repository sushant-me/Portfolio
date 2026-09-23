#!/usr/bin/env python3
"""Fail the build when a page links to a route this site does not emit.

Why this exists
---------------
The sitemap check covers the 20 URLs the sitemap advertises. It says nothing about
the 59 internal links *between* pages, and those rot the same way: a post renamed, a
slug changed, a section moved, and the link is dead while every sitemap entry still
resolves. Nothing was watching them.

This runs as `postbuild`, because it reads the emitted output rather than the
source — the whole lesson of the post whose `<h1>` was empty is that a successful
build says nothing about what was built. It reads `out/`, not `src/`.

What counts as a route
----------------------
A static export emits `writing.html` for `/writing`, so a link is matched against
the file, the extensionless form, and the directory-index form. Getting this wrong
produces false positives, which would break deploys for a reason that is not a
broken link — so both directions were tested: 59 real links resolve, and an injected
dead link is reported.
"""

from __future__ import annotations

import collections
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"


def emitted_routes() -> set[str]:
    routes: set[str] = set()
    for path in OUT.rglob("*"):
        if not path.is_file():
            continue
        rel = "/" + str(path.relative_to(OUT))
        routes.add(rel)
        if rel.endswith(".html"):
            routes.add(rel[:-5])                                    # /writing
            if rel.endswith("/index.html"):
                routes.add(rel[: -len("index.html")].rstrip("/") or "/")
    return routes


def main() -> int:
    if not OUT.is_dir():
        print(f"no build output at {OUT} — run the build first", file=sys.stderr)
        return 1

    routes = emitted_routes()
    if not routes:
        print("build output is empty; a check with nothing to read is not a pass",
              file=sys.stderr)
        return 1

    links: dict[str, set[str]] = collections.defaultdict(set)
    for page in OUT.rglob("*.html"):
        html = page.read_text(encoding="utf-8", errors="replace")
        for href in re.findall(r'href="(/[^"#?]*)"', html):
            links[href].add("/" + str(page.relative_to(OUT)))

    dead = {
        href: sorted(pages)[:2]
        for href, pages in links.items()
        if href not in routes
        and href.rstrip("/") not in routes
        and (href + "/") not in routes
    }

    if dead:
        print(f"{len(dead)} dead internal link(s) — refusing to ship:\n", file=sys.stderr)
        for href, pages in sorted(dead.items()):
            print(f"  {href}\n      linked from {', '.join(pages)}", file=sys.stderr)
        return 1

    print(f"{len(links)} distinct internal links across the build, all resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
