"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/auth";
import { resetUserStats } from "@/actions/problem";
import ConfirmationModal from "./ConfirmationModal";
import { Loader2, User, Lock, Save, AlertCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile updated successfully");
      // Update session if name changed
      const newName = formData.get("name") as string;
      if (newName && session) {
        await update({ name: newName });
      }
      
       const form = document.querySelector("form") as HTMLFormElement;
       if(form) form.reset();
    }
  }

  const handleResetStats = async () => {
      const res = await resetUserStats();
      if ('error' in res) {
          toast.error(res.error || "Failed to reset progress");
      } else {
          toast.success("All progress has been reset.");
          setResetModalOpen(false);
          router.refresh();
      }
  };

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <form action={handleSubmit} className="space-y-6">
          
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 text-gray-500 cursor-not-allowed">
              <User size={18} />
              <span>{session.user?.email}</span>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">Display Name</label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={session.user?.name || ""}
              placeholder="Your name"
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="h-px bg-white/10 my-8"></div>

          {/* Password Change */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock size={18} className="text-blue-400" />
                Change Password
            </h3>
            
            <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium text-gray-300">Current Password</label>
                <input
                type="password"
                name="currentPassword"
                id="currentPassword"
                placeholder="Required to change password"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-300">New Password</label>
                <input
                type="password"
                name="newPassword"
                id="newPassword"
                placeholder="Leave empty to keep current"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>

        </form>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold">Danger Zone</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                  <p className="text-white font-medium">Reset Progress</p>
                  <p className="text-sm text-gray-400 mt-1">
                      Permanently delete all your solutions and reset problem status to "Unsolved". 
                      This action cannot be undone.
                  </p>
              </div>
              <button 
                  onClick={() => setResetModalOpen(true)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition font-medium whitespace-nowrap flex items-center gap-2"
              >
                  <Trash2 size={16} />
                  Reset Stats
              </button>
          </div>
      </div>

      <ConfirmationModal 
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onConfirm={handleResetStats}
          title="Reset All Progress"
          message="This action creates permanent data loss. All your solutions will be deleted and problem statuses reset. This cannot be undone."
          confirmText="Reset Everything"
          isDangerous={true}
          verificationText="delete my progress"
      />
    </div>
  );
}
