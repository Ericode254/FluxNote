import { useState } from "react";
import { useQuery, useMutation } from "convex/react";

import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface InviteButtonProps {
  readInviteCode?: string;
  writeInviteCode?: string;
  docId: Id<"documents">;
  isOwner: boolean;
}


export function InviteButton({ readInviteCode, writeInviteCode, docId, isOwner }: InviteButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copiedType, setCopiedType] = useState<"read" | "write" | null>(null);
  const regenerate = useMutation(api.documents.regenerateInviteCode);
  const removeAccess = useMutation(api.documents.removeAccess);
  const collaborators = useQuery(api.documents.listAccess, { documentId: docId });

  const getInviteUrl = (code?: string) => 
    code ? `${window.location.origin}${window.location.pathname}?invite=${code}` : "";

  const handleCopy = async (type: "read" | "write", code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(getInviteUrl(code));
      setCopiedType(type);
      toast.success(`${type === "read" ? "View" : "Edit"} link copied!`);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate({ id: docId });
      toast.success("Invite links regenerated");
    } catch {
      toast.error("Failed to regenerate links");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeAccess({ documentId: docId, userId });
      toast.success("User removed from document");
    } catch {
      toast.error("Failed to remove user");
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

            {/* Link sections */}
            <div className="space-y-4 mb-6">
              {/* Can View */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-2 px-1">
                  Can View
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1E1E2F] border border-[#E0E0E0] dark:border-[#3A3A4E] text-xs text-[#555555] dark:text-[#AAAAAA] truncate font-mono">
                    {getInviteUrl(readInviteCode)}
                  </div>
                  <button
                    onClick={() => handleCopy("read", readInviteCode)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                      copiedType === "read"
                        ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30"
                        : "bg-[#4F91FF] hover:bg-[#3a7de8] text-white"
                    }`}
                  >
                    {copiedType === "read" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Can Edit */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-2 px-1">
                  Can Edit
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-[#F5F5F5] dark:bg-[#1E1E2F] border border-[#E0E0E0] dark:border-[#3A3A4E] text-xs text-[#555555] dark:text-[#AAAAAA] truncate font-mono">
                    {getInviteUrl(writeInviteCode)}
                  </div>
                  <button
                    onClick={() => handleCopy("write", writeInviteCode)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                      copiedType === "write"
                        ? "bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30"
                        : "bg-[#4F91FF] hover:bg-[#3a7de8] text-white"
                    }`}
                  >
                    {copiedType === "write" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Collaborators Section (Only for Owner) */}
            {isOwner && collaborators && collaborators.length > 0 && (
              <div className="mb-6 pt-5 border-t border-[#E0E0E0] dark:border-[#3A3A4E]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-3 px-1">
                  Who has access
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {collaborators.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#F5F5F5]/50 dark:bg-[#1E1E2F]/50 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#4F91FF]/10 flex items-center justify-center text-[10px] font-bold text-[#4F91FF] flex-shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1C1C1C] dark:text-[#EAEAEA] truncate">{u.name}</p>
                          <p className="text-[10px] text-[#555555] dark:text-[#AAAAAA] uppercase font-bold">{u.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(u.userId)}
                        className="p-1.5 rounded-lg hover:bg-[#FF5F5F]/10 text-[#FF5F5F] transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove user"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRegenerate}
              className="w-full px-4 py-2 rounded-lg border border-[#E0E0E0] dark:border-[#3A3A4E] text-xs text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors font-medium"
            >
              🔄 Regenerate all links
            </button>

          </div>
        </div>
      )}
    </>
  );
}
