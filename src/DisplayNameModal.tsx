import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface DisplayNameModalProps {
  currentName?: string;
  onClose: () => void;
}

const ADJECTIVES = ["Swift", "Bright", "Creative", "Silent", "Bold", "Candid", "Epic", "Fluid", "Vibrant", "Keen"];
const NOUNS = ["Writer", "Note", "Flux", "Editor", "Author", "Pen", "Ink", "Spark", "Flow", "Mind"];

export function DisplayNameModal({ currentName, onClose }: DisplayNameModalProps) {
  const [name, setName] = useState(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const setDisplayName = useMutation(api.userProfiles.setDisplayName);

  const handleGenerate = () => {
    const randomName = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
    setName(randomName);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    
    setSaving(true);
    try {
      await setDisplayName({ displayName: trimmed });
      toast.success("Welcome, " + trimmed + "!");
      onClose();
    } catch {
      toast.error("Failed to save display name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#2A2A3B] w-full max-w-sm rounded-2xl shadow-2xl border border-[#E0E0E0] dark:border-[#3A3A4E] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#4F91FF]/10 dark:bg-[#4F91FF]/20 flex items-center justify-center text-2xl shadow-inner">
              ✍️
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1C1C1C] dark:text-[#EAEAEA]">Welcome to Flux Note</h3>
              <p className="text-sm text-[#555555] dark:text-[#AAAAAA]">Choose how you'll appear to others</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-1.5 ml-1">
                Display Name
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your collaborator name..."
                  maxLength={30}
                  className="w-full px-4 py-2.5 bg-[#F5F5F5] dark:bg-[#1E1E2F] border border-[#E0E0E0] dark:border-[#3A3A4E] rounded-xl text-[#1C1C1C] dark:text-[#EAEAEA] placeholder-[#555555]/50 outline-none focus:ring-2 focus:ring-[#4F91FF]/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#4F91FF] hover:bg-[#4F91FF]/10 rounded-lg transition-colors"
                  title="Generate random name"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {currentName && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#3A3A4E] text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="flex-[2] py-2.5 bg-[#4F91FF] hover:bg-[#3a7de8] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-[#4F91FF]/20 text-sm"
              >
                {saving ? "Saving…" : "Start Writing"}
              </button>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-[#F5F5F5] dark:bg-[#1E1E2F] border-t border-[#E0E0E0] dark:border-[#3A3A4E]">
          <p className="text-[11px] text-center text-[#555555] dark:text-[#AAAAAA] leading-relaxed">
            Collaboration is better with names. This name will appear on your cursor in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
