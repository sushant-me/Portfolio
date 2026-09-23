#!/usr/bin/env python3
"""Fail the build when a post would render without a title.

Why this exists
---------------
A post whose source used YAML frontmatter instead of the house `# Title` format
synced with an EMPTY title. The site built successfully, deployed, and served a
post page with an empty `<h1>` and an empty `og:title` — the two things a reader
and a search engine each use to decide what the page is. Nothing objected, because
a missing heading is not a build error.

That is the failure mode this repository's sibling `reputation` project exists to
prevent: a check that quietly found nothing is indistinguishable from everything
being fine. So this runs as `prebuild`, and it exits non-zero rather than warning.

What it checks
--------------
Structural, not editorial. Every synced post must carry a non-empty `title`,
`date` and `summary` in its frontmatter — the three fields the page renders or
advertises. It does not judge the writing, the length, or the accuracy, because
those are not things a script should decide.

Deliberately NOT checked: whether the title matches the source's H1. The synced
copy is generated, so a mismatch means the sync ran with different input, and the
generator is the place to fix that.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "writing"

REQUIRED = ("title", "date", "summary")


def frontmatter(raw: str) -> dict[str, str]:
    """The same shape `src/lib/writing.ts` parses, so the two cannot disagree."""
    match = re.match(r"^---\n(.*?)\n---\n?", raw, re.S)
    if not match:
        return {}
    meta: dict[str, str] = {}
    for line in match.group(1).split("\n"):
        idx = line.find(":")
        if idx == -1:
            continue
        meta[line[:idx].strip()] = line[idx + 1:].strip()
    return meta


def main() -> int:
    if not POSTS.is_dir():
        print(f"no posts directory at {POSTS}", file=sys.stderr)
        return 1

    posts = sorted(POSTS.glob("*.md"))
    if not posts:
        print("no posts found — a build with nothing to check is not a pass", file=sys.stderr)
        return 1

    problems: list[str] = []
    for path in posts:
        meta = frontmatter(path.read_text(encoding="utf-8"))
        if not meta:
            problems.append(f"{path.name}: no frontmatter block")
            continue
        for field in REQUIRED:
            if not meta.get(field, "").strip():
                problems.append(f"{path.name}: empty or missing {field!r}")

    if problems:
        print(f"{len(problems)} post problem(s) — refusing to build:\n", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        print(
            "\nA post source in sushant-me/writeups uses '# Title' plus a byline line;"
            "\nthe sync copies it here. YAML frontmatter in the source produces an"
            "\nempty title, which renders as an empty <h1> and og:title.",
            file=sys.stderr,
        )
        return 1

    print(f"{len(posts)} posts checked: title, date and summary all present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
