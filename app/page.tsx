"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Code2, Database, Zap, BarChart3 } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Home() {
  const { data: session } = useSession();

  const codeString = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

  return (
    <main className="flex flex-col min-h-screen relative overflow-hidden">


      {/* Hero Section */}
      <div className="relative isolate pt-14 pb-20 lg:pt-24 flex-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
           <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Column: Text */}
              <div className="mx-auto max-w-2xl lg:ml-0 lg:max-w-none">
                 <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20 bg-blue-400/10 mb-6">
                    <Zap size={16} className="mr-2" />
                    v2.0 Now Available
                 </div>
                 <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-white to-blue-100 pb-2">
                    Your Coding Journey,<br/>
                    <span className="text-blue-500">All in One Place.</span>
                 </h1>
                 <p className="mt-6 text-lg leading-8 text-gray-400">
                    Store every solution, revisit key concepts, and keep your algorithms fresh with intelligent spaced repetition. 
                    CodeVault is your personal repository to <strong>organize</strong>, <strong>review</strong>, and <strong>master</strong> your entire coding journey.
                 </p>
                 <div className="mt-10 flex items-center gap-x-6">
                    {session ? (
                      <Link
                        href="/dashboard"
                        className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
                      >
                        Go to Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/signup"
                        className="rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-black shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all hover:scale-105"
                      >
                        Start for Free
                      </Link>
                    )}
                    <Link href="/login" className="text-sm font-semibold leading-6 text-white hover:text-blue-400 transition flex items-center gap-2">
                        Sign In <ArrowRight size={16} />
                    </Link>
                 </div>

                 {/* Supported Patterns List */}
                 <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-sm text-gray-500 mb-4 font-mono uppercase tracking-wider">Your Knowledge Ecosystem:</p>
                    <div className="flex flex-wrap gap-2">
                        {["Archive Solutions", "Revisit & Revise", "Concept Retention", "Algorithm Repository", "Progress Tracking"].map((item) => (
                    
                           <span key={item} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 font-mono">
                                {item}
                            </span>
                        ))}
                    </div>
                 </div>
              </div>

              {/* Right Column: Code Window */}
              <div className="mt-16 sm:mt-24 lg:mt-0 relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20 blur opacity-40"></div>
                  <div className="relative rounded-xl bg-[#1e1e1e] border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/10">
                      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                          <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                          </div>
                          <div className="ml-4 text-xs text-gray-500 font-mono">two_sum.py</div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <SyntaxHighlighter 
                            language="python" 
                            style={vscDarkPlus}
                            customStyle={{ background: 'transparent', margin: 0, padding: 0 }}
                            showLineNumbers={true}
                            lineNumberStyle={{ minWidth: '2em', paddingRight: '1em', color: '#555' }}
                        >
                            {codeString}
                        </SyntaxHighlighter>
                      </div>
                  </div>
                  
                   {/* Floating Badge */}
                  <div className="absolute -bottom-6 -right-6 glass p-4 rounded-xl border border-white/10 animate-bounce duration-[3000ms]">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                              <Zap size={20} fill="currentColor" />
                          </div>
                          <div>
                              <div className="text-xs text-gray-400">Review Status</div>
                              <div className="text-sm font-bold text-white">Due in 3 Days</div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-black/40 py-24 sm:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
                <h2 className="text-base font-semibold leading-7 text-blue-400">Everything you need</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Your coding knowledge, always accessible</p>
                <p className="mt-6 text-lg leading-8 text-gray-400">Store your entire coding journey in one place and revisit it whenever you need to keep your skills sharp.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition group hover:-translate-y-1 duration-300">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        <Database size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">Centralized Vault</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Store all your coding solutions, notes, and approaches in one place. Your complete coding journey, organized and searchable.</p>
                </div>

                <div className="glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition group hover:-translate-y-1 duration-300">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">Spaced Repetition</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Keep concepts fresh in your mind with smart review scheduling. Revisit problems at optimal intervals to ensure long-term retention.</p>
                </div>

                <div className="glass p-8 rounded-2xl border border-white/5 hover:border-pink-500/30 transition group hover:-translate-y-1 duration-300">
                    <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">Detailed Analytics</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Visualize your progress across topics and patterns. Track which concepts need more practice and celebrate your growth.</p>
                </div>

                <div className="glass p-8 rounded-2xl border border-white/5 hover:border-green-500/30 transition group hover:-translate-y-1 duration-300">
                    <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform">
                        <Code2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">Multi-Language</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Full syntax highlighting support for Javascript, Python, C++, Java, and Go.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <Code2 size={20} />
                </div>
                <span className="text-lg font-bold text-white">CodeVault</span>
            </div>
            <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} CodeVault. Made with <span className="text-red-500">♥</span> by <a href="https://sohamsahare.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition underline decoration-blue-500/30 underline-offset-4">sohamsahare</a>
            </p>
            <div className="flex gap-6">
                <a href="https://github.com/soham-sahare" target="_blank" className="text-sm text-gray-400 hover:text-white transition">GitHub</a>
            </div>
        </div>
      </footer>
    </main>
  );
}
