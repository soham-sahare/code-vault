
"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/auth";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Select } from "./ui/SelectUtils";
import { LANGUAGES } from "@/lib/constants";
import { Loader2, Code2 } from "lucide-react";

export default function LanguageOnboardingModal() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);

  // If no session or user already has a default language, don't show
  if (!session?.user || (session.user as any).defaultLanguage || !isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!language) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append("defaultLanguage", language);
    
    // We only update the language field, other fields are optional or handled safely in backend if missing
    // But updateProfile usually expects all fields or just updates what is sent. 
    // Wait, updateProfile normally checks for existing password if changing password, but here we are just updating a field that doesn't require auth verification strictly on its own if valid session. 
    // Looking at my previous edit to updateProfile: it updates optional fields if present.

    const res = await updateProfile(formData);
    
    if (res.error) {
        toast.error(res.error);
        setLoading(false);
    } else {
        await update({ defaultLanguage: language });
        toast.success("Preference saved!");
        setIsOpen(false);
    }
  };

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
            onClick={handleSubmit} 
            disabled={!language || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
        >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Get Started
        </button>

      </div>
    </div>
  );
}
