import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import LanguageOnboardingModal from "@/components/LanguageOnboardingModal";
import AppBackground from "@/components/AppBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeVault",
    template: "%s | CodeVault"
  },
  description: "The only spaced-repetition platform designed for LeetCode. Master patterns like Sliding Window, Two Pointers, and DP with a system that guarantees retention.",
  keywords: ["leetcode", "spaced repetition", "coding interview", "algorithms", "data structures", "software engineering"],
  authors: [{ name: "Soham Sahare", url: "https://sohamsahare.vercel.app/" }],
  creator: "Soham Sahare",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://code-vault.vercel.app",
    title: "CodeVault",
    description: "Stop grinding blindly. Start mastering patterns with guaranteed retention.",
    siteName: "CodeVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeVault",
    description: "The only spaced-repetition platform designed for LeetCode.",
    creator: "@sohamsahare",
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-white`}
      >
        <AppBackground />
        <Providers>
          <Navbar />
          <div className="pt-16">
            {children}
          </div>
          <Toaster position="bottom-right" theme="dark" richColors />
          <LanguageOnboardingModal />
        </Providers>
      </body>
    </html>
  );
}
