import Link from "next/link";

/**
 * The site is seven pages deep and the inner pages used to be reachable only by an
 * in-page anchor on the homepage. A reader who landed on one post from a search
 * result had no path to /hire, and a crawler found the writing only through the
 * sitemap. This is the shared footer navigation: every page carries every section,
 * which also makes the site's internal link graph complete rather than a star with
 * the homepage in the middle.
 *
 * `current` is the path of the page rendering it. The link stays in the list and is
 * marked `aria-current` instead of disappearing: a navigation row that silently
 * changes length is harder to scan than one where your position is marked.
 */
const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/publications", label: "Publications" },
  { href: "/writing", label: "Writing" },
  { href: "/press", label: "Press" },
  { href: "/hire", label: "Hire" },
  { href: "/contact", label: "Contact" },
  { href: "/cv", label: "CV" },
  { href: "/search", label: "Search" },
];

export default function CrossNav({ current }: { current?: string }) {
  return (
    <nav className="xnav" aria-label="Site sections">
      {SECTIONS.map((section) => {
        const isCurrent = section.href === current;
        return (
          <Link
            key={section.href}
            href={section.href}
            className="xnav-link"
            aria-current={isCurrent ? "page" : undefined}
          >
            {section.label}
          </Link>
        );
      })}
      <a className="xnav-link xnav-mail" href="mailto:sushant.poudel2028@gmail.com">
        Email
      </a>
    </nav>
  );
}
