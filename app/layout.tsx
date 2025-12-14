import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import LanguageOnboardingModal from "@/components/LanguageOnboardingModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Code Vault",
  description: "Track your coding journey with spaced repetition.",
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
