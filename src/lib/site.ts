/**
 * The facts about the person this site is about, in one place.
 *
 * Every page emits the same `Person` node, and subpages reference it by `@id`
 * instead of repeating it. That is the difference between twenty-four unrelated
 * descriptions of a person and one entity with twenty-four pages that mention it,
 * which is what a search engine needs before it can attach any assertion here to
 * a real individual.
 *
 * Everything in this file is stated on the site itself: the homepage, /about and
 * /press carry each claim in prose, and the two claims that are not checkable from
 * a public URL (the Hult Prize placements and the Aspire Leaders finalist place)
 * are described as awards rather than given source links they do not have.
 */

export const SITE = "https://sushantpoudel2028.com.np";
export const EMAIL = "sushant.poudel2028@gmail.com";

/** One node id per entity, so every page can point at the same node. */
export const PERSON_ID = `${SITE}/#person`;
export const WEBSITE_ID = `${SITE}/#website`;
export const PROFILE_PAGE_ID = `${SITE}/#profilepage`;
export const ORG_ID = `${SITE}/#org`;

/**
 * Profiles that are unambiguously the same person.
 *
 * Only three, deliberately. A `sameAs` is a claim that the URL is the same entity,
 * so it is not a place for every account that exists: an empty or negative-reputation
 * security profile is a link that argues against the page, and an ORCID that has not
 * been confirmed against the record is a claim not yet earned. The reputation
 * repository is included because it is the site's own verifiable claim ledger, not a
 * social profile.
 *
 * `www.linkedin.com` is the address LinkedIn itself canonicalises to — the
 * no-www form redirects, and a redirect in `sameAs` is a weaker signal.
 */
export const SAME_AS: string[] = [
  "https://github.com/sushant-me",
  "https://www.linkedin.com/in/sushant-poudel2028/",
  "https://github.com/sushant-me/reputation",
];

export const KNOWS_ABOUT: string[] = [
  // Ordered so the most distinctive specialisms come first. These are the queries a
  // reader, a recruiter or a committee would actually use to look for this work, and
  // each one is demonstrated by a public artefact rather than asserted.
  "AI safety evaluation",
  "Agentic system security",
  "Model Context Protocol security",
  "LLM prompt injection",
  "AI security",
  "Cybersecurity",
  "Penetration testing",
  "Reverse engineering",
  "Software assurance and verification",
  "Memory safety and fuzzing",
  "Full-stack engineering",
  "Flutter",
];

/**
 * Awards. HackingHub is the all-time board, not the Q3 period board: the period
 * board rolls over and its figures cannot be re-read from the public API, so a
 * claim pinned to it would be uncheckable within a quarter. The all-time row can be
 * confirmed at any time from the leaderboard the account links to.
 */
export const AWARDS: string[] = [
  "Aspire Leaders Program — Global Finalist (2025)",
  "Hult Prize — 1st Runner-Up (2024 and 2025)",
  "Null Origin CTF 2026 — Grand Finale finalist, 2nd of 8 teams (team roamers)",
  "HackingHub — rank 7 on the all-time global leaderboard, 210 flags (November 2026)",
];

export const PERSON_SCHEMA: Record<string, unknown> = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Sushant Poudel",
  givenName: "Sushant",
  familyName: "Poudel",
  alternateName: ["sushant-me", "nofear976"],
  url: `${SITE}/`,
  image: `${SITE}/og.png`,
  jobTitle: "AI Security Engineer",
  description:
    "AI security engineer in Bhaktapur, Nepal, working on the boundary where an LLM's output becomes an action: agent tool boundaries, local policy verification and memory safety. Author of papers on agent security, with a security patch merged into google/go-github.",
  email: `mailto:${EMAIL}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bhaktapur",
    addressCountry: "NP",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Nepal Engineering College",
    url: "https://www.nec.edu.np",
  },
  // No `worksFor`. The last employer on the homepage ended in March 2026 and the
  // current arrangement is part-time and remote; stating either as "works for" in
  // machine-readable form would be a claim the site does not make in prose.
  sameAs: SAME_AS,
  knowsAbout: KNOWS_ABOUT,
  award: AWARDS,
};

/**
 * The site as an entity, with the search action the URL template actually serves.
 *
 * The SearchAction is only declared because `/search` is a real page that filters
 * the writing and the papers: a `target` pointing at a route that does not exist is
 * a claim a crawler will discover is false, and Google documents it as a reason to
 * ignore the markup.
 */
export const WEBSITE_SCHEMA: Record<string, unknown> = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE}/`,
  name: "Sushant Poudel",
  description:
    "Personal site of Sushant Poudel: AI security writing, publications, and work with autonomous agent systems.",
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * The homepage as a profile page for the person.
 *
 * This node lives in the layout with the other two so the whole entity is one
 * graph rather than three scripts that happen to be on the same page. It describes
 * the homepage specifically (`url` and `@id` are the site root); the subpages add
 * their own page nodes and point back at it with `isPartOf`.
 */
export const PROFILE_PAGE_SCHEMA: Record<string, unknown> = {
  "@type": "ProfilePage",
  "@id": PROFILE_PAGE_ID,
  url: `${SITE}/`,
  name: "Sushant Poudel — AI Security Engineer",
  description:
    "Profile, research and writing of Sushant Poudel, an AI security engineer in Nepal.",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": PERSON_ID },
  mainEntity: { "@id": PERSON_ID },
  inLanguage: "en",
};

/** The three entity nodes every page emits, in a single `@graph`. */
export const ENTITY_GRAPH: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@graph": [PERSON_SCHEMA, WEBSITE_SCHEMA, PROFILE_PAGE_SCHEMA],
};

/** A reference to the person node, for `author` / `about` / `mainEntity`. */
export function personRef(): Record<string, unknown> {
  return { "@id": PERSON_ID };
}

/**
 * A minimal inline author node for pages whose author is checked by consumers that
 * do not resolve `@id` references across scripts. It repeats name and url — small,
 * and cheaper than a rich result that silently drops the author.
 */
export function authorNode(name: string, url?: string): Record<string, unknown> {
  const node: Record<string, unknown> = { "@type": "Person", name };
  if (url) node.url = url;
  if (name === "Sushant Poudel") {
    node["@id"] = PERSON_ID;
    node.sameAs = SAME_AS;
  }
  return node;
}

/**
 * A breadcrumb trail, with positions assigned rather than written by hand so a
 * trail cannot be emitted with the wrong order.
 *
 * `path` is site-relative and always starts with "/"; "/" is the homepage.
 */
export function breadcrumbList(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? `${SITE}/` : `${SITE}${item.path}`,
    })),
  };
}

/**
 * A page node that names the entity it is about.
 *
 * Google reads `about`/`mainEntity` on ordinary pages, and it is what ties a page
 * to the Person node instead of to the string "Sushant Poudel". `type` is the more
 * specific page type (`CollectionPage`, `AboutPage`, `ContactPage`, …) so the page
 * says what it is; `WebPage` is the base.
 */
export function pageNode(opts: {
  type: string;
  /** Site-relative path, with "/" for the homepage. */
  url: string;
  name: string;
  description: string;
  mainEntity?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": opts.type,
    "@id": `${SITE}${opts.url === "/" ? "/" : opts.url}#webpage`,
    url: `${SITE}${opts.url === "/" ? "/" : opts.url}`,
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    ...(opts.mainEntity ? { mainEntity: opts.mainEntity } : {}),
    inLanguage: "en",
  };
}

/**
 * Meta descriptions have one job: describe the page in the snippet a search result
 * shows. Google truncates around 155–160 characters, so a description that starts
 * with a paper abstract's first sentence — often 300 characters on its own — gets
 * its distinguishing half cut off. This keeps the opening and ends on a word
 * boundary instead of mid-word.
 *
 * The ellipsis is deliberate: it says the text continues rather than pretending the
 * sentence ended there.
 */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max - 30 ? lastSpace : max).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Titles for writing posts.
 *
 * The byline suffix is only appended where it still fits the width search results
 * display. Long post titles are editorial decisions made in the writeups repository
 * and are not rewritten here; between an 82-character title and a 106-character one
 * that shows the first 60 characters of each, the shorter one is the better snippet.
 */
export function postTitle(title: string): string {
  const withByline = `${title} — Sushant Poudel`;
  return withByline.length <= 64 ? withByline : title;
}
