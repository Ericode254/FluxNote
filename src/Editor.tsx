import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { PresenceIndicator } from "./PresenceIndicator";
import { InviteButton } from "./InviteButton";
import { toast } from "sonner";
import { BlockNoteEditorWrapper, BlockNoteEditorWrapperHandle, SyncStatus } from "./BlockNoteEditorWrapper";
import { ErrorBoundary } from "./ErrorBoundary";


interface EditorProps {
  docId: Id<"documents">;
  darkMode: boolean;
}

export function Editor({ docId, darkMode }: EditorProps) {
  const doc = useQuery(api.documents.get, { id: docId });
  const updateTitle = useMutation(api.documents.updateTitle);
  const resetDocument = useMutation(api.documents.resetDocument);
  const { isAuthenticated } = useConvexAuth();
  const myProfile = useQuery(api.userProfiles.getMyProfile);
  const editorRef = useRef<BlockNoteEditorWrapperHandle>(null);

  const [localTitle, setLocalTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const lastSavedTitleRef = { current: "" };

  useEffect(() => {
    if (doc) {
      setLocalTitle(doc.title);
      lastSavedTitleRef.current = doc.title;
    }
  }, [doc?.title]);

  useEffect(() => {
    setSyncStatus("saved");
  }, [docId]);

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

  const handleReset = async () => {
    try {
      await resetDocument({ id: docId });
      toast.success("Document reset. Structure fixed.");
    } catch {
      toast.error("Failed to reset document");
    }
  };

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C6E4E]"></div>
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex items-center justify-center text-[#6B6455] dark:text-[#93876A]">
        Document not found
      </div>
    );
  }

  const displayName = myProfile?.displayName ?? "Anonymous";

  return (
    <div className="h-full flex flex-col bg-[#F6F1E7] dark:bg-[#1A160F]">
      {/* Document header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EAE0C8] dark:border-[#3A3323] bg-[#F6F1E7] dark:bg-[#1A160F] flex-shrink-0">
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
              className="text-lg font-semibold bg-transparent border-b-2 border-[#5C6E4E] outline-none flex-1 min-w-0 text-[#201C16] dark:text-[#EDE6D3]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-lg font-semibold text-[#201C16] dark:text-[#EDE6D3] hover:text-[#5C6E4E] dark:hover:text-[#5C6E4E] transition-colors truncate text-left"
              title="Click to rename"
            >
              {localTitle || "Untitled"}
            </button>
          )}
          {!doc.role || doc.role === "write" ? (
            <SyncStatusBadge status={syncStatus} />
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download */}
          <button
            onClick={() => editorRef.current?.downloadMarkdown(localTitle)}
            className="p-2 rounded-lg hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] text-[#6B6455] dark:text-[#93876A] transition-colors"
            title="Download as Markdown"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* Presence */}
          {isAuthenticated && <PresenceIndicator roomId={docId} />}


          {/* Invite */}
          {(doc.readInviteCode || doc.writeInviteCode) && (
            <InviteButton 
              readInviteCode={doc.readInviteCode} 
              writeInviteCode={doc.writeInviteCode} 
              docId={docId} 
              isOwner={doc.isOwner}
            />
          )}
        </div>
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden relative">
        <ErrorBoundary 
          key={docId}
          onReset={handleReset}
        >
          <BlockNoteEditorWrapper
            key={docId}
            ref={editorRef}
            docId={docId}
            darkMode={darkMode}
            displayName={displayName}
            readOnly={doc.role === "read"}
            onSyncStatusChange={setSyncStatus}
          />

        </ErrorBoundary>
      </div>

    </div>
  );
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  return (
    <span
      className={`font-mono hidden sm:flex items-center gap-1.5 text-xs flex-shrink-0 transition-colors ${
        status === "saving"
          ? "text-[#6B6455] dark:text-[#93876A]"
          : "text-[#6B7F4F]"
      }`}
    >
      {status === "saving" ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Saving…
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </>
      )}
    </span>
  );
}
