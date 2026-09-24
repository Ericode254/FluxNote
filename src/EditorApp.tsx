import { useState, useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";

import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { SignOutButton } from "./SignOutButton";
import { DisplayNameModal } from "./DisplayNameModal";
import { ProfileMenu } from "./ProfileMenu";



interface EditorAppProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function EditorApp({ darkMode, onToggleDark }: EditorAppProps) {
  const { isAuthenticated } = useConvexAuth();
  const [selectedDocId, setSelectedDocId] = useState<Id<"documents"> | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const documents = useQuery(api.documents.list) ?? { owned: [], shared: [] };

  const createDoc = useMutation(api.documents.create);
  const myProfile = useQuery(api.userProfiles.getMyProfile);
  const [showNameModal, setShowNameModal] = useState(false);

  const joinByInviteCode = useMutation(api.documents.joinByInviteCode);

  // Check URL for invite code
  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get("invite");
    if (inviteCode && isAuthenticated) {
      const join = async () => {
        try {
          const docId = await joinByInviteCode({ inviteCode });
          setSelectedDocId(docId);
          // Clean up URL without reload
          const url = new URL(window.location.href);
          url.searchParams.delete("invite");
          window.history.replaceState({}, document.title, url.pathname + url.search);
        } catch (e) {
          console.error("Failed to join document:", e);
        }
      };
      join();
    }
  }, [isAuthenticated, joinByInviteCode]);


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
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#EAE0C8] dark:border-[#3A3323] bg-[#F6F1E7] dark:bg-[#1A160F] shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Flux Note" className="w-8 h-8 rounded-lg shadow-sm" />
            <span className="font-bold text-lg hidden sm:block text-[#201C16] dark:text-[#EDE6D3]">Flux Note</span>

          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] transition-colors"
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
          
          <ProfileMenu onEditProfile={() => setShowNameModal(true)} />
        </div>


      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-64" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden border-r border-[#EAE0C8] dark:border-[#3A3323]`}>
          <Sidebar
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            onCreateDoc={handleCreateDoc}
          />
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-hidden bg-[#F6F1E7] dark:bg-[#1A160F]">
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
      <div className="w-24 h-24 rounded-2xl bg-[#5C6E4E]/10 dark:bg-[#5C6E4E]/20 flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="Flux Note" className="w-16 h-16 opacity-80" />
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-[#201C16] dark:text-[#EDE6D3] mb-1">No document selected</p>
        <p className="text-sm text-[#6B6455] dark:text-[#93876A]">Select a document from the sidebar or create a new one</p>
      </div>
      <button
        onClick={onCreateDoc}
        className="px-5 py-2.5 bg-[#5C6E4E] hover:bg-[#4A5A3D] text-white rounded-lg font-medium transition-colors shadow-sm"
      >
        Create a document
      </button>
    </div>
  );
}
