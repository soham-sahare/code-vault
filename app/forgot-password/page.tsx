"use client";

import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
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
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white shadow-md shadow-[#7C3AED]/30">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 17L2 12l4-5M18 7l4 5-4 5" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                <line x1="12" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight">CodeVault</span>
          </Link>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-foreground">
            {submitted ? "Check your email" : "Reset Password"}
          </h2>
          <p className="font-sans text-xs text-muted mt-2">
            {submitted 
              ? `We have sent a password reset link to ${email}` 
              : "Enter your email address to retrieve your recall cave password"}
          </p>
        </div>

        {/* Form Inputs */}
        {!submitted ? (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block font-sans font-semibold text-xs text-muted mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@codevault.dev"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary/50 focus:outline-none font-sans text-sm text-foreground transition-all placeholder:text-muted/60"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full relative inline-flex items-center justify-center gap-1.5 font-sans font-bold text-sm bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                Send Reset Link
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold leading-relaxed">
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full relative inline-flex items-center justify-center gap-1.5 font-sans font-semibold text-xs text-primary hover:opacity-90 transition-all cursor-pointer"
            >
              Try another email address
            </button>
          </div>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-sans font-semibold text-xs text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

      </motion.div>

    </div>
  );
}
