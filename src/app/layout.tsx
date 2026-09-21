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

export const metadata: Metadata = {
  title: "Sushant Poudel — AI | Security | Engineering",
  description: "Portfolio of Sushant Poudel — AI Researcher, Full-Stack Engineer, Cybersecurity Specialist from Nepal. Aspire Leaders Finalist, 2x Hult Prize Runner-Up.",
  // Small derivatives: the source photo is 7 MB, which as a favicon is a
  // download nobody asked for. See scripts/optimize-images.py.
  icons: {
    icon: "/images/optimized/icon-192.jpg",
    shortcut: "/images/optimized/icon-192.jpg",
    apple: "/images/optimized/icon-192.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}