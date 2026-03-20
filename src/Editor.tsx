import { useState, useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { PresenceIndicator } from "./PresenceIndicator";
import { InviteButton } from "./InviteButton";
import { toast } from "sonner";
import { BlockNoteEditorWrapper } from "./BlockNoteEditorWrapper";

interface EditorProps {
  docId: Id<"documents">;
  darkMode: boolean;
}

export function Editor({ docId, darkMode }: EditorProps) {
  const doc = useQuery(api.documents.get, { id: docId });
  const updateTitle = useMutation(api.documents.updateTitle);
  const { isAuthenticated } = useConvexAuth();
  const myProfile = useQuery(api.userProfiles.getMyProfile);

  const [localTitle, setLocalTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState(false);
  const lastSavedTitleRef = { current: "" };

  useEffect(() => {
    if (doc) {
      setLocalTitle(doc.title);
      lastSavedTitleRef.current = doc.title;
    }
  }, [doc?.title]);

  const handleTitleSave = async () => {
    setEditingTitle(false);
    const title = localTitle.trim() || "Untitled";
    setLocalTitle(title);
    try {
      await updateTitle({ id: docId, title });
    } catch {
      toast.error("Failed to update title");
    }
  };

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F91FF]"></div>
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex items-center justify-center text-[#555555] dark:text-[#AAAAAA]">
        Document not found
      </div>
    );
  }

  const displayName = myProfile?.displayName ?? "Anonymous";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#2A2A3B]">
      {/* Document header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E0E0E0] dark:border-[#3A3A4E] bg-white dark:bg-[#2A2A3B] flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setLocalTitle(doc.title);
                  setEditingTitle(false);
                }
              }}
              className="text-lg font-semibold bg-transparent border-b-2 border-[#4F91FF] outline-none flex-1 min-w-0 text-[#1C1C1C] dark:text-[#EAEAEA]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-lg font-semibold text-[#1C1C1C] dark:text-[#EAEAEA] hover:text-[#4F91FF] dark:hover:text-[#4F91FF] transition-colors truncate text-left"
              title="Click to rename"
            >
              {localTitle || "Untitled"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Presence */}
          {isAuthenticated && <PresenceIndicator roomId={docId} />}

          {/* Invite */}
          {doc.inviteCode && (
            <InviteButton inviteCode={doc.inviteCode} docId={docId} />
          )}
        </div>
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden">
        <BlockNoteEditorWrapper
          key={docId}
          docId={docId}
          darkMode={darkMode}
          displayName={displayName}
        />
      </div>
    </div>
  );
}
