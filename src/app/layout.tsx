import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import JsonLd from "../components/JsonLd";
import { ENTITY_GRAPH, SITE } from "../lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Sushant Poudel is an AI security engineer in Nepal working on agent tool boundaries, LLM evaluation and memory safety. Open to security and engineering roles.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // So browsers, feed readers and crawlers can find the feed. Without the
  // declaration the file exists but nothing advertises it.
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Sushant Poudel — Writing" }],
    },
  },
  // The name leads the title because that is the query this page has to win, and a
  // role after it tells a reader who has never heard the name why they should click.
  title: "Sushant Poudel — AI Security Engineer in Nepal",
  description: DESCRIPTION,
  authors: [{ name: "Sushant Poudel", url: SITE }],
  creator: "Sushant Poudel",
  publisher: "Sushant Poudel",
  category: "technology",
  applicationName: "Sushant Poudel",
  // The site is meant to be indexed everywhere and quoted at length; the site's
  // own copy is the best answer to "who is Sushant Poudel", so the snippet limit
  // is left to the search engine rather than capped here.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Small derivatives: the source photo is 7 MB, which as a favicon is a
  // download nobody asked for. See scripts/optimize-images.py.
  icons: {
    icon: "/images/optimized/icon-192.jpg",
    shortcut: "/images/optimized/icon-192.jpg",
    apple: "/images/optimized/icon-192.jpg",
  },
  // Rendered from the real page design so a shared link unfurls as the site
  // rather than a bare URL.
  openGraph: {
    type: "profile",
    url: `${SITE}/`,
    siteName: "Sushant Poudel",
    title: "Sushant Poudel — AI Security Engineer in Nepal",
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Sushant Poudel — AI security, full-stack and reverse engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sushant Poudel — AI Security Engineer in Nepal",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * One structured-data graph for the whole site.
 *
 * A single `@graph` with stable `@id`s means the Person, the WebSite and the
 * homepage are one entity with cross-references, rather than a fresh Person object
 * on every page that a search engine has to reconcile. Subpages add their own
 * `WebPage`/`Article` nodes and point back at these ids with `isPartOf`, `about` and
 * `author`.
 *
 * Nothing here is inferred. Every field is stated on the site: the name, role,
 * location and known specialisms on the homepage and /about; the awards and
 * education on /about; and the `sameAs` profiles are the same accounts linked from
 * /contact.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">
        <JsonLd data={ENTITY_GRAPH} />
        {children}
      </body>
    </html>
  );
}
