"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/shell/Sidebar";
import {
  Settings,
  User,
  Globe,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Database,
  Lock,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  exportUserData,
  importUserData,
} from "@/lib/actions";
import NotificationBell from "@/components/notifications/NotificationBell";
import { getInitials } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/Skeleton";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("Python");
  const [initialLanguage, setInitialLanguage] = useState("Python");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [initialPublicProfile, setInitialPublicProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [origin, setOrigin] = useState("");

  // Live username availability check state
  const [usernameStatus, setUsernameStatus] = useState<{
    state: "idle" | "checking" | "available" | "taken" | "current" | "invalid";
    message?: string;
  }>({ state: "idle" });

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
          const uName = user.name || "";
          setName(uName);
          setInitialName(uName);
          const lang = user.defaultLanguage || "Python";
          setDefaultLanguage(lang);
          setInitialLanguage(lang);
          const usr = user.username || "";
          setUsername(usr);
          setInitialUsername(usr);
          setEmail(user.email || "");
          const pub = user.isPublicProfile || false;
          setIsPublicProfile(pub);
          setInitialPublicProfile(pub);
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

  // Debounced live username availability check
  useEffect(() => {
    if (loading) return;

    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus({ state: "invalid", message: "Username cannot be empty." });
      return;
    }

    if (clean === initialUsername.toLowerCase()) {
      setUsernameStatus({ state: "current", message: "Your current username" });
      return;
    }

    if (clean.length < 2 || clean.length > 30) {
      setUsernameStatus({
        state: "invalid",
        message: "Username must be between 2 and 30 characters.",
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        state: "invalid",
        message: "Only lowercase letters, numbers, and underscores are allowed.",
      });
      return;
    }

    setUsernameStatus({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.available) {
          if (data.isCurrent) {
            setUsernameStatus({ state: "current", message: "Your current username" });
          } else {
            setUsernameStatus({ state: "available", message: "Username is available" });
          }
        } else {
          setUsernameStatus({
            state: "taken",
            message: data.reason || "This username is already taken.",
          });
        }
      } catch (err) {
        setUsernameStatus({ state: "idle" });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [username, initialUsername, loading]);

  const hasChanges =
    username.trim().toLowerCase() !== initialUsername.toLowerCase() ||
    defaultLanguage !== initialLanguage ||
    isPublicProfile !== initialPublicProfile ||
    name.trim() !== initialName;

  const isSaveDisabled =
    !hasChanges ||
    isSaving ||
    usernameStatus.state === "taken" ||
    usernameStatus.state === "invalid" ||
    usernameStatus.state === "checking";

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaveDisabled) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const cleanUsername = username.trim().toLowerCase();
      await updateUserProfile({
        name: name.trim() || undefined,
        username: cleanUsername,
        defaultLanguage,
        isPublicProfile,
      });
      setInitialUsername(cleanUsername);
      setInitialLanguage(defaultLanguage);
      setInitialPublicProfile(isPublicProfile);
      setInitialName(name.trim());
      setUserProfile((prev: any) => ({
        ...prev,
        name: name.trim(),
        username: cleanUsername,
        defaultLanguage,
        isPublicProfile,
      }));
      setSaveStatus({ message: "Settings saved successfully!", type: "success" });
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      console.error("Error updating settings:", err);
      setSaveStatus({
        message: err.message || "Failed to save settings.",
        type: "error",
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteUserAccount();
      signOut({ callbackUrl: "/login" });
    } catch (err: any) {
      console.error("Delete account error:", err);
      setDeleteError(err.message || "Failed to delete account.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-y-auto max-w-4xl mx-auto w-full">
          {/* Header with Real Title & Subtitle */}
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5">
                <Settings className="w-8 h-8 text-primary" />
                Settings
              </h1>
              <p className="font-sans text-xs text-muted mt-1">
                Manage your account preferences, themes, and data portability
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile & General Settings Skeleton Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-36 rounded-lg" />
                  <Skeleton className="h-3.5 w-48 rounded-md" />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border/80">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Data Portability Skeleton Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3.5 w-72 rounded-md" />
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-10 w-36 rounded-xl" />
                <Skeleton className="h-10 w-36 rounded-xl" />
              </div>
            </div>
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
            <p className="font-sans text-xs text-muted mt-1">
              Configure profile identity, preferences, and data portability
            </p>
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
                {resolvedTheme === "dark" ? (
                  <Sun className="w-4.5 h-4.5 text-accent" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-primary" />
                )}
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
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          signOut({ callbackUrl: "/login" });
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        Log out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-8 font-sans text-xs">
          {/* Card 1: User Profile Details */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-5">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Profile Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username with Live Availability Checker */}
              <div>
                <label className="block font-semibold text-muted mb-2 uppercase tracking-wide text-[10px]">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border font-semibold text-foreground transition-all focus:outline-none ${
                      usernameStatus.state === "available"
                        ? "border-emerald-500/50 focus:border-emerald-500"
                        : usernameStatus.state === "taken" || usernameStatus.state === "invalid"
                        ? "border-rose-500/50 focus:border-rose-500"
                        : "border-border focus:border-primary/50"
                    }`}
                  />
                  {usernameStatus.state === "checking" && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                {usernameStatus.state !== "idle" && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium">
                    {usernameStatus.state === "checking" && (
                      <span className="text-muted flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        Checking availability...
                      </span>
                    )}
                    {usernameStatus.state === "available" && (
                      <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        {usernameStatus.message}
                      </span>
                    )}
                    {usernameStatus.state === "current" && (
                      <span className="text-muted flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-muted" />
                        {usernameStatus.message}
                      </span>
                    )}
                    {usernameStatus.state === "taken" && (
                      <span className="text-rose-500 flex items-center gap-1 font-semibold">
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        {usernameStatus.message}
                      </span>
                    )}
                    {usernameStatus.state === "invalid" && (
                      <span className="text-amber-500 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        {usernameStatus.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Email Address (Strictly Immutable) */}
              <div>
                <label className="block font-semibold text-muted mb-2 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                  Email Address
                  <span className="inline-flex items-center gap-1 text-[9px] text-muted/80 bg-surface px-1.5 py-0.5 rounded border border-border">
                    <Lock className="w-2.5 h-2.5" />
                    Immutable
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2/40 border border-border/80 text-muted font-semibold cursor-not-allowed select-none opacity-80"
                  />
                  <div className="absolute right-3 top-3 text-muted/60 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-muted mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted/60" />
                  Email is permanently tied to your account and cannot be modified.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Practice Preferences */}
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
                <svg
                  className={`w-4 h-4 text-muted transition-transform ${
                    isLangDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
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
              <p className="text-[10px] text-muted mt-1.5">
                This language will be pre-selected when creating new solution approaches.
              </p>
            </div>
          </div>

          {/* Card 3: Public Profiles & Visibility */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Public Profiles & Visibility
            </h2>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-2/40">
              <div className="space-y-0.5">
                <span className="block font-bold text-foreground">Public Profile Page</span>
                <span className="text-[10px] text-muted">
                  Make your solved challenges list accessible to anyone via direct link.
                </span>
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
                Your public profile URL:{" "}
                <span className="text-primary font-bold">
                  {origin}/u/{username}
                </span>
              </div>
            )}
          </div>

          {/* ===== UNIFIED SAVE BUTTON (Positioned directly after Public Profiles & Visibility) ===== */}
          <div className="flex items-center gap-4 pt-2">
            <motion.button
              whileTap={!isSaveDisabled ? { scale: 0.98 } : undefined}
              type="submit"
              disabled={isSaveDisabled}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-sans font-bold text-xs transition-all ${
                !isSaveDisabled
                  ? "bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 hover:shadow-lg active:scale-98 cursor-pointer"
                  : "bg-surface-2 border border-border text-muted/50 opacity-50 cursor-not-allowed select-none"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${!isSaveDisabled ? "text-white" : "text-muted/50"}`} />
                  Save Changes
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {saveStatus && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    saveStatus.type === "success" ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {saveStatus.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                  {saveStatus.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 4: Data Backup & Portability (Import / Export) */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Backup & Portability
            </h2>
            <p className="text-[11px] text-muted">
              Export your entire problem vault, solution code, and notes as a portable JSON backup, or
              restore problems from a previous export.
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
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    importStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}
                >
                  {importStatus.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
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
                  Permanently delete your account, saved problems, solution code, notes, reminders, and
                  practice sheets. This action is irreversible.
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
                  <li>All spaced repetition reminders and revision history</li>
                  <li>All practice sheets and curation links</li>
                  <li>All personal notes and analytical metrics</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block font-sans font-semibold text-xs text-muted">
                  Type <span className="font-bold text-rose-500">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-rose-500/30 focus:border-rose-500 focus:outline-none font-sans text-xs text-foreground transition-all placeholder:text-muted/40 font-bold"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-sans text-xs font-semibold">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-2/80 text-foreground font-sans font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-sans font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
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
