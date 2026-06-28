"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Code2, LogOut, LayoutDashboard, User, Menu, X, Bell, Clock, Settings } from "lucide-react";
import { getDueProblems } from "@/actions/problem";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dueProblems, setDueProblems] = useState<any[]>([]);

  const fetchDueProblems = async () => {
    if (session?.user) {
        const problems = await getDueProblems();
        setDueProblems(problems);
    }
  };

  useEffect(() => {
     fetchDueProblems();

     // Listen for review updates
     window.addEventListener("problemReviewed", fetchDueProblems);
     return () => window.removeEventListener("problemReviewed", fetchDueProblems);
  }, [session]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", { 
        day: '2-digit', 
        month: 'short'
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 transition group-hover:bg-blue-500/30 group-hover:text-blue-300">
            <Code2 size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90 group-hover:text-white">
            CodeVault
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-4">
          {session ? (
            <>
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              
              <div className="h-6 w-px bg-white/10"></div>

              {/* Notifications */}
              <div className="relative group cursor-pointer">
                  <div className="p-2 text-gray-400 group-hover:text-white transition">
                      <Bell size={20} />
                  </div>
                  {dueProblems.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-black">
                          {dueProblems.length}
                      </span>
                  )}
                  {dueProblems.length > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-72 max-h-96 overflow-y-auto rounded-xl bg-[#0a0a0a] border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="p-3 border-b border-white/5">
                              <p className="text-xs font-medium text-gray-400">Due for Review</p>
                          </div>
                          <div className="py-2">
                             {dueProblems.map((p) => (
                                 <Link 
                                    key={p._id} 
                                    href={`/dashboard?viewProblem=${p._id}`}
                                    className="block px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                                 >
                                     <p className="text-sm font-medium text-white line-clamp-1">{p.title}</p>
                                     <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                         <Clock size={10} /> Due: {formatDate(p.nextReviewDate)}
                                     </p>
                                 </Link>
                             ))}
                          </div>
                      </div>
                  )}
              </div>

              <div className="h-6 w-px bg-white/10"></div>

              <div className="flex items-center gap-3">
                <Link href="/profile" className="text-right group-hover:opacity-80 transition">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                      {session.user?.name}
                      <Settings size={14} className="text-gray-400" />
                  </p>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-lg bg-white/5 p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0a0a0a] animate-in slide-in-from-top-2">
          <div className="space-y-1 px-4 py-4">
            {/* Mobile Notifications */}
            {session && dueProblems.length > 0 && (
                <div className="mb-4 pb-4 border-b border-white/5">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Bell size={14} />
                        Due for Review
                        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{dueProblems.length}</span>
                    </div>
                    {dueProblems.map((p) => (
                        <Link 
                            key={p._id} 
                            href={`/dashboard?viewProblem=${p._id}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium truncate">{p.title}</span>
                                <span className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                                    <Clock size={10} /> Due: {formatDate(p.nextReviewDate)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {session ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-400 border-b border-white/5 mb-2">
                  Signed in as <span className="text-white font-medium">{session.user?.name}</span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                  <Settings size={18} />
                  Profile Settings
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-blue-500 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}


    </nav>
  );
}
