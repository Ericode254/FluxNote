import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface InviteButtonProps {
  inviteCode: string;
  docId: Id<"documents">;
}

export function InviteButton({ inviteCode, docId }: InviteButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const regenerate = useMutation(api.documents.regenerateInviteCode);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate({ id: docId });
      toast.success("New invite link generated");
    } catch {
      toast.error("Failed to regenerate link");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#4F91FF]/10 dark:bg-[#4F91FF]/20 text-[#4F91FF] hover:bg-[#4F91FF]/20 dark:hover:bg-[#4F91FF]/30 transition-colors border border-[#4F91FF]/20"
        title="Invite collaborators"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="hidden sm:inline">Invite</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2A2A3B] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[#E0E0E0] dark:border-[#3A3A4E]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4F91FF]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#4F91FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#1C1C1C] dark:text-[#EAEAEA]">Invite collaborators</h3>
                  <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">Share this link to collaborate in real time</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors text-[#555555] dark:text-[#AAAAAA]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Link display */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-[#F5F5F5] dark:bg-[#1E1E2F] border border-[#E0E0E0] dark:border-[#3A3A4E] text-sm text-[#555555] dark:text-[#AAAAAA] truncate font-mono">
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  copied
                    ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30"
                    : "bg-[#4F91FF] hover:bg-[#3a7de8] text-white"
                }`}
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FF9500]/10 dark:bg-[#FF9500]/10 border border-[#FF9500]/20 mb-4">
              <svg className="w-4 h-4 text-[#FF9500] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-[#FF9500]">Anyone with this link can view and edit this document.</p>
            </div>

            <button
              onClick={handleRegenerate}
              className="w-full px-4 py-2 rounded-lg border border-[#E0E0E0] dark:border-[#3A3A4E] text-sm text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors font-medium"
            >
              🔄 Generate new link (revokes old one)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
