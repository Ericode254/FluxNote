import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface SidebarProps {
  documents: {
    owned: Doc<"documents">[];
    shared: (Doc<"documents"> & { role: "read" | "write" })[];
  };
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

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {/* Owned Documents */}
        <div>
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-2">
            My Documents
          </h3>
          {!documents?.owned || documents.owned.length === 0 ? (
            <p className="px-3 text-xs text-[#555555]/60 italic">No personal documents</p>
          ) : (
            <ul className="space-y-0.5">
              {documents.owned.map((doc) => (
                <DocumentItem
                  key={doc._id}
                  doc={doc}
                  isSelected={selectedDocId === doc._id}
                  onSelect={() => onSelectDoc(doc._id)}
                  onDelete={(e) => handleDelete(e, doc._id)}
                  deletingId={deletingId}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Shared Documents */}
        <div>
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#555555] dark:text-[#AAAAAA] mb-2">
            Shared with Me
          </h3>
          {!documents?.shared || documents.shared.length === 0 ? (
            <p className="px-3 text-xs text-[#555555]/60 italic">No shared documents</p>
          ) : (
            <ul className="space-y-0.5">
              {documents.shared.map((doc) => (
                <DocumentItem
                  key={doc._id}
                  doc={doc}
                  isSelected={selectedDocId === doc._id}
                  onSelect={() => onSelectDoc(doc._id)}
                  role={doc.role}
                />
              ))}
            </ul>
          )}
        </div>

      </div>

    </div>
  );
}

function DocumentItem({
  doc,
  isSelected,
  onSelect,
  onDelete,
  deletingId,
  role,
}: {
  doc: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  deletingId?: Id<"documents"> | null;
  role?: "read" | "write";
}) {
  return (
    <li>
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect();
          }
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group flex items-center justify-between gap-2 cursor-pointer ${
          isSelected
            ? "bg-[#4F91FF]/10 dark:bg-[#4F91FF]/20 text-[#4F91FF]"
            : "hover:bg-[#F5F5F5] dark:hover:bg-[#3A3A4E] text-[#1C1C1C] dark:text-[#EAEAEA]"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="truncate font-medium">{doc.title}</span>
          {role === "read" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase font-bold">
              Read
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deletingId === doc._id}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#FF5F5F]/10 hover:text-[#FF5F5F] transition-all flex-shrink-0"
            title="Delete document"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

