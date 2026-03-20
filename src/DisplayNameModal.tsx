import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface DisplayNameModalProps {
  currentName?: string;
  onClose: () => void;
}

export function DisplayNameModal({ currentName, onClose }: DisplayNameModalProps) {
  const [name, setName] = useState(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const setDisplayName = useMutation(api.userProfiles.setDisplayName);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await setDisplayName({ displayName: trimmed });
      toast.success("Display name saved!");
      onClose();
    } catch {
      toast.error("Failed to save display name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#2A2A3B] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[#E0E0E0] dark:border-[#3A3A4E]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#4F91FF]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#4F91FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-[#1C1C1C] dark:text-[#EAEAEA]">
              {currentName ? "Change display name" : "Set your display name"}
            </h3>
            <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">
              This is shown to collaborators on your cursor
            </p>
          </div>
        </div>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape" && currentName) onClose();
          }}
          placeholder="Your name..."
          maxLength={30}
          className="w-full px-4 py-2.5 rounded-lg border border-[#E0E0E0] dark:border-[#3A3A4E] bg-[#F5F5F5] dark:bg-[#1E1E2F] text-[#1C1C1C] dark:text-[#EAEAEA] outline-none focus:border-[#4F91FF] focus:ring-1 focus:ring-[#4F91FF] transition-all mb-4"
        />

        <div className="flex gap-2">
          {currentName && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#E0E0E0] dark:border-[#3A3A4E] text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 rounded-lg bg-[#4F91FF] hover:bg-[#3a7de8] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
