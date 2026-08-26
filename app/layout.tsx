import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://code-vault.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CodeVault — Master Algorithms & Ace Coding Interviews with Spaced Repetition",
    template: "%s | CodeVault",
  },
  description:
    "CodeVault is the #1 spaced-repetition platform for software engineers to store DSA solutions, track algorithmic patterns, prepare for FAANG interviews, and retain code forever.",
  keywords: [
    "CodeVault",
    "DSA Tracker",
    "LeetCode Tracker",
    "Spaced Repetition Coding",
    "Algorithm Flashcards",
    "FAANG Interview Preparation",
    "Coding Interview Revision",
    "Data Structures and Algorithms",
    "Algorithmic Patterns",
    "Two Pointers",
    "Sliding Window",
    "Dynamic Programming",
    "System Design & DSA",
    "Coding Practice Tracker",
    "Problem Solving Second Brain"
  ],
  authors: [{ name: "Soham Sahare", url: "https://sohamsahare.in" }],
  creator: "Soham Sahare",
  publisher: "CodeVault",
  applicationName: "CodeVault",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "CodeVault — Master Algorithms & Ace Coding Interviews with Spaced Repetition",
    description:
      "Solve it once. Remember it forever. The intelligent spaced-repetition platform for mastering DSA problems, algorithmic patterns, and tech interviews.",
    siteName: "CodeVault",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeVault — Spaced Repetition DSA Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeVault — Master Algorithms & Ace Coding Interviews with Spaced Repetition",
    description:
      "Solve it once. Remember it forever. The intelligent spaced-repetition platform for mastering DSA problems, algorithmic patterns, and tech interviews.",
    images: ["/og-image.png"],
    creator: "@sohamsahare",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        "name": "CodeVault",
        "url": siteUrl,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "description":
          "CodeVault is an intelligent spaced-repetition platform designed for software engineers to catalog LeetCode & DSA problems, track algorithmic patterns, and ace technical interviews.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "author": {
          "@type": "Person",
          "name": "Soham Sahare",
          "url": "https://sohamsahare.in",
        },
        "featureList": [
          "Automated Spaced Repetition Recall Loop (1, 3, 7, 21, 60 days)",
          "Multi-Solution Vault with Complexity Benchmarking (Time & Space)",
          "Pattern & Target Company Analytics (Google, Meta, Amazon, Microsoft, Uber)",
          "Custom Curated Sheets & Revision Reminders",
          "Public Shareable Engineering Problem Vaults"
        ],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "CodeVault",
        "url": siteUrl,
        "logo": `${siteUrl}/android-chrome-512x512.png`,
        "sameAs": [
          "https://github.com/soham-sahare/code-vault",
          "https://sohamsahare.in"
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is CodeVault?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CodeVault is a dedicated second brain for software engineers practicing Data Structures and Algorithms. It combines multi-solution code management with automated spaced repetition reminders to guarantee long-term retention for coding interviews.",
            },
          },
          {
            "@type": "Question",
            "name": "How does spaced repetition work in CodeVault?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CodeVault schedules automatic review intervals (1 day, 3 days, 7 days, 21 days, and 60 days) after you solve a problem, ensuring you retain the algorithmic pattern before interview day.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I tag problems by company and algorithmic pattern?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! CodeVault includes dedicated company tagging (Google, Meta, Amazon, Microsoft, Uber, etc.) and algorithmic pattern tracking (Two Pointers, Sliding Window, Monotonic Stack, Dynamic Programming) with in-depth analytics.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
