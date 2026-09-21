#!/usr/bin/env python3
"""Copy the posts from the `writeups` repository into this one, for the site to build.

Why this exists
---------------
The posts were published only as Markdown in a GitHub repository, which means their
URLs looked like `github.com/sushant-me/writeups/blob/main/2026-09-21-....md` and search
engines indexed GitHub rather than this domain. Roughly ten thousand words of technical
writing, and the site they belong to could not see any of it.

`writeups` stays the canonical source. This script copies, it does not move: edit a post
there, run this, commit the result here. The generated copy carries frontmatter so the
build does not have to guess a title or a date from prose.

Usage:
    python3 scripts/sync-writeups.py [path-to-writeups-repo]

Exits non-zero if the sibling repository is not found, rather than silently syncing
nothing and leaving a stale copy in place that looks current.
"""

from __future__ import annotations

import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent
OUT = REPO / "content" / "writing"
DEFAULT_SOURCE = REPO.parent / "writeups"


def parse(md_path: pathlib.Path) -> tuple[str, str, str, str]:
    """Return (title, date, summary, body). Body excludes the title and byline."""
    raw = md_path.read_text(encoding="utf-8")
    lines = raw.split("\n")

    title = ""
    body_start = 0
    for i, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            body_start = i + 1
            break

    # The byline looks like: *Sushant Poudel · 2026-09-21 · 8 min read*
    date = ""
    for i in range(body_start, min(body_start + 4, len(lines))):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", lines[i])
        if m:
            date = m.group(1)
            body_start = i + 1
            break
    if not date:
        m = re.search(r"(\d{4}-\d{2}-\d{2})", md_path.name)
        date = m.group(1) if m else ""

    body = "\n".join(lines[body_start:]).lstrip("\n")

    # First real paragraph becomes the summary, stripped of Markdown emphasis.
    summary = ""
    for block in body.split("\n\n"):
        text = block.strip()
        if not text or text.startswith(("#", "|", "```", "-", "*", ">")):
            continue
        summary = re.sub(r"[*`_\[\]]", "", text)
        summary = re.sub(r"\(([^)]*)\)", "", summary)
        summary = " ".join(summary.split())
        summary = summary[:200].rstrip()
        if len(summary) == 200:
            summary = summary.rsplit(" ", 1)[0] + "…"
        break

    return title, date, summary, body


def slug_for(md_path: pathlib.Path) -> str:
    name = md_path.stem
    return re.sub(r"^\d{4}-\d{2}-\d{2}-", "", name)


def main() -> int:
    source = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.is_dir():
        print(
            f"FAIL  no writeups repository at {source}. Pass its path as an argument. "
            "Refusing to sync nothing and leave the previous copy looking current."
        )
        return 1

    posts = sorted(p for p in source.glob("*.md") if p.name.lower() != "readme.md")
    if not posts:
        print(f"FAIL  no posts found in {source}.")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.md"):
        stale.unlink()

    for p in posts:
        title, date, summary, body = parse(p)
        slug = slug_for(p)
        front = (
            "---\n"
            f"title: {title}\n"
            f"date: {date}\n"
            f"summary: {summary}\n"
            f"source: https://github.com/sushant-me/writeups/blob/main/{p.name}\n"
            "---\n\n"
        )
        (OUT / f"{slug}.md").write_text(front + body, encoding="utf-8")
        print(f"  {slug:56} {date}  {len(body.split()):>5} words")

    print(f"\n{len(posts)} post(s) synced into {OUT.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
