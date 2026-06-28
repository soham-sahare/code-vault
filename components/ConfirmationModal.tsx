
import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  verificationText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  verificationText
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = verificationText ? inputValue !== verificationText : false;

  const handleClose = () => {
      setInputValue("");
      onClose();
  };

  const handleConfirm = () => {
      onConfirm();
      handleClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 bg-[#0a0a0a] animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isDangerous ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-lg transition text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>

        {verificationText && (
            <div className="mb-6 space-y-2">
                <label className="text-sm text-gray-400 block">
                    Type <span className="text-white font-mono bg-white/10 px-1 py-0.5 rounded select-none">{verificationText}</span> to confirm:
                </label>
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Type the confirmation phrase"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
            </div>
        )}

        <div className="flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition font-medium"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-6 py-2 rounded-lg text-white font-medium transition shadow-lg flex items-center gap-2 ${
                isDangerous 
                ? "bg-red-600 hover:bg-red-500 shadow-red-500/20 disabled:bg-red-600/50 disabled:cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 disabled:bg-blue-600/50 disabled:cursor-not-allowed"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
