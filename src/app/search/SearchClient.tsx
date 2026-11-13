"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type SearchDoc = {
  kind: "Writing" | "Paper";
  title: string;
  href: string;
  summary: string;
  meta: string;
};

/**
 * Client-side search over the site's own content.
 *
 * The site is a static export, so there is no server to query: the index is built
 * at compile time from the same files the pages are rendered from and shipped with
 * the page. That is also what makes the `SearchAction` in the site's structured
 * data honest — `/search?q=…` really does return results, because this component
 * reads the query string on mount.
 *
 * The URL is updated with `replaceState` rather than a router navigation: typing
 * should not push a history entry per keystroke, but the address should still be
 * copyable and shareable, which is the point of a query-string search.
 */
export default function SearchClient({ docs }: { docs: SearchDoc[] }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // The address bar is an external system and this is a one-time read from it.
    // Deriving the initial value during render would render a different tree on the
    // server (no window) and the client (query present), which is a hydration error;
    // the effect is what keeps the two in step.
    const initial = new URLSearchParams(window.location.search).get("q") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(initial);
    if (initial) inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const terms = needle.split(/\s+/).filter(Boolean);
    return docs
      .map((doc) => {
        const haystack = `${doc.title} ${doc.summary} ${doc.meta}`.toLowerCase();
        // Every term has to appear somewhere, so "mcp audit" does not return
        // everything that contains either word.
        const matched = terms.every((term) => haystack.includes(term));
        return { doc, matched };
      })
      .filter((entry) => entry.matched)
      .map((entry) => entry.doc);
  }, [docs, query]);

  function update(next: string) {
    setQuery(next);
    const params = new URLSearchParams(window.location.search);
    if (next.trim()) params.set("q", next);
    else params.delete("q");
    const suffix = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${suffix ? `?${suffix}` : ""}`);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div className="search">
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update(query);
        }}
      >
        <label className="search-label" htmlFor="site-search">
          Search the writing and the papers
        </label>
        <input
          id="site-search"
          ref={inputRef}
          className="search-input"
          type="search"
          name="q"
          value={query}
          onChange={(event) => update(event.target.value)}
          placeholder="e.g. MCP, prompt injection, benchmark, CTF"
          autoComplete="off"
        />
      </form>

      <p className="search-count" aria-live="polite">
        {hasQuery
          ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query.trim()}”`
          : `${docs.length} pages indexed — every post and every paper on this site.`}
      </p>

      {hasQuery && results.length === 0 && (
        <p className="pg-note">
          Nothing matched that. The <Link href="/writing">writing index</Link> has every post and
          the <Link href="/publications">publications index</Link> every paper; if the thing you
          are looking for is not here, <Link href="/contact">email me</Link> and say what it is.
        </p>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((doc) => (
            <li key={doc.href}>
              <span className="search-kind">{doc.kind}</span>
              <Link href={doc.href}>{doc.title}</Link>
              <p>{doc.summary}</p>
              <span className="search-meta">{doc.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
