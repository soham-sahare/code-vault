"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import { Settings, User, Globe, ShieldCheck, Check, Sun, Moon, Trash2, AlertTriangle, Loader2, Download, Upload, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile, updateUserProfile, deleteUserAccount, exportUserData, importUserData } from "@/lib/actions";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";
import { signOut } from "next-auth/react";

import { useTheme } from "next-themes";
import Link from "next/link";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("Python");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  // Import / Export states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Account deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const user = await getUserProfile();
        if (user) {
          setUserProfile(user);
          setDefaultLanguage(user.defaultLanguage);
          setUsername(user.username || "");
          setEmail(user.email);
          setIsPublicProfile(user.isPublicProfile);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        username: username || undefined,
        defaultLanguage,
        isPublicProfile,
      });
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error("Error updating settings:", err);
      setSaveStatus(err.message || "Failed to save settings.");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codevault-backup-${username || "user"}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImportStatus({ message: "Backup downloaded successfully!", type: "success" });
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      console.error("Export failed:", err);
      setImportStatus({ message: "Failed to export vault data.", type: "error" });
      setTimeout(() => setImportStatus(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await importUserData(json);
      setImportStatus({ message: `Successfully imported ${res.count} problems!`, type: "success" });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      console.error("Import failed:", err);
      setImportStatus({
        message: err.message || "Failed to import JSON file. Please ensure it is a valid CodeVault export.",
        type: "error",
      });
      setTimeout(() => setImportStatus(null), 5000);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-sans font-semibold text-xs text-muted">Retrieving user profile...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-3xl mx-auto w-full">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
              <Settings className="w-8 h-8 text-primary" />
              Settings
            </h1>
            <p className="font-sans text-xs text-muted mt-1">Configure default language and profile sharing attributes</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Icon */}
            {themeMounted && (
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={resolvedTheme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5 text-accent" /> : <Moon className="w-4.5 h-4.5 text-primary" />}
              </button>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar Circle with Initials & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-extrabold text-xs text-primary hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm select-none"
              >
                {getInitials(userProfile)}
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-48 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 font-sans text-xs flex flex-col gap-1"
                    >
                      <span className="px-3 py-2 text-muted font-bold text-[10px] uppercase tracking-wide border-b border-border/40 mb-1">
                        Options
                      </span>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="px-3 py-2.5 rounded-xl hover:bg-surface-2 text-foreground font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        Log out
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
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
                  Email Address (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2/60 border border-border text-muted font-semibold cursor-not-allowed"
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
            {isPublicProfile && username && (
              <div className="p-3 bg-surface-2/30 rounded-xl border border-border/80 text-[10px] text-muted">
                Your public profile URL: <span className="text-primary font-bold">{origin}/u/{username}</span>
              </div>
            )}
          </div>

          {/* Card 4: Data Backup & Portability (Import / Export) */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Backup & Portability
            </h2>
            <p className="text-[11px] text-muted">
              Export your entire problem vault, solution code, and notes as a portable JSON backup, or restore problems from a previous export.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export Button */}
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-2 hover:bg-primary/10 border border-border hover:border-primary/30 text-foreground hover:text-primary font-sans font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Exporting Vault...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-primary" />
                    Export JSON Backup
                  </>
                )}
              </button>

              {/* Import Button */}
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-surface-2 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/30 text-foreground hover:text-emerald-400 font-sans font-bold text-xs transition-all cursor-pointer">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Importing Data...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Import JSON Backup
                  </>
                )}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Import Status Alert */}
            <AnimatePresence>
              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    importStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}
                >
                  {importStatus.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 5: Danger Zone */}
          <div className="p-6 rounded-3xl bg-surface border border-rose-500/20 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-rose-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Danger Zone
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15">
              <div className="space-y-1">
                <span className="block font-bold text-foreground text-xs">Delete CodeVault Account</span>
                <p className="text-[11px] text-muted leading-relaxed">
                  Permanently delete your account, saved problems, solution code, notes, reminders, and practice sheets. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteError("");
                  setIsDeleteModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 font-sans font-bold text-xs transition-all cursor-pointer shrink-0"
              >
                Delete Account
              </button>
            </div>
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

      {/* ===== DELETE ACCOUNT CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-rose-500/20 shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-rose-500" />

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-foreground">
                    Delete Account Permanently?
                  </h3>
                  <p className="font-sans text-xs text-muted mt-0.5">
                    This will wipe all your vault data forever.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-rose-400 font-sans text-xs leading-relaxed space-y-1.5">
                <p className="font-bold text-foreground">The following will be permanently erased:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted">
                  <li>All saved problems and custom solutions</li>
                  <li>All personal and solution notes</li>
                  <li>All spaced repetition schedules & reminders</li>
                  <li>All custom practice sheets and analytics</li>
                </ul>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center font-sans">
                  {deleteError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-sans font-semibold text-[11px] text-muted uppercase tracking-wide">
                  To confirm, type <span className="font-bold text-rose-500 lowercase">i want to delete</span> below:
                </label>
                <input
                  type="text"
                  placeholder="i want to delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-rose-500/50 focus:outline-none font-sans text-xs text-foreground placeholder:text-muted/50 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-border hover:bg-surface-2 text-foreground font-sans font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    deleteConfirmText.trim().toLowerCase() !== "i want to delete" &&
                    deleteConfirmText.trim().toLowerCase() !== "delete my account" ||
                    isDeleting
                  }
                  onClick={async () => {
                    setIsDeleting(true);
                    setDeleteError("");
                    try {
                      await deleteUserAccount();
                      signOut({ callbackUrl: "/signup" });
                    } catch (err: any) {
                      console.error("Account deletion failed:", err);
                      setDeleteError(err.message || "Failed to delete account. Please try again.");
                      setIsDeleting(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/20 text-white disabled:text-rose-500/40 font-sans font-bold text-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Everything"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
