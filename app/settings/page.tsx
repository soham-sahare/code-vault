"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { Settings, User, Mail, Globe, Lock, ShieldCheck, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState("Python");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [username, setUsername] = useState("hunter");
  const [email, setEmail] = useState("hunter@codevault.dev");
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    const storedLang = localStorage.getItem("defaultLanguage") || "Python";
    setDefaultLanguage(storedLang);
    const storedProfile = localStorage.getItem("isPublicProfile") === "true";
    setIsPublicProfile(storedProfile);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("defaultLanguage", defaultLanguage);
    localStorage.setItem("isPublicProfile", isPublicProfile ? "true" : "false");
    
    setSaveStatus("Saved successfully!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-3xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="font-sans text-xs text-muted mt-1">Configure default language and profile sharing attributes</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-8 font-sans text-xs">
          
          {/* Card 1: Practice Preferences */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4 overflow-visible relative">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Practice Preferences
            </h2>
            
            {/* Custom language selector dropdown */}
            <div className="relative text-left max-w-md">
              <label className="block font-semibold text-muted mb-2 uppercase tracking-wide text-[10px] font-sans">
                Default Programming Language
              </label>
              
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold flex items-center justify-between cursor-pointer text-xs"
              >
                <span className="font-sans font-bold text-xs">{defaultLanguage}</span>
                <svg className={`w-4 h-4 text-muted transition-transform ${isLangDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLangDropdownOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-20 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden font-semibold max-h-48 overflow-y-auto"
                    >
                      {["Python", "C++", "Java", "JavaScript", "TypeScript", "Go", "Rust"].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setDefaultLanguage(lang);
                            setIsLangDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-surface-2 flex items-center justify-between transition-colors cursor-pointer text-xs"
                        >
                          <span>{lang}</span>
                          {defaultLanguage === lang && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <p className="text-[10px] text-muted mt-1.5">This language will be pre-selected when creating new solution approaches.</p>
            </div>
          </div>

          {/* Card 2: User Profile Details */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Profile Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-muted mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none text-foreground font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Sharing Security settings */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Public Profiles & Visibility
            </h2>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/40">
              <div className="space-y-0.5">
                <span className="block font-bold text-foreground">Public Profile Page</span>
                <span className="text-[10px] text-muted">Make your solved challenges list accessible to anyone via direct link.</span>
              </div>
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => setIsPublicProfile(e.target.checked)}
                className="w-4.5 h-4.5 accent-primary cursor-pointer"
              />
            </div>
            {isPublicProfile && (
              <div className="p-3 bg-surface-2/30 rounded-xl border border-border/80 text-[10px] text-muted">
                Your public profile URL: <span className="text-primary font-bold">{origin}/u/{username}</span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-sans font-bold text-xs shadow-md shadow-primary/10 cursor-pointer"
            >
              Save Settings
            </motion.button>
            <AnimatePresence>
              {saveStatus && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-bold text-emerald-500"
                >
                  {saveStatus}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

        </form>

      </main>

    </div>
  );
}
