"use client";

import Link from "next/link";
import { ArrowRight, Check, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { checkAuthSession } from "@/lib/actions";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        showToast("Already signed in!", "info");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      }
    }).catch(console.error);
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto login after sign up
      const loginRes = await signIn("credentials", {
        email,
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
              Username / Name
            </label>
            <input
              type="text"
              required
              placeholder="hunter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-sm text-foreground transition-all placeholder:text-muted/60"
            />
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

        {/* Separator */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-x-0 h-0.5 bg-border/60" />
          <span className="font-sans font-semibold text-[10px] text-muted bg-surface px-3 relative z-10 uppercase tracking-widest">
            Or register with
          </span>
        </div>

        {/* Social Authentication buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-surface-2 font-sans font-semibold text-xs text-foreground cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub
          </button>
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-surface-2 font-sans font-semibold text-xs text-foreground cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.988 0-.746-.08-1.32-.176-1.886H12.24z"/>
            </svg>
            Google
          </button>
        </div>

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
