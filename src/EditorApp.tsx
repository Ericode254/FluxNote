import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { SignOutButton } from "./SignOutButton";
import { DisplayNameModal } from "./DisplayNameModal";

interface EditorAppProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function EditorApp({ darkMode, onToggleDark }: EditorAppProps) {
  const [selectedDocId, setSelectedDocId] = useState<Id<"documents"> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const documents = useQuery(api.documents.list) ?? [];
  const createDoc = useMutation(api.documents.create);
  const myProfile = useQuery(api.userProfiles.getMyProfile);
  const [showNameModal, setShowNameModal] = useState(false);

  const getByInviteCode = useQuery(api.documents.getByInviteCode, { 
    inviteCode: new URLSearchParams(window.location.search).get("invite") ?? "" 
  });

  // Check URL for invite code
  useEffect(() => {
    if (getByInviteCode) {
      setSelectedDocId(getByInviteCode._id);
      // Clean up URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, [getByInviteCode]);

  // Show name modal if no display name set
  useEffect(() => {
    if (myProfile === null && !showNameModal) {
      setShowNameModal(true);
    }
  }, [myProfile, showNameModal]);

  const handleCreateDoc = async () => {
    const id = await createDoc({ title: "Untitled Document" });
    setSelectedDocId(id);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#E0E0E0] dark:border-[#3A3A4E] bg-white dark:bg-[#2A2A3B] shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="font-bold text-lg hidden sm:block text-[#1C1C1C] dark:text-[#EAEAEA]">CollabMD</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Display name button */}
          {myProfile && (
            <button
              onClick={() => setShowNameModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#555555] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors border border-[#E0E0E0] dark:border-[#3A3A4E]"
              title="Change display name"
            >
              <span className="w-5 h-5 rounded-full bg-[#4F91FF] text-white text-xs flex items-center justify-center font-bold">
                {myProfile.displayName[0]?.toUpperCase()}
              </span>
              <span className="max-w-[100px] truncate">{myProfile.displayName}</span>
            </button>
          )}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] transition-colors"
            title="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden border-r border-[#E0E0E0] dark:border-[#3A3A4E]`}>
          <Sidebar
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            onCreateDoc={handleCreateDoc}
          />
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-hidden bg-[#F5F5F5] dark:bg-[#1E1E2F]">
          {selectedDocId ? (
            <Editor docId={selectedDocId} darkMode={darkMode} />
          ) : (
            <EmptyState onCreateDoc={handleCreateDoc} />
          )}
        </div>
      </div>

      {showNameModal && (
        <DisplayNameModal
          currentName={myProfile?.displayName}
          onClose={() => setShowNameModal(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreateDoc }: { onCreateDoc: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-24 h-24 rounded-2xl bg-[#4F91FF]/10 dark:bg-[#4F91FF]/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-[#4F91FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-[#1C1C1C] dark:text-[#EAEAEA] mb-1">No document selected</p>
        <p className="text-sm text-[#555555] dark:text-[#AAAAAA]">Select a document from the sidebar or create a new one</p>
      </div>
      <button
        onClick={onCreateDoc}
        className="px-5 py-2.5 bg-[#4F91FF] hover:bg-[#3a7de8] text-white rounded-lg font-medium transition-colors shadow-sm"
      >
        Create a document
      </button>
    </div>
  );
}
