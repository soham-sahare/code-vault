"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Code2, Database, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative isolate pt-14 flex-1 flex flex-col justify-center">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-8 flex justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                  New: Detailed Analytics & Progress Tracking <span className="font-semibold text-blue-400"></span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-300">
                Master Data Structures <br/> & Algorithms.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-400">
                Stop forgetting what you learn. Code Vault uses <strong>Spaced Repetition</strong> to schedule reviews exactly when you need them, helping you retain 100% of your coding knowledge.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="group rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
                  >
                   Go to Dashboard <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                ) : (
                  <>
                  <Link
                    href="/signup"
                    className="group rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
                  >
                    Get Started Free <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link href="/login" className="text-sm font-semibold leading-6 text-white hover:text-blue-400 transition">
                    Log in <span aria-hidden="true">→</span>
                  </Link>
                  </>
                )}
              </div>
            </div>
            
            {/* Features Grid */}
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                <div className="flex flex-col items-start">
                  <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 mb-4">
                    <Database className="h-6 w-6 text-blue-400" aria-hidden="true" />
                  </div>
                  <dt className="text-base font-semibold leading-7 text-white">Centralized Vault</dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">Store every optimal solution, brute force approach, and intuition note in one searchable, secure database.</p>
                  </dd>
                </div>
                <div className="flex flex-col items-start">
                  <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 mb-4">
                    <Zap className="h-6 w-6 text-purple-400" aria-hidden="true" />
                  </div>
                  <dt className="text-base font-semibold leading-7 text-white">Spaced Repetition</dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">Automated review schedules (3, 7, 30 days) ensure you never blank out in an interview again.</p>
                  </dd>
                </div>
                <div className="flex flex-col items-start">
                  <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 mb-4">
                    <BarChart3 className="h-6 w-6 text-pink-400" aria-hidden="true" />
                  </div>
                  <dt className="text-base font-semibold leading-7 text-white">Detailed Analytics</dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">Visualize your mastery curve. Track progress by topic, difficulty, and tag with beautiful charts.</p>
                  </dd>
                </div>
                 <div className="flex flex-col items-start">
                  <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10 mb-4">
                    <Code2 className="h-6 w-6 text-green-400" aria-hidden="true" />
                  </div>
                  <dt className="text-base font-semibold leading-7 text-white">Multi-Language</dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-400">
                    <p className="flex-auto">First-class support for Python, Java, C++, JS, and more with beautiful syntax highlighting.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/20 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Code2 size={20} />
                </div>
                <span className="text-lg font-bold text-white">CodeVault</span>
            </div>
            <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} CodeVault. Built for developers.
            </p>
            <div className="flex gap-6">
                <a href="#" className="text-sm text-gray-400 hover:text-white transition">GitHub</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition">Twitter</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition">Privacy</a>
            </div>
        </div>
      </footer>
    </main>
  );
}
