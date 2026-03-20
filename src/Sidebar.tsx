import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface SidebarProps {
  documents: Doc<"documents">[];
  selectedDocId: Id<"documents"> | null;
  onSelectDoc: (id: Id<"documents">) => void;
  onCreateDoc: () => void;
}

export function Sidebar({ documents, selectedDocId, onSelectDoc, onCreateDoc }: SidebarProps) {
  const removeDoc = useMutation(api.documents.remove);
  const [deletingId, setDeletingId] = useState<Id<"documents"> | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: Id<"documents">) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await removeDoc({ id });
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#2A2A3B]">
      <div className="p-3 border-b border-[#E0E0E0] dark:border-[#3A3A4E]">
        <button
          onClick={onCreateDoc}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4F91FF] hover:bg-[#3a7de8] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="text-center mt-8 px-4">
            <div className="w-10 h-10 rounded-xl bg-[#4F91FF]/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#4F91FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#555555] dark:text-[#AAAAAA]">
              No documents yet.<br />Create one to get started!
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((doc) => (
              <li key={doc._id}>
                <div
                  onClick={() => onSelectDoc(doc._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectDoc(doc._id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group flex items-center justify-between gap-2 cursor-pointer ${
                    selectedDocId === doc._id
                      ? "bg-[#4F91FF]/10 dark:bg-[#4F91FF]/20 text-[#4F91FF]"
                      : "hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] text-[#1C1C1C] dark:text-[#EAEAEA]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate font-medium">{doc.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc._id)}
                    disabled={deletingId === doc._id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#FF5F5F]/10 hover:text-[#FF5F5F] transition-all flex-shrink-0"
                    title="Delete document"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
