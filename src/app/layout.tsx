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
  icons: {
    icon: "/images/profile pciture.jpg",
    shortcut: "/images/profile pciture.jpg",
    apple: "/images/profile pciture.jpg",
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