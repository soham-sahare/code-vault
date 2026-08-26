"use client";

import Link from "next/link";
import { ArrowRight, Check, AlertCircle, Info, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { checkAuthSession } from "@/lib/actions";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    state: "idle" | "checking" | "available" | "taken" | "invalid";
    message?: string;
  }>({ state: "idle" });
  const router = useRouter();

  // Debounced live username availability check
  useEffect(() => {
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) {
      setUsernameStatus({ state: "idle" });
      return;
    }

    if (cleanUsername.length < 2) {
      setUsernameStatus({
        state: "invalid",
        message: "Username must be at least 2 characters",
      });
      return;
    }

    setUsernameStatus({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(cleanUsername)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({ state: "available", message: "Username is available" });
        } else {
          setUsernameStatus({
            state: "taken",
            message: data.reason || "Username is already taken",
          });
        }
      } catch (err) {
        setUsernameStatus({ state: "idle" });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [username]);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "error" }[]>([]);
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  useEffect(() => {
    checkAuthSession().then((res) => {
      if (res && res.signedIn) {
        router.replace("/dashboard");
      }
    }).catch(console.error);
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          email: email.trim(),
          password
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto login after sign up with chosen username or email
      const loginRes = await signIn("credentials", {
        email: cleanUsername || email.trim(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Account created, but error signing in. Please log in manually.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground dots-pattern">
      
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none blur-[100px]">
        <div className="w-[300px] h-[300px] bg-primary rounded-full" />
      </div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-surface border border-border shadow-xl relative overflow-hidden z-10"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 group mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-md">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 17L2 12l4-5M18 7l4 5-4 5" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                <line x1="12" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">CodeVault</span>
          </Link>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-foreground">Create your vault</h2>
          <p className="font-sans text-xs text-muted mt-2">Start your journey to long-term memory</p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center font-sans">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form className="mt-8 space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="block font-sans font-semibold text-xs text-muted mb-2 uppercase tracking-wide">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="hunter"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className={`w-full px-4 py-3 rounded-xl bg-surface-2 border focus:outline-none font-sans text-sm text-foreground transition-all placeholder:text-muted/60 ${
                  usernameStatus.state === "available"
                    ? "border-emerald-500/50 focus:border-emerald-500"
                    : usernameStatus.state === "taken" || usernameStatus.state === "invalid"
                    ? "border-rose-500/50 focus:border-rose-500"
                    : "border-border focus:border-primary/50"
                }`}
              />
              {usernameStatus.state === "checking" && (
                <div className="absolute right-3.5 top-3.5">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>
            {usernameStatus.state !== "idle" && (
              <div className="flex items-center gap-1.5 mt-1.5 font-sans text-[11px]">
                {usernameStatus.state === "checking" && (
                  <span className="text-muted flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Checking availability...
                  </span>
                )}
                {usernameStatus.state === "available" && (
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {usernameStatus.message}
                  </span>
                )}
                {usernameStatus.state === "taken" && (
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />
                    {usernameStatus.message}
                  </span>
                )}
                {usernameStatus.state === "invalid" && (
                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {usernameStatus.message}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-sans font-semibold text-xs text-muted mb-2 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="hunter@codevault.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-sm text-foreground transition-all placeholder:text-muted/60"
            />
          </div>

          <div>
            <label className="block font-sans font-semibold text-xs text-muted mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-sm text-foreground transition-all placeholder:text-muted/60"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative inline-flex items-center justify-center gap-1.5 font-sans font-bold text-sm bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Signing Up..." : "Sign Up"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>



        {/* Footer Link */}
        <p className="font-sans text-xs text-muted text-center mt-8">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:opacity-90">
            Sign in
          </Link>
        </p>

      </motion.div>

      {/* ===== PREMIUM TOAST NOTIFICATION CONTAINER ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md pointer-events-auto ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : toast.type === "error"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  : "bg-primary/10 border-primary/20 text-primary"
              }`}
            >
              {toast.type === "success" && <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              {toast.type === "info" && <Info className="w-4 h-4 shrink-0 text-primary" />}
              <span className="font-sans font-bold text-xs">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
