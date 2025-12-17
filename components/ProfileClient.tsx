"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/auth";
import { resetUserStats } from "@/actions/problem";
import ConfirmationModal from "./ConfirmationModal";
import { Loader2, User, Lock, Save, AlertCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { LANGUAGES } from "@/lib/constants";
import { Select } from "./ui/SelectUtils";

export default function ProfileClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
      isOpen: boolean;
      type: 'resetStats' | 'deleteData' | 'deleteAccount' | null;
  }>({ isOpen: false, type: null });

  const [defaultLang, setDefaultLang] = useState((session?.user as any)?.defaultLanguage || "");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await updateProfile(formData);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile updated successfully");
      const newName = formData.get("name") as string;
      const newLang = formData.get("defaultLanguage") as string;
      
      if (session) {
        await update({ name: newName, defaultLanguage: newLang });
      }
      
       const form = document.querySelector("form") as HTMLFormElement;
       if(form) form.reset();
    }
  }

  const handleAction = async () => {
      if (!modalConfig.type) return;

      if (modalConfig.type === 'resetStats') {
          const res = await resetUserStats();
          if ('error' in res) {
              toast.error(res.error || "Failed to reset progress");
          } else {
              toast.success("Progress reset successfully");
              router.refresh();
          }
      } 
      else if (modalConfig.type === 'deleteData') {
          const { deleteAllData } = await import("@/actions/problem");
          const res = await deleteAllData();
          if ('error' in res) {
              toast.error(res.error || "Failed to delete data");
          } else {
              toast.success("All problems and solutions deleted");
              router.refresh();
          }
      }
      else if (modalConfig.type === 'deleteAccount') {
          const { deleteAccount } = await import("@/actions/auth");
          const res = await deleteAccount();
          if ('error' in res) {
              toast.error(res.error || "Failed to delete account");
          } else {
              toast.success("Account deleted. Goodbye!");
              // Force hard redirect to cleanup state
              window.location.href = "/login"; 
          }
      }

      setModalConfig({ isOpen: false, type: null });
  };

  const getModalProps = () => {
      switch (modalConfig.type) {
          case 'resetStats':
              return {
                  title: "Reset Progress",
                  message: "This will effectively reset your progress to 0%. All solutions will be deleted and problem statuses reset to 'Todo'. This cannot be undone.",
                  confirmText: "Reset Progress",
                  verificationText: "delete my progress"
              };
          case 'deleteData':
              return {
                  title: "Delete All Data",
                  message: "Permanently delete ALL your problems and solutions. Your account will remain, but your dashboard will be empty. This cannot be undone.",
                  confirmText: "Delete Everything",
                  verificationText: "delete all data"
              };
          case 'deleteAccount':
              return {
                  title: "Delete Account",
                  message: "Permanently delete your account and all associated data. You will be logged out immediately. This cannot be undone.",
                  confirmText: "Delete Account",
                  verificationText: "delete my account"
              };
          default:
              return {
                  title: "",
                  message: "",
                  confirmText: "",
                  verificationText: ""
              };
      }
  };

  if (!session) return null;
  const modalProps = getModalProps();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* ... keeping existing header and form ... */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <form action={handleSubmit} className="space-y-6">
          {/* ... existing form fields ... */}
          
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

          {/* Default Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Default Language</label>
            <div className="relative">
                <input type="hidden" name="defaultLanguage" value={defaultLang} />
                <Select
                    options={LANGUAGES}
                    value={defaultLang}
                    onChange={setDefaultLang}
                    placeholder="Select default language"
                />
            </div>
            <p className="text-xs text-gray-500">This will be pre-selected when you add new solutions.</p>
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
          
          <div className="flex flex-col gap-6">
              {/* Reset Progress */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                      <p className="text-white font-medium">Reset Progress</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-md">
                          Permanently delete all solutions and reset problem statuses to "Unsolved".
                      </p>
                  </div>
                  <button 
                      onClick={() => setModalConfig({ isOpen: true, type: 'resetStats' })}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition font-medium whitespace-nowrap flex items-center gap-2"
                  >
                      <Trash2 size={16} />
                      Reset Stats
                  </button>
              </div>

              <div className="h-px bg-red-500/10"></div>

              {/* Delete All Data */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                      <p className="text-white font-medium">Delete All Data</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-md">
                          Permanently delete ALL problems and solutions. Your dashboard will be empty.
                      </p>
                  </div>
                  <button 
                      onClick={() => setModalConfig({ isOpen: true, type: 'deleteData' })}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition font-medium whitespace-nowrap flex items-center gap-2"
                  >
                      <Trash2 size={16} />
                      Delete Everything
                  </button>
              </div>

              <div className="h-px bg-red-500/10"></div>

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                      <p className="text-white font-medium">Delete Account</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-md">
                          Permanently delete your account and all associated data. You will be logged out.
                      </p>
                  </div>
                  <button 
                      onClick={() => setModalConfig({ isOpen: true, type: 'deleteAccount' })}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition font-medium whitespace-nowrap flex items-center gap-2"
                  >
                      <Trash2 size={16} />
                      Delete Account
                  </button>
              </div>
          </div>
      </div>

      <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={handleAction}
          title={modalProps.title}
          message={modalProps.message}
          confirmText={modalProps.confirmText}
          isDangerous={true}
          verificationText={modalProps.verificationText}
      />
    </div>
  );
}
