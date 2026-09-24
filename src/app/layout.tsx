import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = "https://sushantpoudel2028.com.np";
const DESCRIPTION =
  "Portfolio of Sushant Poudel — AI Researcher, Full-Stack Engineer, Cybersecurity Specialist from Nepal. Aspire Leaders Finalist, 2x Hult Prize Runner-Up.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // So browsers, feed readers and crawlers can find the feed. Without the
  // declaration the file exists but nothing advertises it.
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Sushant Poudel — Writing" }],
    },
  },
  title: "Sushant Poudel — AI | Security | Engineering",
  description: DESCRIPTION,
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
    url: SITE,
    siteName: "Sushant Poudel",
    title: "Sushant Poudel — AI | Security | Engineering",
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
    title: "Sushant Poudel — AI | Security | Engineering",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

// Structured data so search engines can read the credentials on the page as
// facts about a person rather than as prose. Every field here is stated on the
// page itself.
const PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sushant Poudel",
  url: SITE,
  image: `${SITE}/og.png`,
  jobTitle: "AI Security Engineer",
  description:
    "AI security engineer working on agent failure modes, with a merged security patch in google/go-github and memory-safety issues filed against google/s2geometry.",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Nepal Engineering College",
  },
  worksFor: { "@type": "Organization", name: "Atmos SoftTech" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bhaktapur",
    addressCountry: "NP",
  },
  sameAs: [
    "https://github.com/sushant-me",
    "https://linkedin.com/in/sushant-poudel2028",
  ],
  knowsAbout: [
    "AI security",
    "Cybersecurity",
    "Reverse engineering",
    "Full-stack engineering",
    "Flutter",
    "Penetration testing",
  ],
  email: "mailto:sushant.poudel2028@gmail.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
        />
        {children}
      </body>
    </html>
  );
}