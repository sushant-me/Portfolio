#!/usr/bin/env python3
"""Fail the build when a page is not usable as a search result.

Why this exists
---------------
check-links.py proves every internal link resolves and check-posts.py proves a post
has a title and a social card. Neither says anything about what a search engine
reads: a page can build, link correctly, and still ship a duplicated <title>, a
description that is the build's own abstract truncated mid-word, or structured data
that is invalid JSON. All of those are invisible in a successful build — which is
the same failure mode the sibling `reputation` project exists to prevent, one layer
up.

What it checks, and why each one
--------------------------------
* <title> present, unique, and short enough not to be truncated. Post titles are
  authored in the writeups repository and are longer by design, so they get a wider
  limit rather than being rewritten here.
* meta description present, unique, and in the 70–165 character band a snippet
  displays. Opinion is not being checked; the width is.
* one <h1> per page. The post whose <h1> was empty is why check-posts.py exists; a
  second <h1> is the same defect from the other side.
* canonical, og:image, og:url and twitter:card, because a shared link and a
  canonical are both things a page silently loses when metadata is assembled by hand.
* every <script type="application/ld+json"> parses, names schema.org, and the site
  carries the Person node with an @id and non-empty sameAs. Invalid JSON-LD is
  dropped by crawlers without an error anywhere.
* per-route types: ScholarlyArticle on a paper, BlogPosting with an articleSection
  on a post, BreadcrumbList on every subpage.
* sitemap coverage in both directions: every URL it advertises is emitted, and every
  indexable page is advertised. /search is exempt because it is noindex.

It reads `out/`, not `src/`, for the same reason check-links.py does: the lesson of
the page that built successfully with an empty heading is that the source is not the
output.

    python3 scripts/check-seo.py
    python3 scripts/check-seo.py --self-test
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "out"
BASE = "https://sushantpoudel2028.com.np"
SKIP = {"404.html", "_not-found.html", "admin.html"}
# Editorial titles live in the writeups repository and are not rewritten here, so
# they are allowed past the snippet limit. Everything else is not.
WIDE_TITLE_PREFIXES = ("/writing/",)
DESCRIPTION_MIN = 70
DESCRIPTION_MAX = 165
TITLE_MAX = 70
TITLE_MAX_WIDE = 110


def attr(tag: str, name: str) -> str | None:
    match = re.search(rf'\b{re.escape(name)}="([^"]*)"', tag)
    return htmlmod.unescape(match.group(1)) if match else None


def meta(page: str, key: str, value: str) -> str | None:
    for tag in re.findall(r"<meta\b[^>]*>", page):
        if attr(tag, key) == value:
            return attr(tag, "content") or ""
    return None


def route_for(path: Path) -> str:
    rel = "/" + str(path.relative_to(OUT))
    if rel.endswith("/index.html"):
        return rel[: -len("index.html")] or "/"
    return rel[: -len(".html")]


def parse_page(page: str) -> dict:
    title_match = re.search(r"<title>(.*?)</title>", page, re.S)
    canonical = None
    for tag in re.findall(r"<link\b[^>]*>", page):
        if attr(tag, "rel") == "canonical":
            canonical = attr(tag, "href")
            break
    ld_raw = re.findall(
        r'<script type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S
    )
    ld: list = []
    ld_errors: list[str] = []
    for raw in ld_raw:
        try:
            ld.append(json.loads(raw))
        except json.JSONDecodeError as exc:
            ld_errors.append(str(exc))
    robots = (meta(page, "name", "robots") or "").lower()
    return {
        "title": htmlmod.unescape(title_match.group(1)).strip() if title_match else "",
        "description": (meta(page, "name", "description") or "").strip(),
        "canonical": canonical or "",
        "og_title": meta(page, "property", "og:title"),
        "og_image": meta(page, "property", "og:image"),
        "og_url": meta(page, "property", "og:url"),
        "twitter_card": meta(page, "name", "twitter:card"),
        "h1": len(re.findall(r"<h1\b", page)),
        "ld": ld,
        "ld_errors": ld_errors,
        "noindex": "noindex" in robots,
    }


def find_nodes(node, kind: str) -> list[dict]:
    found: list[dict] = []
    if isinstance(node, dict):
        types = node.get("@type")
        if types == kind or (isinstance(types, list) and kind in types):
            found.append(node)
        for value in node.values():
            found.extend(find_nodes(value, kind))
    elif isinstance(node, list):
        for item in node:
            found.extend(find_nodes(item, kind))
    return found


def sitemap_routes() -> set[str] | None:
    path = OUT / "sitemap.xml"
    if not path.is_file():
        return None
    text = path.read_text(encoding="utf-8")
    routes: set[str] = set()
    for loc in re.findall(r"<loc>(.*?)</loc>", text, re.S):
        url = htmlmod.unescape(loc).strip()
        if not url.startswith(BASE):
            return None
        route = url[len(BASE):] or "/"
        routes.add(route.rstrip("/") or "/")
    return routes


def audit(pages: dict[str, dict], sitemap: set[str] | None) -> list[str]:
    """Every rule, as a pure function so --self-test can call it."""
    problems: list[str] = []
    titles: dict[str, str] = {}
    descriptions: dict[str, str] = {}

    for route, page in sorted(pages.items()):
        where = route
        title = page["title"]
        if not title:
            problems.append(f"{where}: no <title>")
        else:
            limit = TITLE_MAX_WIDE if route.startswith(WIDE_TITLE_PREFIXES) else TITLE_MAX
            if not 8 <= len(title) <= limit:
                problems.append(
                    f"{where}: title is {len(title)} chars (limit {limit}): {title!r}"
                )
            if title in titles:
                problems.append(f"{where}: duplicate title, also on {titles[title]}")
            titles[title] = route

        desc = page["description"]
        if not desc:
            problems.append(f"{where}: no meta description")
        else:
            if not DESCRIPTION_MIN <= len(desc) <= DESCRIPTION_MAX:
                problems.append(
                    f"{where}: description is {len(desc)} chars "
                    f"({DESCRIPTION_MIN}–{DESCRIPTION_MAX} expected): {desc[:80]!r}…"
                )
            if desc in descriptions:
                problems.append(
                    f"{where}: duplicate description, also on {descriptions[desc]}"
                )
            descriptions[desc] = route

        if not page["canonical"]:
            problems.append(f"{where}: no canonical link")
        elif not page["canonical"].startswith(BASE):
            problems.append(f"{where}: canonical is not absolute on this site: {page['canonical']}")

        for field, label in (
            ("og_title", "og:title"),
            ("og_image", "og:image"),
            ("og_url", "og:url"),
            ("twitter_card", "twitter:card"),
        ):
            if not page[field]:
                problems.append(f"{where}: no {label}")

        if page["h1"] != 1:
            problems.append(f"{where}: {page['h1']} <h1> elements (exactly 1 expected)")

        if page["ld_errors"]:
            problems.append(f"{where}: unparseable JSON-LD — {page['ld_errors'][0]}")
        if not page["ld"]:
            problems.append(f"{where}: no JSON-LD")
        else:
            contexts = [
                block.get("@context")
                for block in page["ld"]
                if isinstance(block, dict)
            ]
            if "https://schema.org" not in contexts:
                problems.append(f"{where}: JSON-LD @context is not https://schema.org")
            persons = find_nodes(page["ld"], "Person")
            entity = [
                person
                for person in persons
                if person.get("@id") and person.get("sameAs")
            ]
            if not entity:
                problems.append(f"{where}: no Person node with @id and sameAs")

            if route.startswith("/publications/"):
                articles = find_nodes(page["ld"], "ScholarlyArticle")
                if not articles:
                    problems.append(f"{where}: no ScholarlyArticle")
                elif not articles[0].get("headline") or not articles[0].get("author"):
                    problems.append(f"{where}: ScholarlyArticle is missing headline or author")

            if route.startswith("/writing/") and route != "/writing":
                posts = find_nodes(page["ld"], "BlogPosting")
                if not posts:
                    problems.append(f"{where}: no BlogPosting")
                elif not posts[0].get("articleSection"):
                    problems.append(f"{where}: BlogPosting is missing articleSection")

            if route != "/" and not find_nodes(page["ld"], "BreadcrumbList"):
                problems.append(f"{where}: no BreadcrumbList")

        # /admin and the 404 pages are not in `pages`; /search opts out with noindex.
        if sitemap is not None and not page["noindex"]:
            advertised = {r.rstrip("/") or "/" for r in sitemap}
            if (route.rstrip("/") or "/") not in advertised:
                problems.append(f"{where}: indexable page is missing from sitemap.xml")

    if sitemap is not None:
        for route in sorted(sitemap):
            if route not in pages and route.rstrip("/") not in pages:
                problems.append(f"sitemap lists {route} but the build emitted no such page")

    return problems


def collect() -> tuple[dict[str, dict], set[str] | None]:
    if not OUT.is_dir():
        print(f"no build output at {OUT} — run the build first", file=sys.stderr)
        raise SystemExit(1)
    pages: dict[str, dict] = {}
    for path in sorted(OUT.rglob("*.html")):
        if path.name in SKIP or path.parent.name == "admin":
            continue
        route = route_for(path)
        if route in ("/404", "/_not-found"):
            continue
        pages[route] = parse_page(path.read_text(encoding="utf-8", errors="replace"))
    return pages, sitemap_routes()


def self_test() -> int:
    """Feed the audit the defects it exists for and require a hit for each."""
    good = {
        "title": "Sushant Poudel — AI Security Engineer in Nepal",
        "description": "Sushant Poudel is an AI security engineer in Nepal working on agent "
        "boundaries, LLM evaluation and memory safety, and is open to engineering roles.",
        "canonical": "https://sushantpoudel2028.com.np/",
        "og_title": "Sushant Poudel",
        "og_image": "https://sushantpoudel2028.com.np/og.png",
        "og_url": "https://sushantpoudel2028.com.np/",
        "twitter_card": "summary_large_image",
        "h1": 1,
        "ld": [
            {
                "@context": "https://schema.org",
                "@graph": [
                    {"@type": "Person", "@id": "https://x/#person", "sameAs": ["https://github.com/x"]}
                ],
            }
        ],
        "ld_errors": [],
        "noindex": False,
    }
    cases = [
        ("a compliant page passes", {"/": dict(good)}, {"/"}, False),
        (
            "a duplicate title is caught",
            {"/": dict(good), "/about": {**good, "canonical": "https://sushantpoudel2028.com.np/about"}},
            {"/", "/about"},
            True,
        ),
        (
            "a long title is caught",
            {"/": {**good, "title": "Sushant Poudel " + "x" * 90}},
            {"/"},
            True,
        ),
        (
            "a 40-character description is caught",
            {"/": {**good, "description": "Too short to be a useful search snippet."}},
            {"/"},
            True,
        ),
        (
            "an invalid JSON-LD block is caught",
            {"/": {**good, "ld": [], "ld_errors": ["Expecting value: line 1 column 1"]}},
            {"/"},
            True,
        ),
        (
            "a page missing from the sitemap is caught",
            {"/": dict(good), "/about": {**good, "canonical": "https://sushantpoudel2028.com.np/about"}},
            {"/"},
            True,
        ),
        (
            "a noindex page is exempt from sitemap coverage",
            {"/": dict(good), "/search": {**good, "canonical": "https://sushantpoudel2028.com.np/search", "noindex": True}},
            {"/"},
            False,
        ),
    ]

    failures = 0
    for label, pages, sitemap, expect_problem in cases:
        found = bool(audit(pages, sitemap))
        ok = found == expect_problem
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}")
        if not ok:
            failures += 1

    if failures:
        print(
            f"\n{int(failures)} self-test case(s) behaved wrongly. The guard is not "
            "guarding; do not trust a pass from it.",
            file=sys.stderr,
        )
        return 1
    print("\nself-test: every rule fires on the defect it exists for, and a clean page stays quiet")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()

    pages, sitemap = collect()
    if not pages:
        print("build output has no html pages; a check over nothing is not a pass", file=sys.stderr)
        return 1
    if sitemap is None:
        print("out/sitemap.xml is missing or advertises another origin", file=sys.stderr)
        return 1

    problems = audit(pages, sitemap)
    if problems:
        print(f"{len(problems)} SEO problem(s) — refusing to ship:\n", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        return 1

    print(
        f"{len(pages)} pages: titles, descriptions, canonicals, headings and JSON-LD all "
        f"parse; sitemap.xml lists all {len(sitemap)} indexable routes"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
