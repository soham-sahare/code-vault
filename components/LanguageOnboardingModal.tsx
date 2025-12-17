
"use client";

import { useState, useEffect } from "react";
import { updateProfile } from "@/actions/auth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Select } from "./ui/SelectUtils";
import { LANGUAGES } from "@/lib/constants";
import { Loader2, Code2, Keyboard, Command, Plus, ArrowRight } from "lucide-react";

export default function LanguageOnboardingModal() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState<'language' | 'shortcuts'>('language');
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for test mode via URL parameter
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setForceShow(params.get('onboarding') === 'true');
      
      // Check if we should show shortcuts step (from localStorage)
      const savedStep = localStorage.getItem('onboardingStep');
      if (savedStep === 'shortcuts') {
        setStep('shortcuts');
      }
    }
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // If no session or user already has a default language, don't show (unless forced)
  // But if we're on shortcuts step, always show
  const shouldShow = step === 'shortcuts' || !session?.user || ((session.user as any).defaultLanguage && !forceShow) || !isOpen;
  if (!session?.user || ((session.user as any).defaultLanguage && !forceShow && step !== 'shortcuts') || !isOpen) {
    return null;
  }

  const handleLanguageSubmit = async () => {
    if (!language) return;
    
    // If in test mode, skip the actual update and just show shortcuts
    if (forceShow) {
      setStep('shortcuts');
      return;
    }

    setLoading(true);
    
    // Save step to localStorage before updating profile
    localStorage.setItem('onboardingStep', 'shortcuts');
    
    const formData = new FormData();
    formData.append("defaultLanguage", language);

    const res = await updateProfile(formData);
    
    if (res.error) {
        toast.error(res.error);
        setLoading(false);
        localStorage.removeItem('onboardingStep');
    } else {
        await update({ defaultLanguage: language });
        setLoading(false);
        // Move to shortcuts step
        setStep('shortcuts');
    }
  };

  const handleFinish = () => {
    // Clear localStorage
    localStorage.removeItem('onboardingStep');
    toast.success("You're all set! Happy coding! 🚀");
    setIsOpen(false);
  };

  if (step === 'language') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
        <div className="glass-modal w-full max-w-md rounded-2xl p-8 space-y-6 text-center border border-blue-500/30 shadow-2xl shadow-blue-500/10">
          
          <div className="mx-auto h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 animate-[bounce_2s_infinite]">
              <Code2 size={32} />
          </div>

          <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Welcome to CodeVault!</h2>
              <p className="text-gray-400">To get started, please select your primary programming language. This will be the default for your solutions.</p>
              <p className="text-gray-400">You can always change this later in your profile.</p>
          </div>

          <div className="text-left">
             <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Language</label>
             <Select 
               options={LANGUAGES}
               value={language}
               onChange={setLanguage}
               placeholder="Select a language"
             />
          </div>

          <button 
              onClick={handleLanguageSubmit} 
              disabled={!language || loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
          >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Continue
              <ArrowRight size={18} />
          </button>

        </div>
      </div>
    );
  }

  // Shortcuts step
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-500">
      <div className="glass-modal w-full max-w-lg rounded-2xl p-8 space-y-6 border border-blue-500/30 shadow-2xl shadow-blue-500/10">
        
        <div className="mx-auto h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
            <Keyboard size={32} />
        </div>

        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white">⚡ Keyboard Shortcuts</h2>
            <p className="text-gray-400">Navigate faster with these powerful shortcuts</p>
        </div>

        <div className="space-y-4 text-left">
          {/* Command Palette */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Command size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Command Palette</h3>
                <p className="text-sm text-gray-400">Quick access to everything</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">⌘</kbd>
              <span className="text-gray-500">+</span>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">K</kbd>
              <span className="text-gray-400 text-sm ml-2">or</span>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">Ctrl</kbd>
              <span className="text-gray-500">+</span>
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">K</kbd>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold text-white mb-3">Quick Navigation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Go to Dashboard</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">G</kbd>
                  <span className="text-gray-500 text-xs">then</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">D</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Go to Statistics</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">G</kbd>
                  <span className="text-gray-500 text-xs">then</span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">S</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Plus size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Add New Problem</h3>
                <p className="text-sm text-gray-400">From anywhere</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white font-mono">N</kbd>
              <span className="text-gray-400 text-sm">on Dashboard</span>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
            <p className="text-sm text-blue-300 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded text-xs font-mono mx-1">?</kbd> anytime to see all shortcuts
            </p>
          </div>
        </div>

        <button 
            onClick={handleFinish} 
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
        >
            Got it! Let's start coding
            <ArrowRight size={18} />
        </button>

      </div>
    </div>
  );
}
